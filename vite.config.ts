import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6300,
    open: true,
    host:'0.0.0.0',
    allowedHosts:['.onrender.com','localhost']
  },

})