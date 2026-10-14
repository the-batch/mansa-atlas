import React from 'react';
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
            <section className="quiz-panel result-panel" aria-live="polite">
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
                <button className="restart-button" onClick={resetQuiz}>
                    <span>Recommencer le diagnostic</span>
                    <span className="button-arrow" aria-hidden="true">↗</span>
                </button>
            </section>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <section className="quiz-panel" aria-labelledby="question-title">
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

            <div className="question-block">
                <span className="question-kicker">ÉTAPE {String(currentIndex + 1).padStart(2, '0')}</span>
                <h1 id="question-title">{currentQuestion.question}</h1>
            </div>

            <div className="answer-list" aria-label="Choisissez la réponse qui vous correspond">
                {currentQuestion.options.map((option, index) => (
                    <button
                        className="answer-option"
                        key={option.label}
                        onClick={() => submitAnswer(option.archetype)}
                    >
                        <span className="option-index">{String.fromCharCode(65 + index)}</span>
                        <span className="option-label">{option.label}</span>
                        <span className="option-arrow" aria-hidden="true">↗</span>
                    </button>
                ))}
            </div>
            <p className="answer-hint">IL N’Y A PAS DE BONNE OU DE MAUVAISE RÉPONSE</p>
        </section>
    );
};
