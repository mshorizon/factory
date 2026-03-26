// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import sentry from '@sentry/astro';

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
    ssr: {
      external: [
        '@mshorizon/db',
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
        'pino-pretty'
      ]
    }
  }
});