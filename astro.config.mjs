import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeExternalLinks } from './src/lib/rehype-external-links.mjs';

const review = process.env.MEB_REVIEW === 'true';
export default defineConfig({
  site: 'https://mission-braille-france.github.io',
  base: '/site-meb-france/',
  trailingSlash: 'always',
  integrations: review ? [] : [sitemap({ filter: url => !url.endsWith('/recherche/') })],
  markdown: { rehypePlugins: [rehypeExternalLinks] },
  vite: { define: { __MEB_REVIEW__: JSON.stringify(review) } }
});
