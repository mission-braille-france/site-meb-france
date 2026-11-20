import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export type BulletinKind = 'adhesion' | 'don';
const read = (file: string) => readFileSync(path.resolve(file), 'utf8');
export function formShell(kind: BulletinKind, links: { statuts: string; rib: string; accueil: string }) {
  return read('src/forms/shell.html')
    .replace('%STATUTS%', links.statuts)
    .replace('%RIB%', links.rib)
    .replace('%CONFIRMATION_ADHESION%', kind === 'adhesion' && links.accueil
      ? `<p>Nous reviendrons vers vous dans les plus brefs délais.</p><p><a href="${links.accueil}">Retour à l’accueil</a></p>`
      : '')
    .replace('%FORM%', read(`src/forms/${kind}.html`));
}
export function documentSize(kind: 'brochure' | 'rib') {
  const bytes = statSync(path.resolve(`documents/${kind}-meb-france.pdf`)).size;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / 1000)} ko`;
}
