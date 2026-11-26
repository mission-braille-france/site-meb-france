import { visit } from 'unist-util-visit';

// Adapté du fichier de Tous Azimuts, consulté sans modification du dépôt source.
// Les liens vers la MEB Suisse ouvrent une nouvelle fenêtre annoncée dans le libellé.
export function rehypeExternalLinks({ site }) {
  const hostname = new URL(site).hostname;
  return tree => visit(tree, 'element', node => {
    if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
    let url;
    try { url = new URL(node.properties.href, site); }
    catch { return; }
    if (!/^https?:$/.test(url.protocol) || url.hostname === hostname) return;
    node.properties.rel = ['noopener', 'noreferrer'];
    if (['mebraille.ch', 'www.mebraille.ch'].includes(url.hostname)) {
      node.properties.target = '_blank';
      node.children.push({ type: 'text', value: ' (nouvelle fenêtre)' });
    }
  });
}
