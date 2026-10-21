import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { participantSubmissionSchema } from '../src/types/participant.js';

const projectRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const csvDirectory = resolve(projectRoot, 'csv');
const distDirectory = resolve(projectRoot, 'dist');
const isDevelopment = process.argv.includes('--dev');
const port = Number(process.env.PORT ?? 3000);
const maxRequestSize = 16 * 1024;

const csvFields = [
    ['Prénoms', 'firstName'],
    ['Nom', 'lastName'],
    ['Sexe', 'gender'],
    ['Nationalité', 'nationality'],
    ['Téléphone principal', 'phone'],
    ['Téléphone secondaire', 'secondaryPhone'],
    ['Adresse e-mail', 'email'],
    ['Situation matrimoniale', 'maritalStatus'],
    ['Profession', 'profession'],
    ['Tranche d’âge', 'ageRange'],
    ['Situation patrimoniale', 'wealthRange'],
    ['Objectifs de placement', 'investmentGoals'],
    ['Tolérance au risque', 'riskTolerance'],
    ['Expérience des marchés financiers', 'marketExperience'],
    ['Fréquence d’investissement', 'investmentFrequency']
] as const;

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

function csvCell(value: string) {
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replaceAll('"', '""')}"`;
}

function makeCsvRow(values: string[]) {
    return values.map(csvCell).join(';');
}

async function saveParticipant(request: IncomingMessage, response: ServerResponse) {
    if (request.method !== 'POST') {
        sendJson(response, 405, { error: 'Méthode non autorisée.' });
        return;
    }

    if (!request.headers['content-type']?.includes('application/json')) {
        sendJson(response, 415, { error: 'Le formulaire doit être envoyé au format JSON.' });
        return;
    }

    const body = await readRequestBody(request);
    if (body === null) {
        sendJson(response, 413, { error: 'Le formulaire envoyé est trop volumineux.' });
        return;
    }

    let payload: unknown;
    try {
        payload = JSON.parse(body);
    } catch {
        sendJson(response, 400, { error: 'Le contenu du formulaire est invalide.' });
        return;
    }

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

    const { participant } = result.data;
    const values = csvFields.map(([, field]) => {
        const value = participant[field];
        return Array.isArray(value) ? value.join(', ') : value;
    });
    const acceptedAt = new Date().toISOString();
    const headers = [
        ...csvFields.map(([label]) => label),
        'CGU acceptées',
        'Version des CGU',
        'Date et heure d’acceptation'
    ];
    const row = [...values, 'Oui', result.data.termsVersion, acceptedAt];
    const contents = `\uFEFF${makeCsvRow(headers)}\r\n${makeCsvRow(row)}\r\n`;
    const filePath = resolve(csvDirectory, `participant-${randomUUID()}.csv`);

    try {
        await mkdir(csvDirectory, { recursive: true, mode: 0o700 });
        await writeFile(filePath, contents, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    } catch (error) {
        console.error('Unable to save participant CSV:', error);
        sendJson(response, 500, { error: 'Impossible d’enregistrer le formulaire. Veuillez réessayer.' });
        return;
    }

    sendJson(response, 201, { message: 'Formulaire enregistré.' });
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
