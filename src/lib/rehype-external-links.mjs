import { visit } from 'unist-util-visit';

// Adapté du fichier de Tous Azimuts, consulté sans modification du dépôt source.
// Un même contexte de navigation, sauf demande explicite de nouvel onglet.
export function rehypeExternalLinks() {
  return tree => visit(tree, 'element', node => {
    if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
    let url;
    try { url = new URL(node.properties.href, 'https://mission-braille-france.github.io'); }
    catch { return; }
    if (!/^https?:$/.test(url.protocol) || url.hostname === 'mission-braille-france.github.io') return;
    node.properties.rel = ['noopener', 'noreferrer'];
  });
}
