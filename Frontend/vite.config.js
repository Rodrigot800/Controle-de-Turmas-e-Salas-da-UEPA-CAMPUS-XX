import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,

    port: 5173, // Mudar a porta do servidor local

    proxy: {
      "/api": "http://192.168.18.57/:3001", // Redirecionar chamadas pro seu Backend
    },
  },
});
