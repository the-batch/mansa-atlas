import PDFDocument from 'pdfkit';
import { archetypeProfiles, sampleQuestions } from '../src/data/questions.js';
import {
    type FinancialProfile,
    type ParticipantDetails,
    type ParticipantResult
} from '../src/types/participant.js';
import { type Archetype, type QcmAnswer } from '../src/types/qcm.js';

interface ReportFocus {
    overview: string;
    strengths: string[];
    watchPoints: string[];
    nextSteps: string[];
    questions: string[];
}

interface ReportInput {
    participant: ParticipantDetails;
    result: ParticipantResult;
    answers: QcmAnswer[];
    financialProfile: FinancialProfile;
    scores: Record<Archetype, number>;
    totalScore: number;
}

const archetypes: Archetype[] = [
    'createur',
    'visionnaire',
    'passeur',
    'continuateur',
    'semeur'
];

const reportFocus: Record<Archetype, ReportFocus> = {
    createur: {
        overview: 'Vos réponses font ressortir un patrimoine étroitement lié à votre activité ou à votre entreprise. Votre énergie entrepreneuriale est un moteur important de construction, et vos décisions professionnelles et personnelles peuvent être liées.',
        strengths: [
            'Votre expérience de création et de développement peut soutenir des décisions patrimoniales ambitieuses.',
            'Vous identifiez clairement le rôle de votre activité dans la construction de votre patrimoine.'
        ],
        watchPoints: [
            'Une forte concentration sur l’entreprise peut exposer simultanément votre activité et votre patrimoine personnel aux mêmes aléas.',
            'La frontière entre trésorerie professionnelle, revenus et objectifs personnels mérite d’être clarifiée.'
        ],
        nextSteps: [
            'Distinguer les objectifs de l’entreprise de ceux de votre foyer et préciser les horizons associés.',
            'Faire le point sur la répartition actuelle de vos actifs et les scénarios qui pourraient la faire évoluer.',
            'Identifier les protections et les réserves de liquidité utiles à votre situation.'
        ],
        questions: [
            'Quelle part de mon patrimoine dépend directement de mon activité ?',
            'Quels projets personnels doivent rester possibles même si l’activité évolue ?'
        ]
    },
    visionnaire: {
        overview: 'Vos réponses mettent en avant une capacité d’épargne ou un capital auquel vous souhaitez donner une direction. Le sujet central semble être la cohérence entre vos ressources, vos projets et les décisions que vous prendrez dans le temps.',
        strengths: [
            'Vous souhaitez relier vos décisions financières à des objectifs de vie précis.',
            'Vous êtes prêt à structurer votre réflexion avant de décider.'
        ],
        watchPoints: [
            'Des projets aux horizons différents peuvent appeler des niveaux de disponibilité et de risque différents.',
            'Reporter les choix par manque de cadre peut laisser votre épargne sans rôle clairement défini.'
        ],
        nextSteps: [
            'Classer vos objectifs par horizon et par importance, sans confondre épargne de précaution et projets de long terme.',
            'Définir les critères qui guideront vos décisions et les points que vous souhaitez faire valider.',
            'Prévoir une revue régulière de votre stratégie lorsque vos projets ou votre situation changent.'
        ],
        questions: [
            'Quels projets doivent être financés en premier, et à quelle échéance ?',
            'Quelles variations de valeur serais-je réellement prêt à accepter ?'
        ]
    },
    passeur: {
        overview: 'Vos réponses traduisent un patrimoine constitué au fil du temps et une volonté de l’organiser pour l’avenir. La lisibilité de l’ensemble, la protection des proches et la préparation de la transmission occupent une place importante.',
        strengths: [
            'Vous avez déjà construit des actifs et vous vous projetez au-delà de leur seule accumulation.',
            'Vous prenez en compte la continuité et les personnes auxquelles votre patrimoine est lié.'
        ],
        watchPoints: [
            'Un patrimoine développé sur plusieurs années peut devenir complexe à suivre ou comporter des actifs difficiles à mobiliser.',
            'Des intentions de transmission non formalisées peuvent être interprétées différemment par vos proches.'
        ],
        nextSteps: [
            'Établir un inventaire à jour des actifs, engagements, documents importants et personnes de contact.',
            'Clarifier les objectifs de protection et de transmission avec les professionnels compétents.',
            'Vérifier que l’organisation retenue reste cohérente avec vos besoins de revenus et de liquidité.'
        ],
        questions: [
            'Mes proches sauraient-ils où trouver les informations utiles si nécessaire ?',
            'Mes dispositions reflètent-elles encore mes intentions et ma situation familiale ?'
        ]
    },
    continuateur: {
        overview: 'Vos réponses soulignent la responsabilité de comprendre et de piloter un patrimoine reçu ou repris. Prendre le temps de clarifier son fonctionnement, ses contraintes et vos propres objectifs peut faciliter des décisions éclairées.',
        strengths: [
            'Vous abordez activement la compréhension des actifs dont vous avez la responsabilité.',
            'Vous souhaitez faire évoluer le patrimoine avec discernement plutôt que reproduire automatiquement les choix passés.'
        ],
        watchPoints: [
            'L’origine d’un actif ne renseigne pas toujours sur ses contraintes, sa valeur actuelle ou les frais qui lui sont associés.',
            'Des attentes familiales et des objectifs personnels peuvent nécessiter des échanges explicites.'
        ],
        nextSteps: [
            'Rassembler les documents et identifier les caractéristiques, obligations et coûts liés aux actifs reçus.',
            'Séparer ce qui doit être préservé de ce qui peut être réexaminé selon vos projets.',
            'Faire appel à des professionnels indépendants des décisions antérieures pour éclairer les points complexes.'
        ],
        questions: [
            'Quels actifs et engagements composent précisément le patrimoine dont j’ai la charge ?',
            'Quelles décisions sont urgentes, et lesquelles peuvent attendre une meilleure compréhension ?'
        ]
    },
    semeur: {
        overview: 'Vos réponses décrivent un patrimoine en construction et l’envie de poser des bases solides. La régularité, la compréhension de vos besoins et le temps disponible pour vos projets peuvent compter davantage que la recherche de solutions complexes.',
        strengths: [
            'Vous vous intéressez tôt à la préparation de votre avenir financier.',
            'Vous pouvez construire progressivement des habitudes adaptées à vos moyens et à vos priorités.'
        ],
        watchPoints: [
            'Des objectifs trop nombreux ou des stratégies difficiles à maintenir peuvent décourager la régularité.',
            'La constitution d’une réserve disponible et la maîtrise des engagements courants restent des repères importants.'
        ],
        nextSteps: [
            'Faire le point sur votre budget, vos engagements et la réserve qui vous apporte de la sécurité.',
            'Choisir un objectif prioritaire et une démarche régulière que vous pouvez réellement maintenir.',
            'Avant toute décision d’investissement, comprendre les frais, les risques, la durée et les conditions de retrait.'
        ],
        questions: [
            'Quelle somme puis-je mettre de côté sans fragiliser mon équilibre au quotidien ?',
            'Quel objectif concret rendrait mes premiers efforts visibles dans les prochains mois ?'
        ]
    }
};

const colors = {
    ink: '#302C28',
    muted: '#625C54',
    navy: '#08111C',
    gold: '#BCA169',
    paleGold: '#F3EAD9',
    line: '#D8D0C2',
    paper: '#FBFBF9'
};

export function createReportPdf(input: ReportInput): Promise<Buffer> {
    const answerById = new Map(input.answers.map((answer) => [answer.questionId, answer]));
    const hasCompleteAnswers = input.answers.length === sampleQuestions.length
        && answerById.size === sampleQuestions.length
        && sampleQuestions.every((question) => {
            const answer = answerById.get(question.id);
            return answer !== undefined
                && question.options.some((option) => option.archetype === answer.archetype);
        });
    if (!hasCompleteAnswers) {
        return Promise.reject(new Error('Les réponses fournies ne correspondent pas au diagnostic.'));
    }

    return new Promise((resolve, reject) => {
        const document = new PDFDocument({
            size: 'A4',
            margins: { top: 76, right: 52, bottom: 58, left: 52 },
            info: {
                Title: `Bilan patrimonial - ${archetypeProfiles[input.result].name}`,
                Author: 'Mansa Capital - L’Atlas',
                Subject: 'Synthèse personnalisée du diagnostic patrimonial'
            }
        });
        const chunks: Buffer[] = [];
        let pageNumber = 0;
        const contentWidth = document.page.width - document.page.margins.left - document.page.margins.right;

        document.on('data', (chunk: Buffer) => chunks.push(chunk));
        document.on('end', () => resolve(Buffer.concat(chunks)));
        document.on('error', reject);

        const drawFooter = () => {
            const y = document.page.height - 37;
            document.moveTo(document.page.margins.left, y - 10)
                .lineTo(document.page.width - document.page.margins.right, y - 10)
                .lineWidth(0.6)
                .strokeColor(colors.line)
                .stroke();
            document.font('Helvetica')
                .fontSize(8)
                .fillColor(colors.muted)
                .text('MANSA CAPITAL  /  L’ATLAS', document.page.margins.left, y, { lineBreak: false });
            document.text(String(pageNumber).padStart(2, '0'), document.page.width - document.page.margins.right - 22, y, {
                lineBreak: false,
                width: 22,
                align: 'right'
            });
        };

        const drawHeader = () => {
            document.rect(0, 0, document.page.width, 7).fill(colors.gold);
            document.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(colors.navy)
                .text('MANSA CAPITAL', document.page.margins.left, 29, { lineBreak: false });
            document.font('Helvetica')
                .fontSize(8)
                .fillColor(colors.muted)
                .text('L’ATLAS  /  DIAGNOSTIC PATRIMONIAL', document.page.width - document.page.margins.right - 220, 30, {
                    lineBreak: false,
                    width: 220,
                    align: 'right'
                });
            document.moveTo(document.page.margins.left, 52)
                .lineTo(document.page.width - document.page.margins.right, 52)
                .lineWidth(0.6)
                .strokeColor(colors.line)
                .stroke();
            document.y = document.page.margins.top;
        };

        const addPage = () => {
            if (pageNumber > 0) drawFooter();
            document.addPage();
            pageNumber += 1;
            drawHeader();
        };

        const ensureSpace = (height: number) => {
            if (document.y + height > document.page.height - document.page.margins.bottom) {
                addPage();
            }
        };

        const addText = (
            text: string,
            options: { size?: number; font?: 'Helvetica' | 'Helvetica-Bold'; color?: string; gap?: number } = {}
        ) => {
            const size = options.size ?? 10;
            const font = options.font ?? 'Helvetica';
            const gap = options.gap ?? 8;
            const textOptions = { width: contentWidth, lineGap: 3 };
            const height = document.font(font).fontSize(size).heightOfString(text, textOptions);
            ensureSpace(height + gap);
            document.font(font)
                .fontSize(size)
                .fillColor(options.color ?? colors.ink)
                .text(text, document.page.margins.left, document.y, textOptions);
            document.y += gap;
        };

        const addSection = (title: string) => {
            ensureSpace(32);
            document.moveDown(0.4);
            document.font('Helvetica-Bold')
                .fontSize(12)
                .fillColor(colors.navy)
                .text(title, document.page.margins.left, document.y);
            document.moveDown(0.35);
            document.moveTo(document.page.margins.left, document.y)
                .lineTo(document.page.margins.left + 35, document.y)
                .lineWidth(1.5)
                .strokeColor(colors.gold)
                .stroke();
            document.y += 10;
        };

        const addBullets = (items: string[]) => {
            for (const item of items) {
                addText(`•  ${item}`, { gap: 5 });
            }
            document.y += 5;
        };

        addPage();
        addText('VOTRE BILAN PATRIMONIAL', {
            size: 9,
            font: 'Helvetica-Bold',
            color: colors.gold,
            gap: 12
        });
        addText(`${input.participant.firstName} ${input.participant.lastName}`, {
            size: 25,
            font: 'Helvetica-Bold',
            color: colors.navy,
            gap: 4
        });
        addText(`Établi le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date())}`, {
            size: 9,
            color: colors.muted,
            gap: 18
        });

        const profile = archetypeProfiles[input.result];
        const focus = reportFocus[input.result];
        document.roundedRect(document.page.margins.left, document.y, contentWidth, 74, 5)
            .fill(colors.navy);
        document.font('Helvetica')
            .fontSize(9)
            .fillColor(colors.paleGold)
            .text('VOTRE PROFIL', document.page.margins.left + 16, document.y + 13, { lineBreak: false });
        document.font('Helvetica-Bold')
            .fontSize(20)
            .fillColor('#FFFFFF')
            .text(profile.name, document.page.margins.left + 16, document.y + 29, { lineBreak: false });
        document.y += 88;
        addText(profile.description, { size: 11, gap: 6 });
        addText(profile.challenge, { size: 10, color: colors.muted, gap: 10 });
        addText(focus.overview, { gap: 14 });

        addSection('Votre situation déclarée');
        const financialProfileValues = [
            ['Patrimoine financier estimé', input.financialProfile.wealthRange],
            ['Objectifs de placement', input.financialProfile.investmentGoals.join(', ')],
            ['Tolérance au risque', input.financialProfile.riskTolerance],
            ['Expérience des marchés financiers', input.financialProfile.marketExperience],
            ['Fréquence d’investissement envisagée', input.financialProfile.investmentFrequency]
        ] as const;
        for (const [label, value] of financialProfileValues) {
            addText(`${label} : ${value || 'Non renseigné'}`, { size: 9, color: colors.muted, gap: 5 });
        }

        addSection('Les tendances de vos réponses');
        addText(
            `Votre profil principal obtient ${input.scores[input.result]} point${input.scores[input.result] > 1 ? 's' : ''} pondéré${input.scores[input.result] > 1 ? 's' : ''} sur ${input.totalScore}. Ces points reflètent les réponses au questionnaire; ils ne mesurent ni la valeur de votre patrimoine ni une performance financière.`,
            { size: 9, color: colors.muted, gap: 12 }
        );

        for (const archetype of archetypes) {
            ensureSpace(25);
            const y = document.y;
            const score = input.scores[archetype];
            const ratio = input.totalScore > 0 ? score / input.totalScore : 0;
            document.font(archetype === input.result ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(8)
                .fillColor(archetype === input.result ? colors.navy : colors.muted)
                .text(archetypeProfiles[archetype].name, document.page.margins.left, y, { lineBreak: false });
            document.font('Helvetica')
                .fontSize(8)
                .fillColor(colors.muted)
                .text(`${score} pt`, document.page.margins.left + contentWidth - 36, y, {
                    lineBreak: false,
                    width: 36,
                    align: 'right'
                });
            document.roundedRect(document.page.margins.left, y + 13, contentWidth, 4, 2).fill('#E8E3D9');
            if (ratio > 0) {
                document.roundedRect(document.page.margins.left, y + 13, Math.max(4, contentWidth * ratio), 4, 2)
                    .fill(archetype === input.result ? colors.gold : '#AEB5AA');
            }
            document.y = y + 25;
        }

        addSection('Votre profil en profondeur');
        addText('Vos points d’appui', { size: 10, font: 'Helvetica-Bold', color: colors.navy, gap: 5 });
        addBullets(focus.strengths);
        addText('Points de vigilance à examiner', { size: 10, font: 'Helvetica-Bold', color: colors.navy, gap: 5 });
        addBullets(focus.watchPoints);
        addText('Pistes pour la suite', { size: 10, font: 'Helvetica-Bold', color: colors.navy, gap: 5 });
        addBullets(focus.nextSteps);
        addText('Questions à approfondir', { size: 10, font: 'Helvetica-Bold', color: colors.navy, gap: 5 });
        addBullets(focus.questions);

        addSection('Vos réponses au diagnostic');
        for (const question of sampleQuestions) {
            const answer = answerById.get(question.id)!;
            const selectedOption = question.options.find(({ archetype }) => archetype === answer.archetype)!;
            addText(question.question, { size: 9, font: 'Helvetica-Bold', color: colors.navy, gap: 3 });
            addText(`Votre réponse : ${selectedOption.label}`, { size: 9, color: colors.muted, gap: 9 });
        }

        addSection('À propos de ce document');
        addText(
            'Ce document est un support de réflexion établi à partir de vos réponses déclaratives. Il ne constitue ni un audit patrimonial ni un conseil en investissement, fiscal, juridique ou financier. Toute décision doit être étudiée au regard de votre situation complète avec les professionnels compétents.',
            { size: 8, color: colors.muted, gap: 0 }
        );
        drawFooter();
        document.end();
    });
}
