import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { rehypeExternalLinks } from './src/lib/rehype-external-links.mjs';

const review = process.env.MEB_REVIEW === 'true';
const site = 'https://meb-france.org';
export default defineConfig({
  site,
  trailingSlash: 'always',
  integrations: review ? [] : [sitemap({ filter: url => !url.endsWith('/recherche/') })],
  markdown: { rehypePlugins: [[rehypeExternalLinks, { site }]] },
  vite: { define: { __MEB_REVIEW__: JSON.stringify(review) } }
});
