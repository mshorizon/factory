// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sentry from '@sentry/astro';
import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    tailwind(),
    ...(process.env.SENTRY_DSN ? [sentry({
      dsn: process.env.SENTRY_DSN,
      sourceMapsUploadOptions: {
        project: process.env.SENTRY_PROJECT || "factory-engine",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    })] : []),
  ],
  
  // Konfiguracja serwera deweloperskiego
  server: {
    host: true,    // Odpowiednik --host, pozwala Traefikowi "zobaczyć" Astro
    port: parseInt(process.env.PORT || '4321'),
    allowedHosts: true,
    hmr: false
  },

  vite: {
    // SITC render engines symlink node_modules from the main repo, so they'd share
    // its node_modules/.vite cache — which, with the render-engine's different config,
    // forces a "config changed" re-optimize that poisons/conflicts. Give each render
    // engine its own cache dir (set per-worktree by EngineManager).
    ...(process.env.SITC_RENDER_ENGINE === '1' && process.env.SITC_VITE_CACHE_DIR
      ? { cacheDir: process.env.SITC_VITE_CACHE_DIR }
      : {}),
    resolve: {
      alias: {
        '@mshorizon/db': resolve(__dirname, '../../packages/db/src/index.ts'),
        // SITC render engine only (gated): force @mshorizon/ui to resolve to THIS
        // tree's source so a per-worktree engine renders the worker's edited
        // components instead of the main repo's. __dirname is the worktree's
        // apps/engine when the engine is launched from inside a worktree, so the
        // relative path lands on the worktree's packages/ui. Dir target (not a
        // single index file) so bare AND subpath imports (@mshorizon/ui/sections/…)
        // both resolve. No-op for the normal dev/prod engine.
        ...(process.env.SITC_RENDER_ENGINE === '1'
          ? {
              '@mshorizon/ui': resolve(__dirname, '../../packages/ui/src'),
              // The SITC_RENDER_ENGINE config change forces Vite to re-optimize
              // deps, which re-scans the WHOLE app (incl. the admin panel). That
              // scan doesn't honor the tsconfig "@/*" path alias, so it fails to
              // resolve the admin/shadcn imports → FailedToLoadModuleSSR on every
              // page. Make "@/" an explicit alias so the scan resolves it.
              '@/': resolve(__dirname, 'src') + '/',
            }
          : {}),
      },
    },
    ssr: {
      external: [
        'postgres',
        'drizzle-orm',
        '@aws-sdk/client-s3',
        'lexical',
        '@lexical/react',
        '@lexical/rich-text',
        '@lexical/list',
        '@lexical/link',
        '@lexical/selection',
        'pino',
        'pino-pretty',
        'stripe'
      ]
    }
  }
});