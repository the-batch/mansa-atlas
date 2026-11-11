import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archetypeProfiles, sampleQuestions } from '../src/data/questions.js';
import {
    participantReportSchema,
    participantSubmissionSchema,
    type FinancialProfile,
    type ParticipantResult
} from '../src/types/participant.js';
import { type Archetype, type QcmAnswer } from '../src/types/qcm.js';
import { createReportPdf } from './report.js';

const projectRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const csvDirectory = resolve(projectRoot, 'csv');
const distDirectory = resolve(projectRoot, 'dist');
const isDevelopment = process.argv.includes('--dev');
const port = Number(process.env.PORT ?? 3000);
const maxRequestSize = 16 * 1024;

const csvFields = [
    ['Prénoms', 'firstName'],
    ['Nom', 'lastName'],
    ['Téléphone', 'phone'],
    ['Adresse e-mail', 'email']
] as const;

const reportCsvFields = [
    ['Patrimoine financier estimé', 'wealthRange'],
    ['Objectifs de placement', 'investmentGoals'],
    ['Tolérance au risque', 'riskTolerance'],
    ['Expérience des marchés financiers', 'marketExperience'],
    ['Fréquence d’investissement envisagée', 'investmentFrequency']
] as const satisfies readonly [string, keyof FinancialProfile][];

const csvHeaders = [
    ...csvFields.map(([label]) => label),
    'Profil obtenu',
    'Date et heure de participation'
];

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
    });
    response.end(JSON.stringify(body));
}

async function readRequestBody(request: IncomingMessage): Promise<string | null> {
    const declaredSize = Number(request.headers['content-length'] ?? 0);
    if (declaredSize > maxRequestSize) {
        request.resume();
        return null;
    }

    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;

    for await (const chunk of request) {
        const buffer = Buffer.from(chunk);
        size += buffer.length;
        if (size > maxRequestSize) {
            tooLarge = true;
        } else if (!tooLarge) {
            chunks.push(buffer);
        }
    }

    return tooLarge ? null : Buffer.concat(chunks).toString('utf8');
}

async function readJsonPayload(
    request: IncomingMessage,
    response: ServerResponse
): Promise<unknown | null> {
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Méthode non autorisée.' });
        return null;
    }

    if (!request.headers['content-type']?.includes('application/json')) {
        sendJson(response, 415, { error: 'La requête doit être envoyée au format JSON.' });
        return null;
    }

    const body = await readRequestBody(request);
    if (body === null) {
        sendJson(response, 413, { error: 'La requête envoyée est trop volumineuse.' });
        return null;
    }

    try {
        return JSON.parse(body) as unknown;
    } catch {
        sendJson(response, 400, { error: 'Le contenu de la requête est invalide.' });
        return null;
    }
}

function calculateReportScores(answers: QcmAnswer[]) {
    const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.archetype]));
    const validAnswers = answers.length === sampleQuestions.length
        && answerByQuestion.size === sampleQuestions.length
        && sampleQuestions.every((question) => {
            const archetype = answerByQuestion.get(question.id);
            return archetype !== undefined
                && question.options.some((option) => option.archetype === archetype);
        });

    if (!validAnswers) {
        return null;
    }

    const scores: Record<Archetype, number> = {
        createur: 0,
        visionnaire: 0,
        passeur: 0,
        continuateur: 0,
        semeur: 0
    };
    const answerHistory = sampleQuestions.map((question) => {
        const archetype = answerByQuestion.get(question.id)!;
        const weight = question.weight ?? 1;
        scores[archetype] += weight;
        return { archetype, weight };
    });
    const highestScore = Math.max(...Object.values(scores));
    const leadingArchetypes = Object.entries(scores)
        .filter(([, score]) => score === highestScore)
        .map(([archetype]) => archetype as Archetype);
    const result = leadingArchetypes.length === 1
        ? leadingArchetypes[0]
        : [...answerHistory]
            .sort((first, second) => second.weight - first.weight)
            .find(({ archetype }) => leadingArchetypes.includes(archetype))?.archetype
            ?? leadingArchetypes[0];

    return {
        result,
        scores,
        totalScore: Object.values(scores).reduce((total, score) => total + score, 0)
    };
}

function safeCsvValue(value: string) {
    return /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string) {
    const safeValue = safeCsvValue(value);
    return `"${safeValue.replaceAll('"', '""')}"`;
}

function makeCsvRow(values: string[]) {
    return values.map(csvCell).join(';');
}

function parseCsv(contents: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let inQuotes = false;

    for (let index = 0; index < contents.length; index += 1) {
        const character = contents[index];
        if (inQuotes) {
            if (character === '"' && contents[index + 1] === '"') {
                cell += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
            } else {
                cell += character;
            }
        } else if (character === '"' && cell.length === 0) {
            inQuotes = true;
        } else if (character === ';') {
            row.push(cell);
            cell = '';
        } else if (character === '\n') {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = '';
        } else if (character !== '\r') {
            cell += character;
        }
    }

    if (cell.length > 0 || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }
    return rows;
}

async function updateParticipantCsv(
    submissionId: string,
    participant: { firstName: string; lastName: string; phone: string; email: string },
    result: ParticipantResult,
    financialProfile: FinancialProfile
) {
    const filePath = resolve(csvDirectory, `participant-${submissionId}.csv`);
    const contents = await readFile(filePath, 'utf8');
    const rows = parseCsv(contents.replace(/^\uFEFF/, ''));
    const fullHeaders = [
        ...csvHeaders,
        ...reportCsvFields.map(([label]) => label)
    ];
    const baseValues = [
        participant.firstName,
        participant.lastName,
        participant.phone,
        participant.email,
        archetypeProfiles[result].name
    ];

    if (
        rows.length !== 2
        || (rows[0].join('\0') !== csvHeaders.join('\0') && rows[0].join('\0') !== fullHeaders.join('\0'))
        || rows[1].length !== rows[0].length
        || baseValues.some((value, index) => rows[1][index] !== safeCsvValue(value))
    ) {
        throw new Error('Le fichier CSV du diagnostic est introuvable ou invalide.');
    }

    const profileValues = reportCsvFields.map(([, field]) => {
        const value = financialProfile[field];
        return Array.isArray(value) ? value.join(', ') : value;
    });
    const updatedContents = `\uFEFF${makeCsvRow(fullHeaders)}\r\n${makeCsvRow([
        ...rows[1].slice(0, csvHeaders.length),
        ...profileValues
    ])}\r\n`;
    const temporaryFilePath = resolve(csvDirectory, `.participant-${submissionId}-${randomUUID()}.tmp`);
    try {
        await writeFile(temporaryFilePath, updatedContents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
        await rename(temporaryFilePath, filePath);
    } catch (error) {
        try {
            await unlink(temporaryFilePath);
        } catch (cleanupError) {
            if (!(cleanupError instanceof Error && 'code' in cleanupError && cleanupError.code === 'ENOENT')) {
                throw cleanupError;
            }
        }
        throw error;
    }
}

async function saveParticipant(request: IncomingMessage, response: ServerResponse) {
    const payload = await readJsonPayload(request, response);
    if (payload === null) return;
    const result = participantSubmissionSchema.safeParse(payload);
    if (!result.success) {
        sendJson(response, 400, {
            error: 'Veuillez corriger les informations du formulaire.',
            issues: result.error.issues.map(({ path, message }) => ({
                field: path[0],
                message
            }))
        });
        return;
    }

    const { submissionId, participant, result: submittedResult, answers } = result.data;
    const reportScores = calculateReportScores(answers);
    if (!reportScores) {
        sendJson(response, 400, { error: 'Les réponses envoyées ne correspondent pas au diagnostic.' });
        return;
    }

    if (submittedResult !== reportScores.result) {
        sendJson(response, 400, { error: 'Le résultat envoyé ne correspond pas aux réponses du diagnostic.' });
        return;
    }

    const profile = archetypeProfiles[reportScores.result];
    const values = csvFields.map(([, field]) => {
        const value = participant[field];
        return Array.isArray(value) ? value.join(', ') : value;
    });
    const row = [...values, profile.name, new Date().toISOString()];
    const contents = `\uFEFF${makeCsvRow(csvHeaders)}\r\n${makeCsvRow(row)}\r\n`;
    const filePath = resolve(csvDirectory, `participant-${submissionId}.csv`);

    try {
        await mkdir(csvDirectory, { recursive: true, mode: 0o700 });
        await writeFile(filePath, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) {
            console.error('Unable to save participant CSV:', error);
            sendJson(response, 500, { error: 'Impossible d’enregistrer le formulaire. Veuillez réessayer.' });
            return;
        }
    }

    sendJson(response, 201, { message: 'Diagnostic enregistré.' });
}

async function downloadParticipantReport(request: IncomingMessage, response: ServerResponse) {
    const payload = await readJsonPayload(request, response);
    if (payload === null) return;
    const parsed = participantReportSchema.safeParse(payload);
    if (!parsed.success) {
        sendJson(response, 400, {
            error: 'Les informations du bilan sont invalides.',
            issues: parsed.error.issues.map(({ path, message }) => ({
                field: path[0],
                message
            }))
        });
        return;
    }

    const reportScores = calculateReportScores(parsed.data.answers);
    if (!reportScores) {
        sendJson(response, 400, { error: 'Les réponses envoyées ne correspondent pas au diagnostic.' });
        return;
    }
    if (parsed.data.result !== reportScores.result) {
        sendJson(response, 400, { error: 'Le résultat envoyé ne correspond pas aux réponses du diagnostic.' });
        return;
    }

    try {
        const report = await createReportPdf({
            ...parsed.data,
            ...reportScores
        });
        await updateParticipantCsv(
            parsed.data.submissionId,
            parsed.data.participant,
            parsed.data.result,
            parsed.data.financialProfile
        );
        response.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="bilan-patrimonial-mansa-capital.pdf"',
            'Content-Length': report.length,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(report);
    } catch (error) {
        console.error('Unable to generate participant PDF report:', error);
        sendJson(response, 500, {
            error: 'Impossible de préparer votre bilan et de mettre à jour vos informations. Veuillez réessayer.'
        });
    }
}

const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
};

async function serveStatic(request: IncomingMessage, response: ServerResponse) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405).end();
        return;
    }

    let pathname: string;
    try {
        pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end();
        return;
    }

    const requestedFile = resolve(distDirectory, `.${pathname}`);
    if (requestedFile !== distDirectory && !requestedFile.startsWith(`${distDirectory}${sep}`)) {
        response.writeHead(403).end();
        return;
    }

    let filePath = requestedFile;
    try {
        if (!(await stat(filePath)).isFile()) {
            filePath = resolve(distDirectory, 'index.html');
        }
    } catch {
        if (extname(pathname)) {
            response.writeHead(404).end();
            return;
        }
        filePath = resolve(distDirectory, 'index.html');
    }

    try {
        const contents = await readFile(filePath);
        response.writeHead(200, {
            'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        response.end(request.method === 'HEAD' ? undefined : contents);
    } catch (error) {
        console.error('Unable to serve application file:', error);
        response.writeHead(500).end();
    }
}

async function handleRequest(request: IncomingMessage, response: ServerResponse) {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (pathname === '/csv' || pathname.startsWith('/csv/')) {
        response.writeHead(404).end();
        return;
    }

    if (pathname === '/api/participants') {
        await saveParticipant(request, response);
        return;
    }

    if (pathname === '/api/reports') {
        await downloadParticipantReport(request, response);
        return;
    }

    if (pathname.startsWith('/api/')) {
        sendJson(response, 404, { error: 'Route API introuvable.' });
        return;
    }

    await serveStatic(request, response);
}

const server = createServer();

if (isDevelopment) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
        server: { middlewareMode: true, hmr: { server } }
    });
    server.removeAllListeners('request');
    server.on('request', (request, response) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (pathname.startsWith('/api/')) {
            void handleRequest(request, response).catch((error: unknown) => {
                console.error('Unhandled API request error:', error);
                if (!response.headersSent) {
                    sendJson(response, 500, { error: 'Une erreur serveur est survenue.' });
                } else {
                    response.destroy();
                }
            });
            return;
        }
        vite.middlewares(request, response, () => response.writeHead(404).end());
    });
} else {
    server.on('request', (request, response) => {
        void handleRequest(request, response).catch((error: unknown) => {
            console.error('Unhandled server request error:', error);
            if (!response.headersSent) {
                sendJson(response, 500, { error: 'Une erreur serveur est survenue.' });
            } else {
                response.destroy();
            }
        });
    });
}

server.listen(port, '0.0.0.0', () => {
    console.log(`Application server listening on port ${port}`);
});
