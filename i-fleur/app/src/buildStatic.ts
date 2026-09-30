// : bundle du frontend (esbuild) au démarrage du serveur monolithe
// src/ts/main.ts → public/dist/app.js (racine web = public/)
// En dev : rebuild à chaud (watch). En production : build unique au démarrage.
import * as esbuild from 'esbuild';

// Chemins relatifs à la racine de l'app (process.cwd() = dossier de lancement)
const ENTRY_POINT = 'src/ts/main.ts';
const OUT_FILE = 'public/dist/app.js';

export async function ensureFrontendBuilt(opts: { watch?: boolean } = {}): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';
  const once = isProd || !opts.watch;

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: [ENTRY_POINT],
    outfile: OUT_FILE,
    bundle: true,
    format: 'esm',
    minify: once,
    sourcemap: !once,
    logLevel: 'info',
  };

  if (once) {
    await esbuild.build(buildOptions);
    return;
  }

  // Dev : contexte + watch (rebuild automatique sur changement de src/ts)
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
}
