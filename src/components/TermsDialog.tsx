import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { m } from 'framer-motion';
import { termsVersion } from '../types/participant';

interface TermsDialogProps {
    onAccept: () => Promise<void>;
    onDecline: () => void;
}

export const TermsDialog = ({ onAccept, onDecline }: TermsDialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const termsContentRef = useRef<HTMLDivElement>(null);
    const [hasReadToEnd, setHasReadToEnd] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        dialog.showModal();
        const frame = window.requestAnimationFrame(() => {
            const content = termsContentRef.current;
            if (content) {
                content.focus({ preventScroll: true });
                if (content.scrollHeight <= content.clientHeight + 2) {
                    setHasReadToEnd(true);
                }
            }
        });

        return () => {
            window.cancelAnimationFrame(frame);
            if (dialog.open) dialog.close();
        };
    }, []);

    const handleScroll = (event: SyntheticEvent<HTMLDivElement>) => {
        const content = event.currentTarget;
        if (content.scrollTop + content.clientHeight >= content.scrollHeight - 4) {
            setHasReadToEnd(true);
        }
    };

    const handleAccept = async () => {
        setSubmissionError('');
        setIsSubmitting(true);
        try {
            await onAccept();
        } catch (error) {
            setSubmissionError(
                error instanceof Error
                    ? error.message
                    : 'Impossible d’enregistrer votre acceptation. Veuillez réessayer.'
            );
            setIsSubmitting(false);
        }
    };

    return (
        <dialog
            aria-labelledby="terms-title"
            className="terms-dialog"
            onCancel={(event) => {
                event.preventDefault();
                if (!isSubmitting) onDecline();
            }}
            ref={dialogRef}
        >
            <div className="terms-dialog-header">
                <p className="eyebrow"><span className="eyebrow-line" /> AVANT DE COMMENCER</p>
                <h2 id="terms-title">Conditions générales d’utilisation<span className="accent-period">.</span></h2>
                <p className="terms-version">Version du 21 octobre 2026 · {termsVersion}</p>
            </div>

            <div
                className="terms-dialog-content"
                onScroll={handleScroll}
                ref={termsContentRef}
                tabIndex={0}
                aria-label="Texte des conditions générales d’utilisation"
            >
                <section>
                    <h3>1. Objet du service</h3>
                    <p>
                        L’Atlas, proposé par Mansa Capital, est un outil numérique de découverte de votre
                        situation et de votre profil d’investisseur. En accédant au questionnaire, vous
                        acceptez les présentes conditions.
                    </p>
                </section>
                <section>
                    <h3>2. Utilisation du questionnaire</h3>
                    <p>
                        Vous vous engagez à fournir des informations exactes et à jour, et à utiliser le
                        service de manière loyale. Les réponses facultatives peuvent être laissées vides.
                        Vous pouvez interrompre votre parcours à tout moment avant d’accepter ces conditions.
                    </p>
                </section>
                <section>
                    <h3>3. Nature du diagnostic</h3>
                    <p>
                        Le résultat est indicatif et repose sur les réponses que vous fournissez. Il a pour
                        seul objet de vous aider à réfléchir à votre profil. Il ne constitue ni un conseil
                        en investissement, ni une recommandation personnalisée, ni une offre ou sollicitation
                        d’achat ou de vente d’instruments financiers. Il ne garantit aucun rendement et ne
                        remplace pas l’analyse de votre situation par un professionnel habilité.
                    </p>
                    <p>
                        Toute décision financière vous appartient. Avant d’investir, évaluez les risques,
                        vos besoins et votre capacité à supporter une perte, et sollicitez si nécessaire
                        un professionnel autorisé.
                    </p>
                </section>
                <section>
                    <h3>4. Données transmises</h3>
                    <p>
                        Pour utiliser le service, vos prénoms, votre nom et votre adresse e-mail sont
                        obligatoires. Les autres informations du formulaire sont facultatives. Après votre
                        acceptation, les informations fournies sont transmises au serveur de l’application
                        et enregistrées dans un fichier CSV individuel afin de traiter votre participation
                        au diagnostic et d’assurer le suivi associé.
                    </p>
                    <p>
                        Les fichiers sont conservés sur le serveur et ne sont pas proposés au téléchargement
                        dans l’interface de l’application. Ils contiennent des données personnelles et,
                        lorsque vous les fournissez, des informations patrimoniales. Pour toute question
                        ou demande concernant vos données, adressez-vous à Mansa Capital par ses canaux
                        officiels. Leur traitement reste soumis aux règles de protection des données
                        applicables.
                    </p>
                </section>
                <section>
                    <h3>5. Disponibilité et évolution</h3>
                    <p>
                        Le service est fourni sous forme numérique et peut évoluer, être temporairement
                        indisponible ou être modifié pour maintenance ou amélioration. Mansa Capital peut
                        mettre à jour ces conditions; une nouvelle acceptation sera demandée si nécessaire.
                    </p>
                </section>
                <section>
                    <h3>6. Acceptation</h3>
                    <p>
                        En cochant la case ci-dessous puis en poursuivant, vous confirmez avoir pu prendre
                        connaissance des présentes conditions et les accepter. La version acceptée ainsi que
                        la date et l’heure de votre acceptation sont enregistrées avec les informations
                        transmises pour ce diagnostic.
                    </p>
                </section>
            </div>

            <div className="terms-dialog-footer">
                <p className="terms-read-hint" aria-live="polite">
                    {hasReadToEnd
                        ? 'Vous êtes arrivé(e) à la fin des conditions.'
                        : 'Faites défiler les conditions jusqu’en bas pour pouvoir les accepter.'}
                </p>
                <label className={`terms-acceptance${!hasReadToEnd ? ' is-disabled' : ''}`}>
                    <input
                        checked={isAccepted}
                        disabled={!hasReadToEnd || isSubmitting}
                        onChange={(event) => setIsAccepted(event.target.checked)}
                        type="checkbox"
                    />
                    <span>J’ai lu et j’accepte les conditions générales d’utilisation.</span>
                </label>
                {submissionError && <p className="terms-error" role="alert">{submissionError}</p>}
                <div className="terms-actions">
                    <button
                        className="terms-decline"
                        disabled={isSubmitting}
                        onClick={onDecline}
                        type="button"
                    >
                        Refuser et revenir au formulaire
                    </button>
                    <m.button
                        className="restart-button terms-accept"
                        disabled={!hasReadToEnd || !isAccepted || isSubmitting}
                        onClick={handleAccept}
                        type="button"
                        whileHover={hasReadToEnd && isAccepted && !isSubmitting ? { y: -2 } : undefined}
                        whileTap={hasReadToEnd && isAccepted && !isSubmitting ? { scale: 0.985 } : undefined}
                    >
                        {isSubmitting ? 'Enregistrement…' : 'Accepter et commencer'}
                    </m.button>
                </div>
            </div>
        </dialog>
    );
};
