# MEB France

Sofian assure la mise en place du site. Corinne et l’association valident les textes. Parler en français simple, donner une action à la fois pour les tâches au clavier et privilégier les éléments utilisables avec NVDA et VoiceOver.

Astro 4 génère un site statique. Les pages sont dans `src/content/pages/` et validées par `src/content/config.ts`. Les liens internes passent par `withBase()`. La mise en page se trouve dans `src/layouts/Base.astro` et `src/styles/global.css`. Pagefind est indexé à la construction ; l’aperçu ZIP possède une recherche hors ligne.

Conserver le lien d’évitement comme premier lien, un seul titre de niveau 1, les repères et les intitulés explicites. Employer les contrôles HTML natifs et conserver un focus visible. Les couleurs sont définies par thème ; vérifier les contrastes avec `node scripts/verify.mjs --review` après une construction de relecture. Ne pas inventer de contenu ni déposer de secrets ou de données privées sur GitHub.

Éditer les pages Markdown, vérifier avec `pnpm run check` et `pnpm run build:review`, puis présenter la version à valider. Le dépôt est public et `main` déclenche GitHub Pages. Le site publie la version de relecture par défaut. Pour passer en production, attendre l’accord sur les textes, retirer le statut de brouillon des pages validées, définir `MEB_PUBLICATION_MODE=production` et vérifier le déploiement. Les statuts fournis sont incomplets et les destinataires Formspree restent à configurer.

Les contrôles automatisés couvrent la structure, les liens, les contrastes, la recherche et les bulletins simulés. L’ouverture et la fermeture du panneau d’affichage et le retour du focus ont été vérifiés au clavier dans le navigateur. Les essais complets avec le lecteur d’écran restent à confirmer par Sofian et Corinne.
