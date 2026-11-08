import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Window } from 'happy-dom';

const root = path.resolve('../Apercu MEB France');
function open(file, query = '', online = false) {
  const absolute = path.join(root, file);
  const window = new Window({
    url: (online ? 'https://meb.example.invalid/' + file : pathToFileURL(absolute).href) + query,
    settings: { enableJavaScriptEvaluation: false }
  });
  const doc = window.document;
  doc.write(readFileSync(absolute, 'utf8'));
  const requests = [];
  if (online) {
    const bulletin = doc.querySelector('[data-bulletin]');
    bulletin.dataset.demo = 'false';
    bulletin.dataset.endpoint = 'https://formspree.io/f/testlocal';
    window.fetch = async (url, options) => {
      requests.push({ url, options });
      return { ok: requests.length > 1, status: requests.length > 1 ? 200 : 429 };
    };
  }
  for (const script of doc.querySelectorAll('script')) {
    // Exécuter uniquement le JavaScript construit par le projet, sans navigateur ni réseau.
    new Function('window', 'document', 'localStorage', script.textContent)(window, doc, window.localStorage);
  }
  const get = id => doc.getElementById(id);
  return { window, doc, get, requests };
}
function submit(window, form) {
  const event = new window.Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(event);
  assert(event.defaultPrevented, 'Aucune soumission réseau');
}
for (const [kind, file, online] of [
  ['adhesion', 'nous-soutenir/adhesion-2026/index.html'],
  ['don', 'nous-soutenir/don-2026/index.html'],
  ['don', 'nous-soutenir/don-2026/index.html', true]
]) {
  const { window, doc, get, requests } = open(file, '', online);
  const form = doc.querySelector('form.bulletin-form');
  assert.equal(doc.querySelector('a[href="../../statuts/index.html"]').textContent, 'Lire les statuts de MEB France');
  assert(doc.querySelector('a[href="../../documents/rib-meb-france.pdf"][download]'));
  assert(!form.hidden, file);
  assert(!form.querySelector('button[type="submit"]').disabled);
  submit(window, form);
  assert(!doc.querySelector('.form-errors').hidden, file);
  assert.equal(doc.activeElement, doc.querySelector('.form-errors'));
  doc.querySelector('.form-errors a').click();
  assert.equal(doc.activeElement, get('nom'));
  for (const [id, value] of Object.entries({
    nom: 'Exemple', prenom: 'Camille', adresse: '1 rue Fictive', code_postal: '75000',
    ville: 'Paris', tel_portable: '0600000000', email: 'test@example.invalid', signature: 'Camille Exemple'
  })) get(id).value = value;
  if (kind === 'adhesion') {
    get('statut_oui').checked = true;
    get('paiement_virement').checked = true;
    submit(window, form);
    assert(!get('nouvel-adherent-block').hidden);
    assert(!doc.querySelector('.form-errors').hidden);
    get('engagement_principes').checked = true;
    get('engagement_statuts').checked = true;
  } else {
    get('type_don_ponctuel').checked = true;
    get('paiement_virement').checked = true;
    get('recu_non').checked = true;
    get('montant_ponctuel').value = '0';
    submit(window, form);
    assert(!doc.querySelector('.form-errors').hidden);
    get('montant_ponctuel').value = '20,50';
  }
  submit(window, form);
  assert(!doc.querySelector('.bulletin-summary').hidden, `${file}: ${doc.querySelector('.form-errors').textContent}`);
  assert.equal(doc.activeElement, doc.querySelector('.summary-heading'));
  assert.match(doc.querySelector('.summary-content').textContent, /Camille Exemple/);
  if (kind === 'don') assert.match(doc.querySelector('.summary-content').textContent, /20,50 euros/);
  doc.querySelector('[data-edit]').click();
  assert(!form.hidden);
  assert.equal(get('prenom').value, 'Camille');
  submit(window, form);
  const send = doc.querySelector('[data-send]');
  assert.equal(send.textContent, online ? 'Envoyer le bulletin' : 'Simuler l’envoi');
  send.click();
  await Promise.resolve();
  if (online) {
    assert.match(doc.querySelector('.bulletin-status').textContent, /Trop de demandes/);
    assert.equal(get('prenom').value, 'Camille');
    send.click();
    await Promise.resolve();
    assert.equal(requests.length, 2);
    assert.equal(requests[1].options.method, 'POST');
    assert.equal(requests[1].options.body.get('email'), 'test@example.invalid');
    assert(!requests[1].options.body.has('don_iban'));
  }
  assert.equal(doc.activeElement.textContent, online ? 'Bulletin envoyé' : 'Simulation terminée');
  assert.equal(get('don_iban'), null);
  window.close();
}
const home = open('index.html');
assert(home.doc.querySelector('a[href="documents/brochure-meb-france.pdf"][download]'));
const headerSearch = home.doc.querySelector('header form[role="search"]');
assert.equal(headerSearch.getAttribute('method'), 'get');
assert.equal(headerSearch.getAttribute('action'), 'recherche/index.html');
assert.equal(headerSearch.querySelector('input[type="search"]').name, 'q');
home.window.close();
const { window, doc, get } = open('recherche/index.html', '?q=sejours');
assert.equal(get('search-query').value, 'sejours');
assert(doc.querySelector('#search-results a[href="../rencontres-et-sejours/index.html"]'));
get('search-query').value = 'terme-inexistant-98765';
submit(window, get('search-form'));
assert.match(get('search-status').textContent, /Aucun résultat/);
window.close();
console.log('Recherche et simulation des deux bulletins : vérifications réussies.');
