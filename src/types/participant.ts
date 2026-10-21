import { z } from 'zod';

const requiredText = (label: string) =>
    z.string().trim().min(1, { error: `Veuillez renseigner ${label}.` });

const optionalSelection = (label: string, options: string[]) =>
    z.string().default('').refine(
        (value) => value === '' || options.includes(value),
        { error: `Veuillez sélectionner ${label}.` }
    );

const phonePattern = /^\+?[0-9\s().-]{7,20}$/;
const investmentGoalOptions = [
    'Revenus réguliers',
    'Recherche de plus-values',
    'Sécurité du capital',
    'Liquidité'
];

export const participantSchema = z.object({
    firstName: requiredText('vos prénoms'),
    lastName: requiredText('votre nom'),
    gender: optionalSelection('votre sexe', [
        'Femme',
        'Homme',
        'Autre',
        'Préfère ne pas répondre'
    ]),
    nationality: z.string().trim().default(''),
    phone: z.string().trim().default('').refine(
        (value) => value === '' || phonePattern.test(value),
        { error: 'Veuillez saisir un numéro de téléphone principal valide.' }
    ),
    secondaryPhone: z.string().trim().default('').refine(
        (value) => value === '' || phonePattern.test(value),
        { error: 'Veuillez saisir un numéro de téléphone secondaire valide.' }
    ),
    email: requiredText('votre adresse e-mail').pipe(
        z.email({ error: 'Veuillez saisir une adresse e-mail valide.' })
    ),
    maritalStatus: optionalSelection('votre situation matrimoniale', [
        'Célibataire',
        'Marié(e)',
        'En union libre',
        'Divorcé(e)',
        'Veuf / veuve',
        'Autre'
    ]),
    profession: z.string().trim().default(''),
    ageRange: optionalSelection('votre tranche d’âge', [
        'Moins de 25 ans',
        '25–34 ans',
        '35–44 ans',
        '45–54 ans',
        '55–64 ans',
        '65 ans et plus'
    ]),
    wealthRange: optionalSelection('votre tranche patrimoniale', [
        'Inférieure à 5 000 000 FCFA',
        'Entre 5 000 000 et 15 000 000 FCFA',
        'Supérieure à 15 000 000 et inférieure ou égale à 50 000 000 FCFA',
        'Supérieure à 50 000 000 FCFA'
    ]),
    investmentGoals: z.array(z.string()).default([])
        .refine(
            (goals) => goals.every((goal) => investmentGoalOptions.includes(goal)),
            { error: 'Veuillez sélectionner des objectifs de placement valides.' }
        ),
    riskTolerance: optionalSelection('votre tolérance au risque', [
        'Faible',
        'Modérée',
        'Élevée'
    ]),
    marketExperience: optionalSelection('votre niveau d’expérience des marchés financiers', [
        'Débutant(e)',
        'Intermédiaire',
        'Expérimenté(e)'
    ]),
    investmentFrequency: optionalSelection('votre fréquence d’investissement', [
        'Ponctuelle',
        'Mensuelle',
        'Trimestrielle',
        'Annuelle'
    ])
});

export const termsVersion = '2026-10-21';

export const participantSubmissionSchema = z.object({
    participant: participantSchema,
    termsAccepted: z.literal(true),
    termsVersion: z.literal(termsVersion)
});

export type ParticipantDetails = z.infer<typeof participantSchema>;
