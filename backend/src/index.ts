import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createPreference } from './routes/createPreference';
import { webhook } from './routes/webhook';
import { checkBookingStatus } from './routes/checkBookingStatus';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas
app.post('/api/create-preference', createPreference);
app.post('/api/webhook', webhook);
app.get('/api/booking/:id/status', checkBookingStatus);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de erro
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 Mercado Pago configurado: ${process.env.MP_ACCESS_TOKEN ? 'Sim' : 'Não'}`);
  console.log(`🗄️ Supabase configurado: ${process.env.SUPABASE_URL ? 'Sim' : 'Não'}`);
});

export default app;
