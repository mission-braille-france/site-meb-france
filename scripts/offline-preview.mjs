import assert from 'node:assert/strict';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const source = path.resolve('dist');
const out = path.resolve('../Apercu MEB France');
const base = '/site-meb-france/';
const read = file => readFileSync(path.join(source, file), 'utf8');
assert(read('index.html').includes('Version de travail'), 'Construisez d’abord l’aperçu avec pnpm run build:review.');

function htmlFiles(dir = '') {
  return readdirSync(path.join(source, dir), { withFileTypes: true }).flatMap(entry => {
    const file = path.posix.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const files = htmlFiles();
const sitePages = files.filter(file => !file.startsWith('documents/'));
const index = sitePages.flatMap(file => {
  const $ = load(read(file));
  const main = $('main[data-pagefind-body]');
  if (!main.length) return [];
  main.find('[data-pagefind-ignore]').remove();
  return [{ file, title: main.find('h1').text(), body: main.text().replace(/\s+/g, ' ').trim() }];
});
function relative(from, to) { return path.posix.relative(path.posix.dirname(from), to) || path.posix.basename(to); }
function inline($, node, script) {
  $(node).replaceWith($('<script></script>').text(script.replace(/<\/script/gi, '<\\/script')));
}
function classic(entry, seen = new Set()) {
  if (seen.has(entry)) return '';
  seen.add(entry);
  let dependencies = '';
  const script = read(entry).replace(/\bimport\s*["'](\.\/[^"']+)["'];?/g, (_, dependency) => {
    dependencies += classic(path.posix.join(path.posix.dirname(entry), dependency), seen);
    return '';
  });
  assert(!/\bimport\s*(?:\(|\{|\*|["'])/.test(script), 'Module externe inattendu dans l’aperçu');
  return dependencies + '\n(() => {\n' + script + '\n})();\n';
}
function offlineSearch(entries) {
  return `(() => {
    const entries = ${JSON.stringify(entries)};
    const form = document.querySelector('#search-form');
    const input = document.querySelector('#search-query');
    const results = document.querySelector('#search-results');
    const status = document.querySelector('#search-status');
    const normalize = value => value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    function search(value) {
      const query = value.trim();
      const terms = normalize(query).split(/\\s+/);
      results.replaceChildren();
      if (!query) { status.textContent = 'Saisissez un mot ou une expression.'; return; }
      const matches = entries.filter(entry => terms.every(term => normalize(entry.title + ' ' + entry.body).includes(term)));
      for (const entry of matches) {
        const li = document.createElement('li');
        const title = document.createElement('h3');
        const link = document.createElement('a');
        link.href = entry.file; link.textContent = entry.title;
        title.append(link); li.append(title); results.append(li);
      }
      status.textContent = matches.length === 0 ? 'Aucun résultat pour « ' + query + ' ».' : matches.length + ' résultat' + (matches.length > 1 ? 's' : '') + ' pour « ' + query + ' ».';
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      search(input.value);
    });
    const initial = new URLSearchParams(window.location.search).get('q')?.slice(0, 200);
    if (initial) { input.value = initial; search(initial); }
  })();`;
}

mkdirSync(out, { recursive: true });
for (const file of ['documents/bulletin-adhesion-2026.html', 'documents/bulletin-don-2026.html', 'plan-du-site/index.html']) {
  const previous = path.join(out, file);
  if (existsSync(previous)) unlinkSync(previous);
}
cpSync(path.join(source, 'documents'), path.join(out, 'documents'), { recursive: true });
cpSync(path.join(source, 'licences-polices'), path.join(out, 'licences-polices'), { recursive: true });
for (const name of readdirSync(path.join(source, '_astro')).filter(file => file.endsWith('.png'))) {
  mkdirSync(path.join(out, '_astro'), { recursive: true });
  cpSync(path.join(source, '_astro', name), path.join(out, '_astro', name));
}
for (const file of files) {
  const $ = load(read(file));
  $('link[rel="canonical"],link[rel="preload"][as="font"],meta[property="og:url"]').remove();
  $('a[href],img[src],form[action]').each((_, node) => {
    const attr = node.tagName === 'img' ? 'src' : node.tagName === 'form' ? 'action' : 'href';
    const href = $(node).attr(attr);
    if (!href?.startsWith(base)) return;
    const url = new URL(href, 'https://example.invalid');
    const pathname = url.pathname.slice(base.length);
    const target = pathname.endsWith('/') || !pathname ? pathname + 'index.html' : pathname;
    if (file === target && url.hash) $(node).attr(attr, url.hash);
    else $(node).attr(attr, relative(file, target) + url.search + url.hash);
  });
  $('link[rel="stylesheet"]').each((_, node) => {
    const href = $(node).attr('href');
    assert(href?.startsWith(base));
    const css = read(href.slice(base.length)).replace(/url\(([^)]+)\)/g, (match, url) => {
      if (!url.startsWith(base)) return match;
      const font = path.join(source, url.slice(base.length));
      return `url(data:font/${path.extname(font).slice(1)};base64,${readFileSync(font).toString('base64')})`;
    });
    $(node).replaceWith($('<style></style>').text(css));
  });
  $('script[type="module"]').each((_, node) => {
    const src = $(node).attr('src');
    if (file === 'recherche/index.html') {
      const searchScript = offlineSearch(index.map(entry => ({ ...entry, file: relative(file, entry.file) })));
      const original = src ? read(src.slice(base.length)) : $(node).text();
      const common = original.match(/\bimport\s*["'](\.\/[^"']+)["']/)?.[1];
      inline($, node, (common ? classic(path.posix.join('_astro', common)) : '') + searchScript);
    } else if (src) {
      assert(src.startsWith(base));
      inline($, node, classic(src.slice(base.length)));
    } else {
      inline($, node, '(() => {\n' + $(node).text().replace(/^export\s+/gm, '') + '\n})();');
    }
  });
  const target = path.join(out, file);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, $.html());
}
for (const file of files) {
  const $ = load(readFileSync(path.join(out, file), 'utf8'));
  assert.equal($('script[src],link[rel="stylesheet"]').length, 0, file);
  $('a[href],img[src],form[action]').each((_, node) => {
    const url = $(node).attr('href') ?? $(node).attr('src') ?? $(node).attr('action');
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|#)/i.test(url)) return;
    assert(!url.startsWith('/'), `Chemin non portable : ${url}`);
    assert(existsSync(path.resolve(out, path.posix.dirname(file), url.split(/[?#]/)[0])), `Lien introuvable : ${file} → ${url}`);
  });
}
writeFileSync(path.join(out, 'Lisez-moi.txt'), 'Aperçu privé de MEB France\r\n\r\nExtrayez tout le contenu de l’archive, puis ouvrez index.html dans votre navigateur.\r\nGardez les sous-dossiers avec index.html : ils contiennent les pages et les documents.\r\nLe site n’est pas publié. Pour les essais des bulletins, utilisez des renseignements fictifs.\r\n');
console.log(`${files.length} pages prêtes à ouvrir hors ligne ; liens vérifiés. ${out}`);
