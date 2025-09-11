import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Definir variáveis de ambiente para o Vite
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://xtufbfvrgpzqbvdfmtiy.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0dWZiZnZyZ3B6cWJ2ZGZtdGl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODUzMDYsImV4cCI6MjA3MTM2MTMwNn0.kckI90iRHcw2hY_J5-tNveAzB1oD8xRT7MyM_tLDZ4M'),
    // Chave pública do Mercado Pago - será substituída pelas chaves de produção do administrador
    'import.meta.env.VITE_MP_PUBLIC_KEY': JSON.stringify('TEST-7b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b'),
  },
})