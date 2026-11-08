export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  // Les chemins déjà préfixés de Pagefind restent inchangés.
  if (base && (path === base || path.startsWith(`${base}/`))) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
