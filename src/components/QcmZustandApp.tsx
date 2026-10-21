import React from 'react';
import { m } from 'framer-motion';
import { archetypeProfiles } from '../data/questions';
import { useQcmStore } from '../store/qcmZustandStore';
import { type ParticipantDetails } from '../types/participant';

interface QcmZustandAppProps {
    participant: ParticipantDetails;
}

export const QcmZustandApp: React.FC<QcmZustandAppProps> = ({ participant }) => {
    const {
        questions,
        currentIndex,
        resultArchetype,
        isFinished,
        submitAnswer,
        resetQuiz
    } = useQcmStore();

    const total = questions.length;
    const progressPercent = isFinished ? 100 : Math.round(((currentIndex + 1) / total) * 100);

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
                <p className="eyebrow"><span className="eyebrow-line" /> VOTRE RÉSULTAT</p>
                <div className="result-profile">
                    <img className="result-image" src={profile.image} alt={`Illustration de l’archétype ${profile.name}`} />
                    <div className="result-details">
                        <div className="result-score" aria-label={`Archétype : ${profile.name}`}>
                            <span>{profile.name}</span>
                        </div>
                        <h1 className="result-title">Votre archétype<span className="accent-period">.</span></h1>
                        <p className="result-copy">{profile.description}</p>
                        <p className="result-copy">{profile.challenge}</p>
                        <div className="report-offer">
                            <p className="report-offer-title">Recevoir votre rapport complet</p>
                            <p className="report-offer-copy">
                                Une analyse plus détaillée pourra être envoyée à <strong>{participant.email}</strong>.
                            </p>
                            <button className="report-button" disabled type="button">
                                Envoi par e-mail bientôt disponible
                            </button>
                        </div>
                    </div>
                </div>
                <m.button
                    className="restart-button"
                    onClick={resetQuiz}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                >
                    <span>Recommencer le diagnostic</span>
                    <span className="button-arrow" aria-hidden="true">↗</span>
                </m.button>
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
