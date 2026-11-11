import { z } from 'zod';
import { type QcmAnswer } from './qcm.js';

const requiredText = (label: string) =>
    z.string().trim().min(1, { error: `Veuillez renseigner ${label}.` });

const phonePattern = /^\+?(?=(?:\D*\d){7,}$)[0-9\s().-]{7,20}$/;
const archetypeOptions = [
    'createur',
    'visionnaire',
    'passeur',
    'continuateur',
    'semeur'
] as const;

export const participantSchema = z.object({
    firstName: requiredText('vos prénoms'),
    lastName: requiredText('votre nom'),
    phone: z.string().trim()
        .min(1, { error: 'Veuillez renseigner votre numéro de téléphone.' })
        .regex(phonePattern, { error: 'Veuillez saisir un numéro de téléphone valide.' }),
    email: requiredText('votre adresse e-mail').pipe(
        z.email({ error: 'Veuillez saisir une adresse e-mail valide.' })
    )
});

export const participantResultSchema = z.enum(archetypeOptions);
export const qcmAnswerSchema = z.object({
    questionId: z.number().int().positive(),
    archetype: participantResultSchema
});
export const financialProfileSchema = z.object({
    wealthRange: z.enum([
        '',
        'Inférieure à 5 000 000 FCFA',
        'Entre 5 000 000 et 15 000 000 FCFA',
        'Supérieure à 15 000 000 et inférieure ou égale à 50 000 000 FCFA',
        'Supérieure à 50 000 000 FCFA'
    ]),
    investmentGoals: z.array(z.enum([
        'Revenus réguliers',
        'Recherche de plus-values',
        'Sécurité du capital',
        'Liquidité'
    ])).max(4),
    riskTolerance: z.enum([
        '',
        'Faible',
        'Modérée',
        'Élevée'
    ]),
    marketExperience: z.enum([
        '',
        'Débutant(e)',
        'Intermédiaire',
        'Expérimenté(e)'
    ]),
    investmentFrequency: z.enum([
        '',
        'Ponctuelle',
        'Mensuelle',
        'Trimestrielle',
        'Annuelle'
    ])
});
export const participantReportSchema = z.object({
    submissionId: z.uuid(),
    participant: participantSchema,
    result: participantResultSchema,
    answers: z.array(qcmAnswerSchema).min(1).max(20),
    financialProfile: financialProfileSchema
});
export const participantSubmissionSchema = participantReportSchema.omit({ financialProfile: true });

export type ParticipantDetails = z.infer<typeof participantSchema>;
export type ParticipantResult = z.infer<typeof participantResultSchema>;
export type ParticipantSubmissionAnswer = QcmAnswer;
export type FinancialProfile = z.infer<typeof financialProfileSchema>;
