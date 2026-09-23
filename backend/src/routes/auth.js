import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { authenticate, call } from '../odoo/client.js';
import { requireAuth, wrap } from '../middleware/auth.js';

const router = Router();

/** Connexion avec les identifiants Odoo du commercial. */
router.post('/login', wrap(async (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) return res.status(400).json({ error: 'Renseignez votre identifiant et votre mot de passe.' });

  const uid = await authenticate(String(login).trim(), String(password));
  if (!uid) return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });

  const [u] = await call('res.users', 'read', [[uid], ['name', 'login', 'email']]);
  const user = { uid, name: u?.name || login, login: u?.login || login, email: u?.email || '' };
  const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  res.json({ token, user });
}));

router.get('/me', requireAuth, (req, res) => {
  const { uid, name, login, email } = req.user;
  res.json({ user: { uid, name, login, email } });
});

export default router;
