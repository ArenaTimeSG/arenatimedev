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
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://ogzlvdpdngwbgqeiayec.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nemx2ZHBkbmd3YmdxZWlheWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0OTAzNjksImV4cCI6MjA3NjA2NjM2OX0.KSQVdj50BY5s1mBsU6B3Ut9t7xfFW7z5LsPx4JPHYeg'),
    // Chave pública do Mercado Pago - PRODUÇÃO
    'import.meta.env.VITE_MP_PUBLIC_KEY': JSON.stringify(process.env.VITE_MP_PUBLIC_KEY || 'APP_USR_12345678-1234-1234-1234-123456789012'),
  },
})