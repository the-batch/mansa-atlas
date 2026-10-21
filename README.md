# Mansa Capital — L’Atlas

## Démarrage

- `npm run dev` démarre l’application et son serveur API en mode développement.
- `npm run build` construit l’application et le serveur.
- `npm start` démarre le serveur de production après le build.

Le serveur écoute sur le port `3000` par défaut. La variable d’environnement `PORT` permet de le modifier.

## Fichiers des formulaires

À la validation du profil et après acceptation des CGU, le serveur vérifie les données puis crée un fichier CSV unique dans le dossier `csv/` à la racine du projet. Seuls les prénoms, le nom et l’adresse e-mail sont obligatoires; les champs facultatifs non renseignés sont enregistrés comme cellules vides. Le questionnaire ne démarre qu’après l’enregistrement réussi. Ce dossier n’est pas servi par l’application et est exclu du contrôle de version.

Les fichiers contiennent des données personnelles et patrimoniales. En production, utilisez un stockage serveur persistant et restreignez l’accès système au dossier `csv/`; ce répertoire doit être sauvegardé et géré selon la politique de conservation applicable.
