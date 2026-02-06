// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [react(), tailwind()],
  
  // Konfiguracja serwera deweloperskiego
  server: {
    host: true,    // Odpowiednik --host, pozwala Traefikowi "zobaczyć" Astro
    port: parseInt(process.env.PORT || '4321'),
    allowedHosts: true,
    hmr: false
  },

  vite: {
    ssr: {
      external: ['@mshorizon/db', 'postgres', 'drizzle-orm', '@aws-sdk/client-s3']
    }
  }
});