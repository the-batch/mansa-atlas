import { type FormEvent, useState } from 'react';
import { type ParticipantDetails } from '../types/participant';

interface ParticipantFormProps {
    onSubmit: (details: ParticipantDetails) => void;
}

export const ParticipantForm = ({ onSubmit }: ParticipantFormProps) => {
    const [details, setDetails] = useState<ParticipantDetails>({
        firstName: '',
        lastName: '',
        birthDate: '',
        email: ''
    });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onSubmit(details);
    };

    const updateField = (field: keyof ParticipantDetails, value: string) => {
        setDetails((currentDetails) => ({ ...currentDetails, [field]: value }));
    };

    return (
        <section className="quiz-panel participant-panel" aria-labelledby="participant-title">
            <p className="eyebrow"><span className="eyebrow-line" /> AVANT DE COMMENCER</p>
            <h1 className="participant-title" id="participant-title">Quelques informations<span className="accent-period">.</span></h1>
            <p className="participant-intro">
                Renseignez vos coordonnées pour personnaliser votre diagnostic et retrouver l’adresse
                à laquelle le rapport détaillé pourra être envoyé lorsqu’il sera disponible.
            </p>

            <form className="participant-form" onSubmit={handleSubmit}>
                <div className="participant-fields">
                    <label className="participant-field">
                        <span>Prénom</span>
                        <input
                            autoComplete="given-name"
                            name="firstName"
                            onChange={(event) => updateField('firstName', event.target.value)}
                            required
                            type="text"
                            value={details.firstName}
                        />
                    </label>
                    <label className="participant-field">
                        <span>Nom</span>
                        <input
                            autoComplete="family-name"
                            name="lastName"
                            onChange={(event) => updateField('lastName', event.target.value)}
                            required
                            type="text"
                            value={details.lastName}
                        />
                    </label>
                    <label className="participant-field">
                        <span>Date de naissance</span>
                        <input
                            autoComplete="bday"
                            max={new Date().toISOString().slice(0, 10)}
                            name="birthDate"
                            onChange={(event) => updateField('birthDate', event.target.value)}
                            required
                            type="date"
                            value={details.birthDate}
                        />
                    </label>
                    <label className="participant-field">
                        <span>Adresse e-mail</span>
                        <input
                            autoComplete="email"
                            name="email"
                            onChange={(event) => updateField('email', event.target.value)}
                            required
                            type="email"
                            value={details.email}
                        />
                    </label>
                </div>
                <p className="participant-privacy">
                    Ces informations restent dans cette session. Elles ne sont ni envoyées ni sauvegardées.
                </p>
                <button className="restart-button participant-submit" type="submit">
                    <span>Commencer le diagnostic</span>
                    <span className="button-arrow" aria-hidden="true">→</span>
                </button>
            </form>
        </section>
    );
};
