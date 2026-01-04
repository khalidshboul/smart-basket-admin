import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'https://aleah-nonoperational-cordia.ngrok-free.dev/smart-basket/api/v1',//aleah-nonoperational-cordia.ngrok-free.dev
      //https://aleah-nonoperational-cordia.ngrok-free.dev/smart-basket/api/v1
      'all',
    ],
    hmr: {
      clientPort: 443,
    },
    /*proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },*/
  }
})
