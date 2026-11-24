# MEB France

Sofian assure la réalisation du site. Corinne fournit les textes et les valide avec l’association. Répondre en français simple et, pour les manipulations, donner une action à la fois, réalisable au clavier avec NVDA ou VoiceOver.

## État du projet au 24 novembre 2026

Le site public est [meb-france.org](https://meb-france.org/). Son code se trouve sur `main` dans le [dépôt GitHub](https://github.com/mission-braille-france/site-meb-france). GitHub Pages héberge le site à la racine du domaine. La mention « version de travail » a été retirée du site. Vérifier l’état de `main` avant toute modification si le dossier courant ne contient pas le dépôt.

Les bulletins de don et d’adhésion transmettent les réponses via Formspree après relecture. Le formulaire de contact permet l’envoi direct. Les bulletins servent à transmettre une demande d’adhésion ou une intention de don et ne déclenchent ni paiement ni prélèvement. Utiliser des réponses simulées lors des tests locaux et automatisés.

Les statuts ont leur propre page, liée depuis les bulletins. La version fournie comporte des mentions à compléter et reste à valider par l’association. La brochure et le RIB sont téléchargeables en PDF.

## Développement et accessibilité

Astro 4 génère un site statique. Les pages Markdown sont dans `src/content/pages/` et leur schéma est dans `src/content/config.ts`. La mise en page se trouve dans `src/layouts/Base.astro` et `src/styles/global.css`. Pagefind est indexé à la construction. L’aperçu ZIP possède une recherche hors ligne.

Conserver l’ordre de navigation actuel, avec la recherche après « Contact », le lien d’évitement comme premier lien, un titre de niveau 1, les repères, les intitulés explicites et le texte alternatif du logo. Employer les contrôles HTML natifs et conserver un focus visible. Le panneau « Réglages d’affichage » propose le thème, le contraste, la taille du texte, l’espacement et la police. Préserver son fonctionnement au clavier et le retour du focus à la fermeture.

Vérifier avec `pnpm run check`, `pnpm run build:review` et `node scripts/verify.mjs --review`. Les contrôles automatisés couvrent la structure, les liens, les contrastes, la recherche et les bulletins simulés. Les essais complets avec un lecteur d’écran restent à confirmer par Sofian et Corinne.

Faire valider les contenus par l’association avant de lever leur statut de brouillon. Le dépôt est public. Ne pas y ajouter de secrets ni de données privées. Pour une modification du site publiée sur `main`, contrôler le déploiement GitHub Actions et le résultat à l’adresse publique.
