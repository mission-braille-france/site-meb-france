import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export type FormKind = 'adhesion' | 'don' | 'contact';
const read = (file: string) => readFileSync(path.resolve(file), 'utf8');
export function formShell(kind: FormKind, links: { statuts: string; rib: string; accueil: string }) {
  const contact = kind === 'contact';
  return read('src/forms/shell.html')
    .replace('%INTRO%', contact ? 'Écrivez votre message à MEB France.' : 'Remplissez le formulaire, relisez le récapitulatif, puis confirmez l’envoi.')
    .replaceAll('%SUBMIT%', contact ? 'Envoyer le message' : 'Vérifier le bulletin')
    .replace('%SUMMARY%', contact ? '' : read('src/forms/summary.html'))
    .replace('%OBJET%', contact ? 'message' : 'bulletin')
    .replace('%FORMULAIRE%', contact ? 'contact' : kind === 'adhesion' ? 'demande d’adhésion' : 'don')
    .replace('%PAIEMENT%', contact ? '' : '<p>L’envoi du bulletin ne déclenche aucun paiement ni prélèvement.</p>')
    .replace('%STATUTS%', links.statuts)
    .replace('%RIB%', links.rib)
    .replace('%CONFIRMATION%', links.accueil
      ? `<p>Nous reviendrons vers vous dans les plus brefs délais.</p><p><a href="${links.accueil}">Retour à l’accueil</a></p>`
      : '')
    .replace('%FORM%', read(`src/forms/${kind}.html`));
}
export function documentSize(kind: 'brochure' | 'rib') {
  const bytes = statSync(path.resolve(`documents/${kind}-meb-france.pdf`)).size;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(bytes / 1000)} ko`;
}
