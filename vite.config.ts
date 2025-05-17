import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para las funciones de Netlify en desarrollo
      '/.netlify/functions': {
        target: 'http://localhost:8889',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['react-icons'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers/zod']
        }
      }
    }
  }
})
