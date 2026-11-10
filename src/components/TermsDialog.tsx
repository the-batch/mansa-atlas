import { useEffect, useRef } from 'react';
interface TermsDialogProps {
    onClose: () => void;
}

export const TermsDialog = ({ onClose }: TermsDialogProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const termsContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        dialog.showModal();
        termsContentRef.current?.focus({ preventScroll: true });

        return () => {
            if (dialog.open) dialog.close();
        };
    }, []);

    return (
        <dialog
            aria-labelledby="terms-title"
            className="terms-dialog"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            ref={dialogRef}
        >
            <div className="terms-dialog-header">
                <p className="eyebrow"><span className="eyebrow-line" /> MANSA CAPITAL · L’ATLAS</p>
                <h2 id="terms-title">Conditions générales d’utilisation<span className="accent-period">.</span></h2>
                <p className="terms-version">Version du 10 novembre 2026</p>
            </div>

            <div
                className="terms-dialog-content"
                ref={termsContentRef}
                tabIndex={0}
                aria-label="Texte des conditions générales d’utilisation"
            >
                <section>
                    <h3>1. Objet du service</h3>
                    <p>
                        L’Atlas, proposé par Mansa Capital, est un outil numérique de découverte de votre
                        situation et de votre profil d’investisseur. Ces conditions décrivent les règles
                        d’utilisation du service.
                    </p>
                </section>
                <section>
                    <h3>2. Utilisation du questionnaire</h3>
                    <p>
                        Vous vous engagez à fournir des informations exactes et à jour, et à utiliser le
                        service de manière loyale. Vous pouvez interrompre votre parcours à tout moment.
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
                        Vos prénoms, votre nom, votre numéro de téléphone et votre adresse e-mail sont nécessaires pour utiliser le
                        service. Ces coordonnées, y compris votre numéro de téléphone, sont transmises au
                        serveur et enregistrées dans un fichier CSV individuel afin de traiter votre
                        participation au diagnostic et d’assurer le suivi associé.
                    </p>
                    <p>
                        Les fichiers sont conservés sur le serveur et ne sont pas proposés au téléchargement
                        dans l’interface de l’application. Ils contiennent vos coordonnées personnelles.
                        Pour toute question ou demande concernant vos données, adressez-vous à Mansa Capital
                        par ses canaux officiels. Leur traitement reste soumis
                        aux règles de protection des données applicables.
                    </p>
                </section>
                <section>
                    <h3>5. Disponibilité et évolution</h3>
                    <p>
                        Le service est fourni sous forme numérique et peut évoluer, être temporairement
                        indisponible ou être modifié pour maintenance ou amélioration. Mansa Capital peut
                        mettre à jour ces conditions. La version en vigueur reste consultable depuis le
                        lien en pied de page.
                    </p>
                </section>
            </div>

            <div className="terms-dialog-footer">
                <button className="terms-close" onClick={onClose} type="button">
                    Fermer
                </button>
            </div>
        </dialog>
    );
};
