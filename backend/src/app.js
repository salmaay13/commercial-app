import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import orderRoutes from './routes/orders.js';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ ok: true, vatRate: config.vatRate }));
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Route inconnue.' }));
app.use((err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

export default app;