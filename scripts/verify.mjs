import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { load } from 'cheerio';

const directory = path.resolve('dist');
const base = '/';
const isReview = process.argv.includes('--review');
const routes = ['rencontres-et-sejours', 'devenir-benevole', 'nous-soutenir', 'sensibiliser-les-eglises', 'contact'];
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(item => {
    const file = path.join(dir, item.name);
    return item.isDirectory() ? htmlFiles(file) : item.name.endsWith('.html') ? [file] : [];
  });
}
const titles = new Set();
const files = htmlFiles(directory);
for (const file of files) {
  const $ = load(readFileSync(file, 'utf8'));
  const relative = path.relative(directory, file);
  const download = relative.startsWith(`documents${path.sep}`);
  assert.equal($('html').attr('lang'), 'fr', `${relative}: langue`);
  assert.equal($('main#main').length, 1, `${relative}: repère principal`);
  assert.equal($('main').length, 1, `${relative}: un seul main`);
  assert.equal($('h1').length, 1, `${relative}: un seul h1`);
  assert.match($('title').text(), download ? / — MEB France$/ : / · MEB France$/, `${relative}: titre`);
  assert(!titles.has($('title').text()), `${relative}: titre unique`);
  titles.add($('title').text());
  if (!download) assert.equal($('body a').first().text(), 'Aller au contenu principal');
  assert.equal($('[tabindex]').filter((_, el) => Number($(el).attr('tabindex')) > 0).length, 0);
  let level = 0;
  $('h1,h2,h3,h4,h5,h6').each((_, el) => {
    const next = Number(el.tagName.slice(1));
    assert(next <= level + 1, `${relative}: saut de titre ${level} → ${next}`);
    level = next;
  });
  $('input,select,textarea').each((_, el) => {
    const id = $(el).attr('id');
    assert(id && $('label').toArray().some(label => $(label).attr('for') === id), `${relative}: champ sans libellé`);
  });
  assert.equal($('img:not([alt])').length, 0, `${relative}: image sans alternative`);
  $('a[href],script[src],link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href') ?? $(el).attr('src');
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;
    assert(href.startsWith(base) && !href.startsWith('//'), `${relative}: chemin hors base ${href}`);
    const url = new URL(href, 'https://meb-france.org');
    const local = decodeURIComponent(url.pathname.slice(base.length));
    const target = path.join(directory, local, url.pathname.endsWith('/') ? 'index.html' : '');
    assert(existsSync(target), `${relative}: lien cassé ${href}`);
    if (url.hash && target.endsWith('.html')) {
      const targetDoc = load(readFileSync(target, 'utf8'));
      assert(targetDoc('[id]').toArray().some(node => targetDoc(node).attr('id') === decodeURIComponent(url.hash.slice(1))), `${relative}: ancre manquante ${href}`);
    }
  });
  if (isReview && !download) assert.equal($('meta[name="robots"]').attr('content'), 'noindex, nofollow');
}
for (const route of routes) {
  assert.equal(existsSync(path.join(directory, route, 'index.html')), isReview, `${route}: protection des brouillons`);
}
if (!isReview) {
  assert(!existsSync(path.join(directory, 'documents')), 'Documents brouillons accessibles');
  assert(!existsSync(path.join(directory, 'nous-soutenir')), 'Bulletins brouillons accessibles');
  const all = files.map(file => readFileSync(file, 'utf8')).join('\n');
  assert(!all.includes('FR76 1027') && !all.includes('assomebfrance@gmail.com'), 'Un contenu brouillon a fui dans la construction publique.');
}

function luminance(hex) {
  const rgb = hex.match(/[\da-f]{2}/gi).map(channel => parseInt(channel, 16) / 255)
    .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}
const css = readFileSync('src/styles/global.css', 'utf8');
function colorsFor(selector) {
  const start = css.indexOf(`${selector} {`);
  assert(start !== -1, `Palette introuvable : ${selector}`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/--(color-[\w-]+):\s*(#[\da-f]{6})/g)].map(match => [match[1], match[2]]));
}
const lightTheme = colorsFor(':root');
const max = colorsFor(":root[data-contrast='max']:not([data-theme='yellow'])");
const palettes = [
  { standard: lightTheme, max: { ...lightTheme, ...max } },
  ...['dark', 'sepia', 'yellow'].map(name => {
    const standard = { ...lightTheme, ...colorsFor(`:root[data-theme='${name}']`) };
    const maxOverrides = colorsFor(`:root[data-contrast='max'][data-theme='${name}']`);
    return { standard, max: { ...standard, ...(name === 'yellow' ? {} : max), ...maxOverrides } };
  })
];
let minimum = Infinity;
function verifyTextContrast(theme, fg, bg) {
  const ratio = contrast(theme[fg], theme[bg]);
  minimum = Math.min(minimum, ratio);
  assert(ratio >= 4.5, `Contraste texte ${fg}/${bg}: ${ratio.toFixed(2)}`);
}
for (const theme of palettes.flatMap(palette => [palette.standard, palette.max])) {
  for (const fg of ['color-text', 'color-muted', 'color-link', 'color-hover']) {
    for (const bg of ['color-bg', 'color-surface', 'color-tint']) {
      verifyTextContrast(theme, fg, bg);
    }
  }
  for (const bg of ['color-bg', 'color-surface', 'color-tint']) {
    assert(contrast(theme['color-control-border'], theme[bg]) >= 3, 'Bordure de champ insuffisante');
    assert(contrast(theme['color-focus'], theme[bg]) >= 3, 'Focus insuffisant');
  }
  for (const bg of ['color-brand-fill', 'color-hover-fill', 'color-settings-fill', 'color-settings-hover']) verifyTextContrast(theme, 'color-on-fill', bg);
}
for (const { standard: theme } of palettes) {
  verifyTextContrast(theme, 'color-hero-text', 'color-hero-bg');
  verifyTextContrast(theme, 'color-hero-accent', 'color-hero-bg');
}
console.log(`${files.length} pages vérifiées : liens, titres, repères, champs, brouillons. Contraste de texte minimal calculé : ${minimum.toFixed(2)}:1.`);
