# MEB France

Site statique de la Mission évangélique braille France, construit avec Astro 4. Les textes sont dans `src/content/pages/` ; les fiches restent en brouillon jusqu’à validation.

- `pnpm install --frozen-lockfile` installe les dépendances (Node 24, pnpm 11.25.0).
- `pnpm run build:review` prépare l’aperçu local avec les brouillons et des envois simulés.
- `pnpm run preview` sert le résultat sur cet ordinateur.
- `pnpm run build` prépare une version sans les pages ni les documents en brouillon.

Le dépôt GitHub `mission-braille-france/site-meb-france` est public. GitHub Pages publie la version de relecture à chaque envoi sur `main`. Elle est publique, non destinée à l’indexation et les bulletins y simulent l’envoi. Après validation, la variable de dépôt `MEB_PUBLICATION_MODE=production` permet de construire uniquement les pages approuvées.

L’envoi des bulletins en ligne nécessite deux identifiants de formulaire Formspree (voir `.env.example`) et une version validée des statuts. Les bulletins ne déclenchent aucun règlement ni prélèvement.
