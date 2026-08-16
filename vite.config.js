import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      // forward API + uploaded images to the Node server (see server/index.js)
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  }
})
