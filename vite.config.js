import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // rutas relativas: funciona en la raíz de un dominio y en github.io/<repo>/
  base: './',
})
