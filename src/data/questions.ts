import { type Archetype, type Question } from '../types/qcm';

export const archetypeProfiles: Record<Archetype, { name: string; description: string; challenge: string }> = {
    createur: {
        name: 'Le Créateur',
        description: 'Votre activité ou votre entreprise joue un rôle important dans la richesse que vous construisez.',
        challenge: 'Votre force est aussi votre principale fragilité : pensez à diversifier ce que votre activité a permis de bâtir.'
    },
    visionnaire: {
        name: 'La Visionnaire',
        description: 'Vous avez une capacité à épargner ou du capital à faire avancer, et vous cherchez à lui donner une direction.',
        challenge: 'Votre argent peut avancer davantage avec une stratégie claire, alignée sur vos projets.'
    },
    passeur: {
        name: 'Le Passeur',
        description: 'Vous avez construit un patrimoine et réfléchissez à la manière de l’organiser pour qu’il dure.',
        challenge: 'Vous avez construit. Reste à organiser ce qui doit durer et se transmettre.'
    },
    continuateur: {
        name: 'Le Continuateur',
        description: 'Vous avez reçu ou repris un patrimoine et souhaitez le comprendre pour mieux le piloter.',
        challenge: 'Recevoir un patrimoine et le piloter sont deux métiers différents.'
    },
    semeur: {
        name: 'Le Semeur',
        description: 'Votre patrimoine est en construction et votre temps est un atout précieux pour préparer la suite.',
        challenge: 'Votre principal capital n’est peut-être pas encore votre argent. C’est votre temps.'
    }
};

export const sampleQuestions: Question[] = [
    {
        id: 1,
        question: 'Aujourd’hui, quelle phrase décrit le mieux votre situation patrimoniale ?',
        weight: 2,
        options: [
            { label: 'Je développe une activité qui contribue fortement à mon patrimoine.', archetype: 'createur' },
            { label: 'J’ai de l’épargne ou du capital auquel je veux donner une direction.', archetype: 'visionnaire' },
            { label: 'J’ai constitué un patrimoine et je veux l’organiser pour l’avenir.', archetype: 'passeur' },
            { label: 'J’ai reçu ou repris un patrimoine que je souhaite apprendre à piloter.', archetype: 'continuateur' },
            { label: 'Je commence à construire mon patrimoine et veux bien démarrer.', archetype: 'semeur' }
        ]
    },
    {
        id: 2,
        question: 'Comment votre patrimoine s’est-il principalement constitué ?',
        weight: 3,
        options: [
            { label: 'Grâce à mon entreprise ou à mon activité professionnelle.', archetype: 'createur' },
            { label: 'Par mes revenus, mon épargne et des placements que je peux structurer.', archetype: 'visionnaire' },
            { label: 'En construisant progressivement des actifs au fil du temps.', archetype: 'passeur' },
            { label: 'En recevant ou en reprenant une partie importante d’un patrimoine existant.', archetype: 'continuateur' },
            { label: 'Je suis encore au début : je constitue mes premières économies.', archetype: 'semeur' }
        ]
    },
    {
        id: 3,
        question: 'Quelle est la prochaine étape qui vous ressemble le plus ?',
        options: [
            { label: 'Développer mon entreprise tout en renforçant mon patrimoine personnel.', archetype: 'createur' },
            { label: 'Mettre mon épargne au service d’un projet qui compte pour moi.', archetype: 'visionnaire' },
            { label: 'Organiser mes biens et préparer leur transmission.', archetype: 'passeur' },
            { label: 'Comprendre les actifs reçus et décider comment les gérer.', archetype: 'continuateur' },
            { label: 'Commencer à épargner ou à investir de façon régulière.', archetype: 'semeur' }
        ]
    },
    {
        id: 4,
        question: 'Parmi ces situations, laquelle correspond le mieux à vos principaux actifs ?',
        weight: 2,
        options: [
            { label: 'Une part importante est liée à mon entreprise ou à mon activité.', archetype: 'createur' },
            { label: 'J’ai de l’épargne ou des liquidités à organiser.', archetype: 'visionnaire' },
            { label: 'Je possède plusieurs biens ou placements constitués au fil du temps.', archetype: 'passeur' },
            { label: 'Une partie importante vient d’un patrimoine familial reçu ou repris.', archetype: 'continuateur' },
            { label: 'Je dispose surtout d’un premier capital encore modeste.', archetype: 'semeur' }
        ]
    },
    {
        id: 5,
        question: 'Qu’aimeriez-vous que votre argent vous aide à accomplir en priorité ?',
        options: [
            { label: 'Faire grandir mon entreprise et ce qu’elle me permet de construire.', archetype: 'createur' },
            { label: 'Financer un projet de vie ou faire croître mon capital.', archetype: 'visionnaire' },
            { label: 'Protéger mes proches et préparer une transmission sereine.', archetype: 'passeur' },
            { label: 'Préserver et faire évoluer le patrimoine dont j’ai la responsabilité.', archetype: 'continuateur' },
            { label: 'Préparer l’avenir en commençant à bâtir une base solide.', archetype: 'semeur' }
        ]
    },
    {
        id: 6,
        question: 'Quelle expérience d’investissement vous correspond le mieux ?',
        options: [
            { label: 'J’ai surtout investi dans mon entreprise ou mon activité.', archetype: 'createur' },
            { label: 'J’ai déjà épargné ou placé de l’argent et veux mieux organiser mes choix.', archetype: 'visionnaire' },
            { label: 'J’ai accumulé des biens ou des placements sur plusieurs années.', archetype: 'passeur' },
            { label: 'J’apprends à gérer des placements ou des biens reçus ou repris.', archetype: 'continuateur' },
            { label: 'Je n’ai pas encore investi, ou très peu.', archetype: 'semeur' }
        ]
    },
    {
        id: 7,
        question: 'Qu’est-ce qui vous aiderait le plus à avancer ?',
        options: [
            { label: 'Réduire ma dépendance à mon entreprise ou à un seul actif.', archetype: 'createur' },
            { label: 'Clarifier ma stratégie et les prochaines décisions à prendre.', archetype: 'visionnaire' },
            { label: 'Mettre de l’ordre dans mon patrimoine et préparer la transmission.', archetype: 'passeur' },
            { label: 'Mieux comprendre les biens reçus et choisir comment les piloter.', archetype: 'continuateur' },
            { label: 'Savoir par où commencer avec les moyens dont je dispose.', archetype: 'semeur' }
        ]
    },
    {
        id: 8,
        question: 'Dans les prochaines années, quelle évolution vous ferait le plus plaisir ?',
        options: [
            { label: 'Mon activité prospère et mon patrimoine devient moins concentré.', archetype: 'createur' },
            { label: 'Mon capital progresse en cohérence avec mes projets.', archetype: 'visionnaire' },
            { label: 'Mon patrimoine est organisé et prêt à être transmis.', archetype: 'passeur' },
            { label: 'Je prends des décisions éclairées concernant le patrimoine reçu.', archetype: 'continuateur' },
            { label: 'J’ai posé des bases régulières pour construire mon avenir financier.', archetype: 'semeur' }
        ]
    }
];
