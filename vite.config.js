import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/')) return 'vendor';
          // sample-data first — must stay isolated (nationalTeamData imports it).
          if (id.includes('/src/data/sampleData')) return 'sample-data';
          if (
            id.includes('/src/data/contentManifest') ||
            id.includes('/src/data/leagueManifest') ||
            id.includes('/src/data/datasetMeta')
          ) {
            return 'content-manifest';
          }
          return undefined;
        },
      },
    },
  },
})
