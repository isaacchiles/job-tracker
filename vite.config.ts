import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isSingleFile = mode === 'singlefile' || process.env.BUILD_SINGLE === 'true';

  const plugins = [
    react(),
    tailwindcss(),
    // Single-file plugin: produces a self-contained index.html (all JS/CSS inlined)
    // Use `npm run build:html` to generate dist/index.html as a standalone HTML document
    viteSingleFile(),
  ];

  // Only include PWA for normal multi-file builds (avoids SW registration issues on file:// single HTML)
  if (!isSingleFile) {
    plugins.splice(2, 0, VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'JobTracker',
        short_name: 'JobTracker',
        description: 'Track companies, opportunities, contacts, and meetings locally.',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }));
  }

  return {
    // Relative base for the single-file build so it works when served from a
    // project subpath (e.g. GitHub Pages: /job-tracker/) or opened via file://.
    base: isSingleFile ? './' : '/',
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Recommended for single file to avoid some chunking issues
      cssCodeSplit: false,
      assetsInlineLimit: 10000000, // inline most assets
    },
  };
});
