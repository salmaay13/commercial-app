import { Router } from 'express';
import { config } from '../config.js';
import { call, searchRead, modelFields, orderUrl } from '../odoo/client.js';
import { requireAuth, wrap } from '../middleware/auth.js';
import { loadProducts, pricingContext, unitPrice } from '../services/pricing.js';

const router = Router();
router.use(requireAuth);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const ORDER_FIELDS = ['name', 'partner_id', 'date_order', 'amount_untaxed', 'amount_tax', 'amount_total', 'state', 'user_id'];

const STATE_LABELS = { draft: 'Devis', sent: 'Devis envoyé', sale: 'Confirmée', done: 'Verrouillée', cancel: 'Annulée' };

function mapOrder(o) {
  return {
    id: o.id,
    number: o.name,
    clientId: Array.isArray(o.partner_id) ? o.partner_id[0] : null,
    client: Array.isArray(o.partner_id) ? o.partner_id[1] : '',
    date: o.date_order,
    amountUntaxed: o.amount_untaxed,
    amountTax: o.amount_tax,
    amountTotal: o.amount_total,
    state: o.state,
    stateLabel: STATE_LABELS[o.state] || o.state,
    odooUrl: orderUrl(o.id),
  };
}

const ownDomain = (uid) => (config.ordersOnlyMine ? [['user_id', '=', uid]] : []);

let taxCache;
async function vatTaxId() {
  if (config.odoo.taxId) return config.odoo.taxId;
  if (taxCache !== undefined) return taxCache;
  const [tax] = await searchRead('account.tax',
    [['type_tax_use', '=', 'sale'], ['amount_type', '=', 'percent'], ['amount', '=', 20]], ['id'], { limit: 1 });
  taxCache = tax?.id || null;
  if (!taxCache) console.warn('[orders] Aucune taxe de vente à 20 % trouvée dans Odoo — définir ODOO_TAX_ID.');
  return taxCache;
}

/** Statistiques du tableau de bord (calculées à partir des vraies commandes Odoo). */
router.get('/stats', wrap(async (req, res) => {
  const orders = await searchRead('sale.order', [...ownDomain(req.user.uid), ['state', '!=', 'cancel']],
    ['partner_id', 'amount_total', 'state'], { limit: 5000 });
  const confirmed = orders.filter((o) => o.state === 'sale' || o.state === 'done');
  res.json({
    totalOrders: orders.length,
    revenue: round2(confirmed.reduce((s, o) => s + (o.amount_total || 0), 0)),
    activeClients: new Set(orders.map((o) => o.partner_id?.[0]).filter(Boolean)).size,
    pendingOrders: orders.filter((o) => o.state === 'draft' || o.state === 'sent').length,
  });
}));

router.get('/', wrap(async (req, res) => {
  const rows = await searchRead('sale.order', ownDomain(req.user.uid), ORDER_FIELDS, { order: 'date_order desc', limit: 200 });
  res.json({ orders: rows.map(mapOrder) });
}));

router.get('/:id', wrap(async (req, res) => {
  const [o] = await call('sale.order', 'read', [[Number(req.params.id)], ORDER_FIELDS]);
  if (!o) return res.status(404).json({ error: 'Commande introuvable.' });
  res.json({ order: mapOrder(o) });
}));

/** Création de la commande dans Odoo. Les prix sont recalculés côté serveur. */
router.post('/', wrap(async (req, res) => {
  const partnerId = Number(req.body?.clientId);
  const lines = (Array.isArray(req.body?.lines) ? req.body.lines : [])
    .map((l) => ({ productId: Number(l.productId), qty: Math.max(0, Number(l.qty) || 0) }))
    .filter((l) => l.productId && l.qty > 0);
  if (!partnerId) return res.status(400).json({ error: 'Client manquant.' });
  if (!lines.length) return res.status(400).json({ error: 'Le panier est vide.' });

  const [products, ctx, taxId, lineFields, orderFields] = await Promise.all([
    loadProducts({ ids: lines.map((l) => l.productId) }),
    pricingContext(partnerId),
    vatTaxId(),
    modelFields('sale.order.line'),
    modelFields('sale.order'),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const taxField = lineFields.has('tax_id') ? 'tax_id' : lineFields.has('tax_ids') ? 'tax_ids' : null;

  const orderLines = [];
  const detail = [];
  for (const l of lines) {
    const p = byId.get(l.productId);
    if (!p) return res.status(400).json({ error: `Produit ${l.productId} introuvable ou non vendable.` });
    const price = await unitPrice(p, l.qty, ctx);
    const vals = { product_id: p.id, product_uom_qty: l.qty, price_unit: price };
    if (taxId && taxField) vals[taxField] = [[6, 0, [taxId]]];
    orderLines.push([0, 0, vals]);
    detail.push({ productId: p.id, name: p.name, qty: l.qty, unitPrice: price, subtotal: round2(price * l.qty) });
  }

  const vals = { partner_id: partnerId, user_id: req.user.uid, order_line: orderLines };
  if (ctx.pricelist && orderFields.has('pricelist_id')) vals.pricelist_id = ctx.pricelist.id;

  const orderId = await call('sale.order', 'create', [vals]);
  if (config.odoo.confirmOrder) await call('sale.order', 'action_confirm', [[orderId]]);

  const [o] = await call('sale.order', 'read', [[orderId], ORDER_FIELDS]);
  const totalHT = round2(detail.reduce((s, d) => s + d.subtotal, 0));
  const vat = round2(totalHT * config.vatRate);
  res.status(201).json({
    order: mapOrder(o),
    lines: detail,
    totals: { totalHT, vat, totalTTC: round2(totalHT + vat), vatRate: config.vatRate },
  });
}));

export default router;
