(() => {
  const key = 'meb-display-settings';
  const choices = {
    theme: ['system', 'light', 'dark'],
    contrast: ['standard', 'max'],
    size: ['100', '112', '125', '150'],
    spacing: ['normal', 'airy', 'wide'],
    font: ['manrope', 'luciole', 'atkinson', 'arial', 'verdana']
  };
  const root = document.documentElement;
  function load() {
    try {
      return JSON.parse(localStorage.getItem(key) ?? 'null') ?? { theme: localStorage.getItem('meb-theme') };
    } catch { return {}; }
  }
  function apply(input = {}) {
    const selected = Object.fromEntries(Object.entries(choices).map(([name, values]) =>
      [name, values.includes(input[name]) ? input[name] : values[0]]));
    Object.assign(root.dataset, selected);
    document.querySelector('meta[name="color-scheme"]').content = selected.theme === 'system' ? 'light dark' : selected.theme;
    return selected;
  }
  let selected = apply(load());
  document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('display-dialog');
    const trigger = document.getElementById('display-open');
    const status = document.getElementById('display-status');
    if (typeof dialog?.showModal !== 'function' || !trigger || !status) return;
    const radios = [...dialog.querySelectorAll('input[type="radio"]')];
    function sync() {
      radios.forEach(input => { input.checked = input.value === selected[input.name]; });
    }
    function save(next) {
      selected = apply(next);
      try { localStorage.setItem(key, JSON.stringify(selected)); } catch {}
      sync();
    }
    trigger.addEventListener('click', () => {
      if (!dialog.open) { status.textContent = ''; sync(); dialog.showModal(); }
    });
    dialog.addEventListener('change', event => {
      const input = event.target;
      if (!radios.includes(input) || !input.checked) return;
      save({ ...selected, [input.name]: input.value });
      status.textContent = input.closest('fieldset').querySelector('legend').textContent + ' : ' + input.labels[0].textContent + '.';
    });
    document.getElementById('display-reset').addEventListener('click', () => {
      save({});
      status.textContent = 'Réglages d’affichage réinitialisés.';
    });
    window.addEventListener('storage', event => {
      if (event.key !== key && event.key !== null) return;
      selected = apply(load()); sync();
    });
    sync();
    trigger.hidden = false;
  }, { once: true });
})();
