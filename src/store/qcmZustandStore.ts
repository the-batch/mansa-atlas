import { create } from 'zustand';
import { type Archetype, type QcmState } from '../types/qcm';
import { sampleQuestions } from '../data/questions';

interface ZustandActions {
    submitAnswer: (selectedArchetype: Archetype) => void;
    resetQuiz: () => void;
}

type QcmStoreType = QcmState & ZustandActions;

const initialArchetypeScores: Record<Archetype, number> = {
    createur: 0,
    visionnaire: 0,
    passeur: 0,
    continuateur: 0,
    semeur: 0
};

const resolveArchetype = (
    scores: Record<Archetype, number>,
    answerHistory: QcmState['answerHistory']
): Archetype => {
    const highestScore = Math.max(...Object.values(scores));
    const leadingArchetypes = Object.entries(scores)
        .filter(([, score]) => score === highestScore)
        .map(([archetype]) => archetype as Archetype);

    if (leadingArchetypes.length === 1) {
        return leadingArchetypes[0];
    }

    const strongestAnswer = [...answerHistory]
        .sort((first, second) => second.weight - first.weight)
        .find(({ archetype }) => leadingArchetypes.includes(archetype));

    return strongestAnswer?.archetype ?? leadingArchetypes[0];
};

export const useQcmStore = create<QcmStoreType>((set) => ({
    questions: sampleQuestions,
    currentIndex: 0,
    archetypeScores: { ...initialArchetypeScores },
    answerHistory: [],
    resultArchetype: null,
    isFinished: false,

    submitAnswer: (selectedArchetype) => set((state) => {
        const currentQuestion = state.questions[state.currentIndex];
        const weight = currentQuestion.weight ?? 1;
        const archetypeScores = {
            ...state.archetypeScores,
            [selectedArchetype]: state.archetypeScores[selectedArchetype] + weight
        };
        const answerHistory = [...state.answerHistory, { archetype: selectedArchetype, weight }];
        const isLastQuestion = state.currentIndex + 1 >= state.questions.length;

        return {
            archetypeScores,
            answerHistory,
            resultArchetype: isLastQuestion
                ? resolveArchetype(archetypeScores, answerHistory)
                : null,
            currentIndex: isLastQuestion ? state.currentIndex : state.currentIndex + 1,
            isFinished: isLastQuestion
        };
    }),

    resetQuiz: () => set({
        currentIndex: 0,
        archetypeScores: { ...initialArchetypeScores },
        answerHistory: [],
        resultArchetype: null,
        isFinished: false
    })
}));
