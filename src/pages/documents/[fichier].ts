import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { visiblePages } from '../../lib/content';
export async function getStaticPaths() {
  const pages = await visiblePages();
  const documents = [];
  if (pages.some(page => page.slug === 'brochure')) documents.push('brochure-meb-france.pdf');
  if (pages.some(page => page.slug === 'nous-soutenir')) documents.push('rib-meb-france.pdf');
  return documents.map(fichier => ({ params: { fichier } }));
}
export const GET: APIRoute = ({ params }) => {
  if (params.fichier === 'brochure-meb-france.pdf' || params.fichier === 'rib-meb-france.pdf') {
    return new Response(new Uint8Array(readFileSync(path.resolve('documents', params.fichier))), { headers: { 'Content-Type': 'application/pdf' } });
  }
  return new Response(null, { status: 404 });
};
