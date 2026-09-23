import { Router } from 'express';
import { config } from '../config.js';
import { call, searchRead, modelFields } from '../odoo/client.js';
import { requireAuth, wrap } from '../middleware/auth.js';
import { loadProducts, pricingContext, unitPrice, rulesFor } from '../services/pricing.js';

const router = Router();
router.use(requireAuth);

function mapClient(p) {
  return {
    id: p.id,
    name: p.name,
    city: p.city || '',
    street: p.street || '',
    email: p.email || '',
    phone: p.phone || p.mobile || '',
    pricelist: Array.isArray(p.property_product_pricelist) ? p.property_product_pricelist[1] : null,
  };
}

async function clientFields() {
  const f = await modelFields('res.partner');
  return ['name', 'city', 'street', 'email', 'phone', 'mobile', 'property_product_pricelist'].filter((x) => f.has(x));
}

async function getClient(id) {
  const [p] = await call('res.partner', 'read', [[id], await clientFields()]);
  return p ? mapClient(p) : null;
}

/** Liste des clients. */
router.get('/', wrap(async (req, res) => {
  const f = await modelFields('res.partner');
  const domain = [['active', '=', true]];
  if (f.has('customer_rank')) domain.push(['customer_rank', '>', 0]);
  else domain.push(['is_company', '=', true]);
  if (config.clientsOnlyMine) domain.push(['user_id', '=', req.user.uid]);
  const rows = await searchRead('res.partner', domain, await clientFields(), { order: 'name asc', limit: 1000 });
  res.json({ clients: rows.map(mapClient) });
}));

router.get('/:id', wrap(async (req, res) => {
  const client = await getClient(Number(req.params.id));
  if (!client) return res.status(404).json({ error: 'Client introuvable.' });
  res.json({ client });
}));

/** Produits avec le prix propre au client (quantité 1). */
router.get('/:id/products', wrap(async (req, res) => {
  const partnerId = Number(req.params.id);
  const [products, ctx] = await Promise.all([loadProducts(), pricingContext(partnerId)]);
  const out = [];
  for (const p of products) out.push({ ...p, price: await unitPrice(p, 1, ctx), cost: undefined });
  res.json({ products: out, pricelist: ctx.pricelist?.name || null });
}));

/** Détail d'un produit pour ce client, avec les règles de calcul de sa liste de prix. */
router.get('/:id/products/:productId', wrap(async (req, res) => {
  const partnerId = Number(req.params.id);
  const [[product], ctx] = await Promise.all([
    loadProducts({ ids: [Number(req.params.productId)] }),
    pricingContext(partnerId),
  ]);
  if (!product) return res.status(404).json({ error: 'Produit introuvable ou non vendable.' });
  res.json({
    product: { ...product, price: await unitPrice(product, 1, ctx), cost: undefined },
    ...rulesFor(product, ctx),
    vatRate: config.vatRate,
  });
}));

/** Prix unitaires selon les quantités (les règles Odoo peuvent dépendre de la quantité). */
router.post('/:id/quote', wrap(async (req, res) => {
  const partnerId = Number(req.params.id);
  const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
  const ids = [...new Set(lines.map((l) => Number(l.productId)).filter(Boolean))];
  if (!ids.length) return res.json({ lines: [] });
  const [products, ctx] = await Promise.all([loadProducts({ ids }), pricingContext(partnerId)]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const out = [];
  for (const l of lines) {
    const p = byId.get(Number(l.productId));
    if (!p) continue;
    const qty = Math.max(1, Number(l.qty) || 1);
    out.push({ productId: p.id, qty, unitPrice: await unitPrice(p, qty, ctx) });
  }
  res.json({ lines: out });
}));

export default router;
