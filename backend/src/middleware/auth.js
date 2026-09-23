import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Session expirée, reconnectez-vous.' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée, reconnectez-vous.' });
  }
}

/** Enveloppe les handlers async pour transmettre les erreurs au gestionnaire global. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
