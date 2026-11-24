# MEB France

Site de la Mission évangélique braille France, construit avec Astro 4 et hébergé par GitHub Pages. [Ouvrir le site public](https://meb-france.org/)

Le code est sur `main` dans le dépôt public `mission-braille-france/site-meb-france`. Le workflow GitHub Actions déploie le site. Les textes sont dans `src/content/pages/` et leur statut de brouillon est levé après validation éditoriale. Le fichier [AGENTS.md](AGENTS.md) décrit l’état du projet et les consignes d’accessibilité.

- `pnpm install --frozen-lockfile` installe les dépendances avec Node 24 et pnpm 11.25.0.
- `pnpm run check` vérifie le projet Astro.
- `pnpm run build:review` construit l’aperçu local avec les brouillons. `pnpm run preview` le sert sur cet ordinateur.
- `node scripts/verify.mjs --review` vérifie la construction de relecture.
- `pnpm run build` construit la version qui exclut les contenus en brouillon. Le workflow choisit cette construction si `MEB_PUBLICATION_MODE=production`.

Sur le site public, les bulletins d’adhésion et de don sont transmis via Formspree après relecture. Le formulaire de contact permet l’envoi direct. Les bulletins ne déclenchent ni paiement ni prélèvement. Les essais locaux et automatisés utilisent des envois simulés. Voir [`.env.example`](.env.example) pour les paramètres des bulletins.
