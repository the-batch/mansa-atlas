import { type FormEvent, useState } from 'react';
import { participantSchema, type ParticipantDetails } from '../types/participant';

interface ParticipantFormProps {
    onSubmit: (details: ParticipantDetails) => Promise<void>;
}

const investmentGoalOptions = [
    'Revenus réguliers',
    'Recherche de plus-values',
    'Sécurité du capital',
    'Liquidité'
];

export const ParticipantForm = ({ onSubmit }: ParticipantFormProps) => {
    const [errors, setErrors] = useState<Partial<Record<keyof ParticipantDetails, string>>>({});
    const [submissionError, setSubmissionError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [details, setDetails] = useState<ParticipantDetails>({
        firstName: '',
        lastName: '',
        gender: '',
        nationality: '',
        phone: '',
        secondaryPhone: '',
        email: '',
        maritalStatus: '',
        profession: '',
        ageRange: '',
        wealthRange: '',
        investmentGoals: [],
        riskTolerance: '',
        marketExperience: '',
        investmentFrequency: ''
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmissionError('');
        const result = participantSchema.safeParse(details);
        if (!result.success) {
            const nextErrors: Partial<Record<keyof ParticipantDetails, string>> = {};
            const isParticipantField = (field: PropertyKey): field is keyof ParticipantDetails =>
                Object.prototype.hasOwnProperty.call(details, field);
            for (const issue of result.error.issues) {
                const field = issue.path[0];
                if (typeof field === 'string' && isParticipantField(field)) {
                    nextErrors[field] ??= issue.message;
                }
            }
            setErrors(nextErrors);
            const firstInvalidField = Object.keys(nextErrors)[0];
            if (firstInvalidField === 'investmentGoals') {
                event.currentTarget.querySelector<HTMLInputElement>('[name="investmentGoals"]')?.focus();
            } else if (firstInvalidField) {
                event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
            }
            return;
        }
        setErrors({});
        setIsSubmitting(true);
        try {
            await onSubmit(result.data);
        } catch (error) {
            setSubmissionError(
                error instanceof Error
                    ? error.message
                    : 'Impossible d’enregistrer le formulaire. Veuillez réessayer.'
            );
            setIsSubmitting(false);
        }
    };

    const updateField = (field: keyof ParticipantDetails, value: string) => {
        setDetails((currentDetails) => ({ ...currentDetails, [field]: value }));
        setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    };

    const toggleInvestmentGoal = (goal: string) => {
        setErrors((currentErrors) => ({ ...currentErrors, investmentGoals: undefined }));
        setDetails((currentDetails) => ({
            ...currentDetails,
            investmentGoals: currentDetails.investmentGoals.includes(goal)
                ? currentDetails.investmentGoals.filter((selectedGoal) => selectedGoal !== goal)
                : [...currentDetails.investmentGoals, goal]
        }));
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
        <section className="quiz-panel participant-panel" aria-labelledby="participant-title">
            <p className="eyebrow"><span className="eyebrow-line" /> AVANT DE COMMENCER</p>
            <h1 className="participant-title" id="participant-title">Mise à jour de votre profil<span className="accent-period">.</span></h1>
            <p className="participant-intro">
                Ces informations nous aident à adapter votre diagnostic à votre situation et à votre
                expérience de l’investissement. Seuls le nom, les prénoms et l’adresse e-mail sont obligatoires.
            </p>

            <form className="participant-form" noValidate onSubmit={handleSubmit}>
                <section className="participant-section" aria-labelledby="identification-title">
                    <h2 id="identification-title">Identification du client</h2>
                    <div className="participant-fields">
                        <label className="participant-field">
                            <span>Prénoms (obligatoire)</span>
                            <input aria-required="true" autoComplete="given-name" name="firstName" onChange={(event) => updateField('firstName', event.target.value)} type="text" value={details.firstName} {...validationProps('firstName')} />
                            {fieldError('firstName')}
                        </label>
                        <label className="participant-field">
                            <span>Nom (obligatoire)</span>
                            <input aria-required="true" autoComplete="family-name" name="lastName" onChange={(event) => updateField('lastName', event.target.value)} type="text" value={details.lastName} {...validationProps('lastName')} />
                            {fieldError('lastName')}
                        </label>
                        <label className="participant-field">
                            <span>Sexe</span>
                            <select name="gender" onChange={(event) => updateField('gender', event.target.value)} value={details.gender} {...validationProps('gender')}>
                                <option value="">Sélectionnez une option</option>
                                <option value="Femme">Femme</option>
                                <option value="Homme">Homme</option>
                                <option value="Autre">Autre</option>
                                <option value="Préfère ne pas répondre">Préfère ne pas répondre</option>
                            </select>
                            {fieldError('gender')}
                        </label>
                        <label className="participant-field">
                            <span>Nationalité</span>
                            <input autoComplete="country-name" name="nationality" onChange={(event) => updateField('nationality', event.target.value)} type="text" value={details.nationality} {...validationProps('nationality')} />
                            {fieldError('nationality')}
                        </label>
                        <label className="participant-field">
                            <span>Téléphone principal</span>
                            <input autoComplete="tel" name="phone" onChange={(event) => updateField('phone', event.target.value)} type="tel" value={details.phone} {...validationProps('phone')} />
                            {fieldError('phone')}
                        </label>
                        <label className="participant-field">
                            <span>Téléphone secondaire (facultatif)</span>
                            <input autoComplete="tel" name="secondaryPhone" onChange={(event) => updateField('secondaryPhone', event.target.value)} type="tel" value={details.secondaryPhone} {...validationProps('secondaryPhone')} />
                            {fieldError('secondaryPhone')}
                        </label>
                        <label className="participant-field">
                            <span>Adresse e-mail (obligatoire)</span>
                            <input aria-required="true" autoComplete="email" name="email" onChange={(event) => updateField('email', event.target.value)} type="email" value={details.email} {...validationProps('email')} />
                            {fieldError('email')}
                        </label>
                        <label className="participant-field">
                            <span>Situation matrimoniale</span>
                            <select name="maritalStatus" onChange={(event) => updateField('maritalStatus', event.target.value)} value={details.maritalStatus} {...validationProps('maritalStatus')}>
                                <option value="">Sélectionnez une option</option>
                                <option value="Célibataire">Célibataire</option>
                                <option value="Marié(e)">Marié(e)</option>
                                <option value="En union libre">En union libre</option>
                                <option value="Divorcé(e)">Divorcé(e)</option>
                                <option value="Veuf / veuve">Veuf / veuve</option>
                                <option value="Autre">Autre</option>
                            </select>
                            {fieldError('maritalStatus')}
                        </label>
                        <label className="participant-field">
                            <span>Profession</span>
                            <input autoComplete="organization-title" name="profession" onChange={(event) => updateField('profession', event.target.value)} type="text" value={details.profession} {...validationProps('profession')} />
                            {fieldError('profession')}
                        </label>
                        <label className="participant-field">
                            <span>Tranche d’âge</span>
                            <select name="ageRange" onChange={(event) => updateField('ageRange', event.target.value)} value={details.ageRange} {...validationProps('ageRange')}>
                                <option value="">Sélectionnez une tranche</option>
                                <option value="Moins de 25 ans">Moins de 25 ans</option>
                                <option value="25–34 ans">25–34 ans</option>
                                <option value="35–44 ans">35–44 ans</option>
                                <option value="45–54 ans">45–54 ans</option>
                                <option value="55–64 ans">55–64 ans</option>
                                <option value="65 ans et plus">65 ans et plus</option>
                            </select>
                            {fieldError('ageRange')}
                        </label>
                    </div>
                </section>

                <section className="participant-section" aria-labelledby="wealth-title">
                    <h2 id="wealth-title">Situation patrimoniale</h2>
                    <div className="participant-fields">
                        <label className="participant-field participant-field-full">
                            <span>Valeur estimée de votre patrimoine financier</span>
                            <select name="wealthRange" onChange={(event) => updateField('wealthRange', event.target.value)} value={details.wealthRange} {...validationProps('wealthRange')}>
                                <option value="">Sélectionnez une tranche</option>
                                <option value="Inférieure à 5 000 000 FCFA">Inférieure à 5 000 000 FCFA</option>
                                <option value="Entre 5 000 000 et 15 000 000 FCFA">Entre 5 000 000 et 15 000 000 FCFA</option>
                                <option value="Supérieure à 15 000 000 et inférieure ou égale à 50 000 000 FCFA">Supérieure à 15 000 000 et jusqu’à 50 000 000 FCFA</option>
                                <option value="Supérieure à 50 000 000 FCFA">Supérieure à 50 000 000 FCFA</option>
                            </select>
                            {fieldError('wealthRange')}
                        </label>
                    </div>
                </section>

                <section className="participant-section" aria-labelledby="investor-title">
                    <h2 id="investor-title">Profil d’investisseur</h2>
                    <div className="participant-fields">
                        <fieldset className="participant-field participant-goals">
                            <legend id="investment-goals-label">Objectif(s) de placement (plusieurs choix possibles)</legend>
                            <div className="participant-checkboxes">
                                {investmentGoalOptions.map((goal) => (
                                    <label className="participant-checkbox" key={goal}>
                                        <input
                                            aria-describedby={errors.investmentGoals ? 'investmentGoals-error' : undefined}
                                            aria-invalid={Boolean(errors.investmentGoals)}
                                            checked={details.investmentGoals.includes(goal)}
                                            name="investmentGoals"
                                            onChange={() => toggleInvestmentGoal(goal)}
                                            type="checkbox"
                                        />
                                        <span>{goal}</span>
                                    </label>
                                ))}
                            </div>
                            {fieldError('investmentGoals')}
                        </fieldset>
                        <label className="participant-field">
                            <span>Tolérance au risque</span>
                            <select name="riskTolerance" onChange={(event) => updateField('riskTolerance', event.target.value)} value={details.riskTolerance} {...validationProps('riskTolerance')}>
                                <option value="">Sélectionnez une option</option>
                                <option value="Faible">Faible — priorité à la préservation du capital</option>
                                <option value="Modérée">Modérée — équilibre entre risque et rendement</option>
                                <option value="Élevée">Élevée — recherche de rendement avec fluctuations</option>
                            </select>
                            {fieldError('riskTolerance')}
                        </label>
                        <label className="participant-field">
                            <span>Connaissance et expérience des marchés financiers</span>
                            <select name="marketExperience" onChange={(event) => updateField('marketExperience', event.target.value)} value={details.marketExperience} {...validationProps('marketExperience')}>
                                <option value="">Sélectionnez une option</option>
                                <option value="Débutant(e)">Débutant(e)</option>
                                <option value="Intermédiaire">Intermédiaire</option>
                                <option value="Expérimenté(e)">Expérimenté(e)</option>
                            </select>
                            {fieldError('marketExperience')}
                        </label>
                        <label className="participant-field">
                            <span>Fréquence d’investissement envisagée</span>
                            <select name="investmentFrequency" onChange={(event) => updateField('investmentFrequency', event.target.value)} value={details.investmentFrequency} {...validationProps('investmentFrequency')}>
                                <option value="">Sélectionnez une fréquence</option>
                                <option value="Ponctuelle">Ponctuelle</option>
                                <option value="Mensuelle">Mensuelle</option>
                                <option value="Trimestrielle">Trimestrielle</option>
                                <option value="Annuelle">Annuelle</option>
                            </select>
                            {fieldError('investmentFrequency')}
                        </label>
                    </div>
                </section>

                <p className="participant-privacy">
                    Vos informations seront transmises au serveur et enregistrées dans un fichier CSV distinct
                    pour traitement ultérieur. Ce fichier n’est pas accessible depuis l’interface.
                </p>
                {submissionError && <p className="participant-submission-error" role="alert">{submissionError}</p>}
                <button className="restart-button participant-submit" disabled={isSubmitting} type="submit">
                    <span>{isSubmitting ? 'Enregistrement en cours…' : 'Commencer le diagnostic'}</span>
                    <span className="button-arrow" aria-hidden="true">→</span>
                </button>
            </form>
        </section>
    );
};
