# Mansa Capital — L’Atlas

## Démarrage

- `npm run dev` démarre l’application et son serveur API en mode développement.
- `npm run build` construit l’application et le serveur.
- `npm start` démarre le serveur de production après le build.

Le serveur écoute sur le port `3000` par défaut. La variable d’environnement `PORT` permet de le modifier.

## Fichiers des formulaires

À la fin du diagnostic, le serveur vérifie les coordonnées et les réponses, puis crée un fichier CSV dans le dossier `csv/` à la racine du projet. Le fichier contient les prénoms, le nom, le numéro de téléphone, l’adresse e-mail, le profil obtenu et la date de participation. Les conditions générales d’utilisation sont consultables depuis le lien en pied de page. Ce dossier n’est pas servi par l’application et est exclu du contrôle de version.

Les fichiers contiennent des coordonnées personnelles. En production, utilisez un stockage serveur persistant et restreignez l’accès système au dossier `csv/`; ce répertoire doit être sauvegardé et géré selon la politique de conservation applicable.

## Bilan PDF

Depuis la page de résultat, le bouton du bilan ouvre un formulaire facultatif sur la situation patrimoniale et le profil d’investisseur. La validation du formulaire génère et télécharge le bilan PDF, puis ajoute ces réponses au CSV individuel. Si le formulaire est fermé sans téléchargement, le CSV de base reste inchangé.

L’envoi du bilan par e-mail n’est pas encore activé. Le bilan sera un support de réflexion établi à partir des réponses déclaratives; il ne constituera pas un audit ni un conseil financier, fiscal, juridique ou en investissement.
