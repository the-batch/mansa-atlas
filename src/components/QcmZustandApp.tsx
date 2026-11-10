import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { archetypeProfiles } from '../data/questions';
import { useQcmStore } from '../store/qcmZustandStore';
import { type ParticipantDetails, type ParticipantResult, type ParticipantSubmissionAnswer } from '../types/participant';

const archetypePortraits: Record<ParticipantResult, string> = {
    createur: '/createur.png',
    visionnaire: '/visionnaire.png',
    passeur: '/passeur.png',
    continuateur: '/continuateur.png',
    semeur: '/semeur.png'
};

const confettiPieces = Array.from({ length: 32 }, (_, index) => ({
    left: `${(index * 37 + 5) % 100}%`,
    delay: `${(index % 8) * 0.11}s`,
    duration: `${2.8 + (index % 5) * 0.35}s`,
    drift: `${((index * 19) % 160) - 80}px`,
    color: ['#e8c77d', '#d97542', '#e9e2d4', '#91b5bd'][index % 4],
    shape: index % 3 === 0 ? 'circle' : 'rectangle'
}));

interface QcmZustandAppProps {
    participant: ParticipantDetails;
    onComplete: (
        participant: ParticipantDetails,
        result: ParticipantResult,
        answers: ParticipantSubmissionAnswer[],
        submissionId: string
    ) => Promise<void>;
}

export const QcmZustandApp: React.FC<QcmZustandAppProps> = ({ participant, onComplete }) => {
    const {
        questions,
        currentIndex,
        resultArchetype,
        answerHistory,
        isFinished,
        submitAnswer,
        resetQuiz
    } = useQcmStore();
    const [saveError, setSaveError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [savedResultState, setSavedResultState] = useState<ParticipantResult | null>(null);
    const [submissionId, setSubmissionId] = useState(() => crypto.randomUUID());
    const savedResult = useRef<ParticipantResult | null>(null);
    const saveInProgress = useRef(false);

    const total = questions.length;
    const progressPercent = isFinished ? 100 : Math.round(((currentIndex + 1) / total) * 100);

    const saveResult = useCallback(async (result: ParticipantResult) => {
        if (saveInProgress.current) return;
        saveInProgress.current = true;
        setIsSaving(true);
        setSaveError('');
        try {
            await onComplete(
                participant,
                result,
                answerHistory.map(({ questionId, archetype }) => ({ questionId, archetype })),
                submissionId
            );
            savedResult.current = result;
            setSavedResultState(result);
        } catch (error) {
            setSaveError(error instanceof Error
                ? error.message
                : 'Impossible de préparer ou d’envoyer votre bilan. Veuillez réessayer.');
        } finally {
            saveInProgress.current = false;
            setIsSaving(false);
        }
    }, [answerHistory, onComplete, participant, submissionId]);

    useEffect(() => {
        if (!isFinished || !resultArchetype) return;
        if (savedResult.current === resultArchetype) return;
        void saveResult(resultArchetype);
    }, [isFinished, resultArchetype, saveResult]);

    const handleResetQuiz = () => {
        savedResult.current = null;
        setSavedResultState(null);
        setSaveError('');
        setSubmissionId(crypto.randomUUID());
        resetQuiz();
    };

    if (isFinished && resultArchetype) {
        const profile = archetypeProfiles[resultArchetype];

        return (
            <m.section
                animate={{ opacity: 1, y: 0 }}
                className="quiz-panel result-panel"
                exit={{ opacity: 0, y: -12 }}
                initial={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                aria-live="polite"
            >
                <div aria-hidden="true" className="result-hero-background" />
                <div aria-hidden="true" className="result-confetti">
                    {confettiPieces.map((piece, index) => (
                        <span
                            className={`result-confetti-piece is-${piece.shape}`}
                            key={index}
                            style={{
                                left: piece.left,
                                backgroundColor: piece.color,
                                animationDelay: piece.delay,
                                animationDuration: piece.duration,
                                '--confetti-drift': piece.drift
                            } as React.CSSProperties}
                        />
                    ))}
                </div>
                <div className="result-content">
                    <m.div
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="result-portrait"
                        initial={{ opacity: 0, x: -44, scale: 0.92 }}
                        transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                        <img src={archetypePortraits[resultArchetype]} alt={`Portrait du profil ${profile.name}`} />
                    </m.div>
                    <m.div
                        animate={{ opacity: 1, y: 0 }}
                        className="result-details"
                        initial={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                    >
                        <p className="eyebrow"><span className="eyebrow-line" /> VOTRE RÉSULTAT</p>
                        <p className="result-congratulations">Félicitations, {participant.firstName} !</p>
                        <h1 className="result-score" aria-label={`Archétype : ${profile.name}`}>
                            {profile.name}<span className="accent-period">.</span>
                        </h1>
                        <p className="result-copy">{profile.description}</p>
                        <p className="result-copy">{profile.challenge}</p>
                        <div className="participant-submission-status" aria-live="polite">
                            {isSaving && <p>Enregistrement de votre résultat…</p>}
                            {!isSaving && !saveError && savedResultState === resultArchetype && (
                                <p>Votre résultat a bien été enregistré.</p>
                            )}
                            {saveError && (
                                <>
                                    <p className="participant-submission-error" role="alert">{saveError}</p>
                                    <button
                                        className="participant-back"
                                        disabled={isSaving}
                                        onClick={() => void saveResult(resultArchetype)}
                                        type="button"
                                    >
                                        Réessayer l’enregistrement
                                    </button>
                                </>
                            )}
                        </div>
                    </m.div>
                </div>
                <div className="result-actions">
                    <m.button
                        className="result-action"
                        onClick={handleResetQuiz}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.985 }}
                    >
                        <span>Recommencer le diagnostic</span>
                        <span className="button-arrow" aria-hidden="true">→</span>
                    </m.button>
                    <button
                        aria-describedby="report-download-status"
                        className="result-action result-download-action"
                        disabled
                        type="button"
                    >
                        <span>Télécharger mon bilan PDF</span>
                        <span className="button-arrow" aria-hidden="true">→</span>
                        <span className="result-action-status" id="report-download-status">
                            Bientôt disponible
                        </span>
                    </button>
                </div>
            </m.section>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <m.section
            animate={{ opacity: 1, y: 0 }}
            className="quiz-panel"
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            aria-labelledby="question-title"
        >
            <div className="quiz-heading">
                <p className="eyebrow"><span className="eyebrow-line" /> L’ATLAS · VOTRE PROFIL PATRIMONIAL</p>
                <span className="question-count">{String(currentIndex + 1).padStart(2, '0')} <span>/</span> {String(total).padStart(2, '0')}</span>
            </div>

            <div className="progress-meta">
                <span>VOTRE CARTE SE DESSINE</span>
                <span>{String(progressPercent).padStart(2, '0')}<span className="percent-sign">%</span></span>
            </div>

            <div
                className="progress-track"
                role="progressbar"
                aria-label="Progression du diagnostic"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
            >
                <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <m.div
                animate={{ opacity: 1, x: 0 }}
                className="question-block"
                initial={{ opacity: 0, x: 10 }}
                key={currentIndex}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            >
                <span className="question-kicker">ÉTAPE {String(currentIndex + 1).padStart(2, '0')}</span>
                <h1 id="question-title">{currentQuestion.question}</h1>
            </m.div>

            <div className="answer-list" aria-label="Choisissez la réponse qui vous correspond">
                {currentQuestion.options.map((option, index) => (
                    <m.button
                        animate={{ opacity: 1, y: 0 }}
                        className="answer-option"
                        initial={{ opacity: 0, y: 10 }}
                        key={option.label}
                        onClick={() => submitAnswer(option.archetype)}
                        transition={{ duration: 0.28, delay: index * 0.055, ease: 'easeOut' }}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.99 }}
                    >
                        <span className="option-index">{String.fromCharCode(65 + index)}</span>
                        <span className="option-label">{option.label}</span>
                        <span className="option-arrow" aria-hidden="true">↗</span>
                    </m.button>
                ))}
            </div>
            <p className="answer-hint">IL N’Y A PAS DE BONNE OU DE MAUVAISE RÉPONSE</p>
        </m.section>
    );
};
