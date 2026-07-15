import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This makes asset paths relative (e.g., ./assets/index.js) 
  // so they work when mounted at /app in production
  base: './', 
  
  // This keeps your local development working
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})