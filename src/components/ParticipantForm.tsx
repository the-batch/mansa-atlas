import { type FormEvent, useState } from 'react';
import { m } from 'framer-motion';
import { participantSchema, type ParticipantDetails } from '../types/participant';

interface ParticipantFormProps {
    onSubmit: (details: ParticipantDetails) => Promise<void>;
}

export const ParticipantForm = ({ onSubmit }: ParticipantFormProps) => {
    const [errors, setErrors] = useState<Partial<Record<keyof ParticipantDetails, string>>>({});
    const [submissionError, setSubmissionError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [details, setDetails] = useState<ParticipantDetails>({
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        const result = participantSchema.safeParse(details);
        if (!result.success) {
            const nextErrors: Partial<Record<keyof ParticipantDetails, string>> = {};
            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (field === 'firstName' || field === 'lastName' || field === 'email' || field === 'phone') {
                    nextErrors[field] ??= issue.message;
                }
            }
            setErrors(nextErrors);
            const firstInvalidField = Object.keys(nextErrors)[0];
            if (firstInvalidField) {
                event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
            }
            return;
        }

        setErrors({});
        setSubmissionError('');
        setIsSubmitting(true);
        try {
            await onSubmit(result.data);
        } catch (error) {
            setSubmissionError(
                error instanceof Error
                    ? error.message
                    : 'Impossible d’enregistrer le formulaire. Veuillez réessayer.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateField = (field: keyof ParticipantDetails, value: string) => {
        setDetails((currentDetails) => ({ ...currentDetails, [field]: value }));
        setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    };

    const fieldError = (field: keyof ParticipantDetails) =>
        errors[field] && (
            <span className="participant-field-error" id={`${field}-error`} role="alert">
                {errors[field]}
            </span>
        );

    const validationProps = (field: keyof ParticipantDetails) => ({
        'aria-describedby': errors[field] ? `${field}-error` : undefined,
        'aria-invalid': Boolean(errors[field])
    });

    return (
        <m.section
            animate={{ opacity: 1, y: 0 }}
            className="quiz-panel participant-panel"
            exit={{ opacity: 0, y: -10 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            aria-labelledby="participant-title"
        >
            <p className="eyebrow"><span className="eyebrow-line" /> AVANT DE COMMENCER</p>
            <h1 className="participant-title" id="participant-title">Votre profil d’investisseur<span className="accent-period">.</span></h1>
            <p className="participant-intro">
                Renseignez vos coordonnées pour accéder directement au diagnostic.
            </p>

            <form className="participant-form" noValidate onSubmit={handleSubmit}>
                <div className="participant-fields">
                    <label className="participant-field">
                        <span>Prénoms (obligatoire)</span>
                        <input aria-required="true" autoComplete="given-name" name="firstName" onChange={(event) => updateField('firstName', event.target.value)} required type="text" value={details.firstName} {...validationProps('firstName')} />
                        {fieldError('firstName')}
                    </label>
                    <label className="participant-field">
                        <span>Nom (obligatoire)</span>
                        <input aria-required="true" autoComplete="family-name" name="lastName" onChange={(event) => updateField('lastName', event.target.value)} required type="text" value={details.lastName} {...validationProps('lastName')} />
                        {fieldError('lastName')}
                    </label>
                    <label className="participant-field">
                        <span>Numéro de téléphone (obligatoire)</span>
                        <input aria-required="true" autoComplete="tel" name="phone" onChange={(event) => updateField('phone', event.target.value)} required type="tel" value={details.phone} {...validationProps('phone')} />
                        {fieldError('phone')}
                    </label>
                    <label className="participant-field participant-field-full">
                        <span>Adresse e-mail (obligatoire)</span>
                        <input aria-required="true" autoComplete="email" name="email" onChange={(event) => updateField('email', event.target.value)} required type="email" value={details.email} {...validationProps('email')} />
                        {fieldError('email')}
                    </label>
                </div>

                <p className="participant-privacy">
                    Seules vos coordonnées sont demandées pour commencer le diagnostic.
                </p>
                {submissionError && <p className="participant-submission-error" role="alert">{submissionError}</p>}
                <m.button
                    className="restart-button participant-submit"
                    disabled={isSubmitting}
                    type="submit"
                    whileHover={!isSubmitting ? { y: -2 } : undefined}
                    whileTap={!isSubmitting ? { scale: 0.985 } : undefined}
                >
                    <span>{isSubmitting ? 'Enregistrement…' : 'Commencer le diagnostic'}</span>
                    <span className="button-arrow" aria-hidden="true">→</span>
                </m.button>
            </form>
        </m.section>
    );
};
