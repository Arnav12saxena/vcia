import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // ── Dev server ─────────────────────────────────────────
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },

    // ── Preview server (npm run preview) ───────────────────
    preview: {
      port: 4173,
      host: true,
    },

    // ── Production build ────────────────────────────────────
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Target modern browsers (drops IE11 polyfills)
      target: 'es2020',

      rollupOptions: {
        output: {
          // Split large vendor chunks for better caching
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor'
            }
          },
          // Content-hash filenames for cache busting
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        }
      },

      // Warn if any chunk is over 1MB
      chunkSizeWarningLimit: 1000,
    },

    // ── Environment variable exposure ───────────────────────
    define: {
      // Expose build time
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.2.0'),
    },
  }
})
