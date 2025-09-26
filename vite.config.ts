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
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://xjsovawofsibcolnrgxl.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'),
    // Chave pública do Mercado Pago - PRODUÇÃO
    'import.meta.env.VITE_MP_PUBLIC_KEY': JSON.stringify(process.env.VITE_MP_PUBLIC_KEY || 'APP_USR_12345678-1234-1234-1234-123456789012'),
  },
})