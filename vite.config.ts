import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Le moteur PDF (@react-pdf, ~1,2 Mo) est isolé dans un chunk chargé uniquement à
  // l'ouverture du générateur de facture ; l'application principale reste légère.
  build: { chunkSizeWarningLimit: 1300 },
  server: {
    port: 5180,
    strictPort: true,
    host: 'localhost',
    // Les exports d'historique (Freshdesk / Whop) et les outils d'export ne doivent
    // jamais être servis par l'application.
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/exports/**', '**/tools/**'] },
  },
});
