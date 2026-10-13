// src/types/qcm.ts
export type Archetype = 'createur' | 'visionnaire' | 'passeur' | 'continuateur' | 'semeur';

export interface AnswerOption {
    label: string;
    archetype: Archetype;
}

export interface Question {
    id: number;
    question: string;
    options: AnswerOption[];
    weight?: number;
}

export interface QcmState {
    questions: Question[];
    currentIndex: number;
    archetypeScores: Record<Archetype, number>;
    answerHistory: { archetype: Archetype; weight: number }[];
    resultArchetype: Archetype | null;
    isFinished: boolean;
}
