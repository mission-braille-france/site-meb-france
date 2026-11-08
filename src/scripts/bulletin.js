export function validAmount(value) {
  const text = value.trim();
  return /^\d+([,.]\d{1,2})?$/.test(text) && Number(text.replace(',', '.')) > 0;
}
export function validIban(value) {
  const iban = value.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const expected = { FR: 27, DE: 22, BE: 16, ES: 24, IT: 27, NL: 18, LU: 20, CH: 21, GB: 22 };
  if (expected[iban.slice(0, 2)] && iban.length !== expected[iban.slice(0, 2)]) return false;
  const sequence = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const digit of sequence) rest = (rest * 10 + Number(digit)) % 97;
  return rest === 1;
}

export function setupBulletin(root) {
  const form = root.querySelector('form');
  const kind = root.dataset.kind;
  const summary = root.querySelector('.bulletin-summary');
  const summaryHeading = root.querySelector('.summary-heading');
  const list = root.querySelector('.summary-content');
  const errors = root.querySelector('.form-errors');
  const errorList = errors.querySelector('ul');
  const status = root.querySelector('.bulletin-status');
  const send = root.querySelector('[data-send]');
  const edit = root.querySelector('[data-edit]');
  const demo = root.dataset.demo === 'true';
  const endpoint = window.location.protocol === 'https:' && /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(root.dataset.endpoint ?? '') ? root.dataset.endpoint : '';
  root.querySelector('[data-submission-mode]').textContent = demo
    ? 'Aperçu : utilisez des renseignements fictifs. L’envoi est simulé.'
    : endpoint ? 'Vos renseignements seront transmis à MEB France via Formspree après votre confirmation.'
    : 'L’envoi en ligne n’est pas encore disponible. Vous pouvez contacter l’association.';
  send.hidden = !demo && !endpoint;
  if (demo) send.textContent = 'Simuler l’envoi';
  const fields = [...form.querySelectorAll('input')];
  const field = id => form.querySelector(`#${id}`);
  const radio = name => form.querySelector(`input[name="${name}"]:checked:not(:disabled)`)?.value ?? '';

  function block(id, show, required = []) {
    const element = field(id) ?? root.querySelector(`#${id}`);
    if (!element) return;
    element.hidden = !show;
    element.querySelectorAll('input').forEach(input => {
      input.disabled = !show;
      input.required = show && required.includes(input.id);
      if (!show) { input.removeAttribute('aria-invalid'); input.setCustomValidity(''); }
    });
  }
  function sync() {
    if (kind === 'adhesion') {
      block('nouvel-adherent-block', radio('statut_adherent') === 'Oui', ['engagement_principes', 'engagement_statuts']);
      block('virement-adhesion-block', radio('paiement_adhesion') === 'Virement');
    } else {
      const regular = radio('type_don') === 'Régulier';
      const once = radio('type_don') === 'Ponctuel';
      block('ponctuel-block', once, ['montant_ponctuel']);
      block('regulier-block', regular, ['montant_10', 'montant_20', 'montant_autre']);
      block('montant-autre-block', regular && radio('montant_regulier') === 'Autre', ['montant_regulier_autre']);
      root.querySelectorAll('[data-one-off-payment]').forEach(row => {
        row.hidden = regular;
        row.querySelector('input').disabled = regular;
        if (regular) row.querySelector('input').checked = false;
      });
      const debit = field('paiement_prelevement');
      debit.closest('.radio-row').hidden = once;
      debit.disabled = once;
      if (regular) debit.checked = true;
      if (once) debit.checked = false;
      block('virement-don-block', radio('paiement_don') === 'Virement');
      block('prelevement-block', regular, ['periodicite_mensuelle', 'periodicite_trimestrielle', 'periodicite_annuelle']);
    }
    // Corriger une erreur doit aussi effacer son ancien état programmatique.
    fields.forEach(input => {
      input.setCustomValidity('');
      input.removeAttribute('aria-invalid');
      const errorId = `${input.id}-error`;
      const ids = (input.getAttribute('aria-describedby') ?? '').split(' ').filter(id => id && !id.endsWith('-error'));
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
      root.querySelector(`#${errorId}`)?.remove();
    });
    if (!errors.hidden) {
      errors.hidden = true;
      status.textContent = 'Le bulletin a été modifié. Activez « Vérifier le bulletin » pour le vérifier à nouveau.';
    }
  }

  function label(input) {
    if (input.type === 'radio') return input.closest('fieldset').querySelector('legend').textContent.replace(/\s*\(obligatoire\)/, '').trim();
    return form.querySelector(`label[for="${input.id}"]`)?.textContent.replace(/\s*\(obligatoire[^)]*\)/, '').trim() ?? input.id;
  }
  function validate() {
    const found = [];
    const groups = new Set();
    fields.forEach(input => {
      if (input.disabled || input.readOnly || input.closest('[hidden]')) return;
      input.setCustomValidity('');
      if (input.required && !['checkbox', 'radio'].includes(input.type) && !input.value.trim()) input.setCustomValidity('Renseignez ce champ.');
      if (input.hasAttribute('data-money') && input.value && !validAmount(input.value)) input.setCustomValidity('Saisissez un montant supérieur à zéro, avec deux décimales au maximum.');
      if (input.id === 'don_iban' && input.value && !validIban(input.value)) input.setCustomValidity('Vérifiez l’IBAN : sa structure ou sa clé de contrôle est incorrecte.');
      if (input.id === 'don_bic' && input.value && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(input.value.replace(/\s/g, '').toUpperCase())) input.setCustomValidity('Saisissez un BIC de 8 ou 11 caractères.');
      if (input.validity.valid) return;
      const message = input.type === 'radio' ? 'Choisissez une option.'
        : input.type === 'checkbox' ? 'Confirmez cet engagement pour une première adhésion.'
        : input.validity.typeMismatch ? 'Vérifiez le format de l’adresse e-mail.'
        : input.validationMessage;
      if (input.type === 'radio' && groups.has(input.name)) return;
      groups.add(input.name);
      found.push({ input, message, label: label(input) });
    });
    return found;
  }

  function pairs() {
    const items = [];
    const seen = new Set();
    fields.forEach(input => {
      if (input.disabled || input.readOnly || input.closest('[hidden]')) return;
      if (['radio', 'checkbox'].includes(input.type) && !input.checked) return;
      if (input.type === 'radio') {
        if (!seen.has(input.name)) items.push([label(input), input.value]);
        seen.add(input.name);
      } else if (input.type === 'checkbox') items.push([label(input), 'Oui']);
      else if (input.value.trim()) {
        let v = input.value.trim();
        if (input.type === 'date') v = v.split('-').reverse().join('/');
        if (input.hasAttribute('data-money')) v += ' euros';
        items.push([label(input), v]);
      }
    });
    if (kind === 'adhesion') items.push(['Cotisation statutaire 2026 (minimum de base)', '20 euros']);
    return items;
  }
  form.addEventListener('input', sync);
  form.addEventListener('change', sync);
  form.addEventListener('submit', event => {
    event.preventDefault();
    sync();
    const invalid = validate();
    errorList.replaceChildren();
    if (invalid.length) {
      for (const item of invalid) {
        const errorId = `${item.input.id}-error`;
        const inline = document.createElement('p');
        inline.id = errorId;
        inline.className = 'field-error';
        inline.textContent = item.message;
        const group = item.input.type === 'radio' ? fields.filter(input => input.name === item.input.name) : [item.input];
        group.forEach(input => {
          input.setAttribute('aria-invalid', 'true');
          input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), errorId].filter(Boolean).join(' '));
        });
        (item.input.type === 'radio' ? item.input.closest('fieldset') : item.input.parentElement).append(inline);
        const li = document.createElement('li');
        const link = document.createElement('a');
        const url = new URL(window.location.href); url.hash = item.input.id;
        link.href = url.href;
        link.textContent = `${item.label} : ${item.message}`;
        link.addEventListener('click', event => { event.preventDefault(); item.input.focus(); });
        li.append(link); errorList.append(li);
      }
      errors.hidden = false;
      errors.focus();
      return;
    }
    list.replaceChildren();
    const data = pairs();
    data.forEach(([key, val]) => {
      const dt = document.createElement('dt'); dt.textContent = key;
      const dd = document.createElement('dd'); dd.textContent = val;
      list.append(dt, dd);
    });
    status.textContent = '';
    form.hidden = true;
    summary.hidden = false;
    summaryHeading.focus();
  });
  edit.addEventListener('click', () => {
    status.textContent = '';
    summary.hidden = true;
    form.hidden = false;
    form.querySelector('button[type="submit"]').focus();
  });
  send.addEventListener('click', async () => {
    if ((!demo && !endpoint) || send.disabled || summary.hidden) return;
    send.disabled = edit.disabled = true;
    try {
      if (!demo) {
        status.textContent = 'Envoi en cours…';
        const payload = new window.FormData(form);
        payload.delete('don_iban');
        payload.delete('don_bic');
        payload.set('bulletin', kind === 'adhesion' ? 'Adhésion 2026' : 'Don 2026');
        const response = await window.fetch(endpoint, {
          method: 'POST', body: payload, headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
          status.textContent = response.status === 429 ? 'Trop de demandes. Patientez avant de réessayer.' : 'L’envoi a été refusé. Vous pouvez réessayer ou contacter l’association.';
          return;
        }
      }
      form.reset();
      list.replaceChildren();
      summary.hidden = true;
      status.textContent = '';
      const heading = root.querySelector('[data-confirmation]');
      heading.textContent = demo ? 'Simulation terminée' : 'Bulletin envoyé';
      root.querySelector('[data-confirmation-details]').textContent = demo ? 'Aucun renseignement n’a été transmis.' : 'Votre bulletin a été transmis à MEB France.';
      heading.parentElement.hidden = false;
      heading.focus();
    } catch {
      status.textContent = 'Impossible de confirmer l’envoi. Vos renseignements sont toujours affichés. Contactez l’association si nécessaire.';
    } finally {
      send.disabled = edit.disabled = false;
      if (!summary.hidden) send.focus();
    }
  });
  const today = new Date();
  field('date').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  sync();
  form.querySelector('button[type="submit"]').disabled = false;
  root.querySelector('.bulletin-loading').hidden = true;
}
if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-bulletin]').forEach(setupBulletin);
}
