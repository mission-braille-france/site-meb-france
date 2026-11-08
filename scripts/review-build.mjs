import { spawnSync } from 'node:child_process';

// Sortie réservée à la relecture locale. Ne jamais déployer ce dossier.
const env = { ...process.env, MEB_REVIEW: 'true', ASTRO_TELEMETRY_DISABLED: '1' };
for (const [entry, args] of [
  ['node_modules/astro/astro.js', ['build']],
  ['node_modules/pagefind/lib/runner/bin.cjs', ['--site', 'dist']]
]) {
  const result = spawnSync(process.execPath, [entry, ...args], { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
