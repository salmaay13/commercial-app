/**
 * Calcul des prix client à partir des listes de prix Odoo (product.pricelist.item).
 * Reproduit la logique standard d'Odoo : prix fixe, remise en %, formule
 * (remise + arrondi + supplément + marges), avec quantité minimale et dates de validité.
 */
import { searchRead, modelFields, call } from '../odoo/client.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const idOf = (m2o) => (Array.isArray(m2o) ? m2o[0] : m2o || null);

/* ---------- Chargement des données Odoo ---------- */

export async function loadProducts({ ids = null } = {}) {
  const fields = await modelFields('product.product');
  const wanted = ['name', 'default_code', 'lst_price', 'standard_price', 'categ_id', 'product_tmpl_id', 'uom_id', 'description_sale', 'image_128'];
  if (fields.has('qty_available')) wanted.push('qty_available');
  const domain = [['sale_ok', '=', true], ['active', '=', true]];
  if (ids) domain.push(['id', 'in', ids]);
  const rows = await searchRead('product.product', domain, wanted.filter((f) => fields.has(f)), { order: 'name asc', limit: 2000 });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    reference: p.default_code || '',
    listPrice: p.lst_price || 0,
    cost: p.standard_price || 0,
    categoryId: idOf(p.categ_id),
    category: Array.isArray(p.categ_id) ? p.categ_id[1].split(' / ').pop() : '',
    templateId: idOf(p.product_tmpl_id),
    uom: Array.isArray(p.uom_id) ? p.uom_id[1] : '',
    description: p.description_sale || '',
    image: p.image_128 ? `data:image/png;base64,${p.image_128}` : null,
    stock: p.qty_available ?? null,
  }));
}

async function loadCategoryPaths() {
  const cats = await searchRead('product.category', [], ['parent_path']);
  return new Map(cats.map((c) => [c.id, c.parent_path || `${c.id}/`]));
}

export async function partnerPricelistId(partnerId) {
  const fields = await modelFields('res.partner');
  if (!fields.has('property_product_pricelist')) return null;
  const [p] = await call('res.partner', 'read', [[partnerId], ['property_product_pricelist']]);
  return idOf(p?.property_product_pricelist);
}

const ITEM_FIELDS = [
  'applied_on', 'product_id', 'product_tmpl_id', 'categ_id', 'min_quantity', 'compute_price',
  'fixed_price', 'percent_price', 'price_discount', 'price_surcharge', 'price_round',
  'price_min_margin', 'price_max_margin', 'base', 'base_pricelist_id', 'date_start', 'date_end',
];

async function loadPricelist(pricelistId, cache) {
  if (!pricelistId) return null;
  if (cache.has(pricelistId)) return cache.get(pricelistId);
  const fields = await modelFields('product.pricelist.item');
  const [pl] = await call('product.pricelist', 'read', [[pricelistId], ['name']]);
  const items = await searchRead('product.pricelist.item', [['pricelist_id', '=', pricelistId]],
    ITEM_FIELDS.filter((f) => fields.has(f)));
  // Ordre de priorité Odoo : variante > modèle > catégorie > global, puis quantité min décroissante
  items.sort((a, b) =>
    String(a.applied_on).localeCompare(String(b.applied_on)) ||
    (b.min_quantity || 0) - (a.min_quantity || 0) ||
    (idOf(b.categ_id) || 0) - (idOf(a.categ_id) || 0) ||
    b.id - a.id);
  const value = { id: pricelistId, name: pl?.name || 'Liste de prix', items };
  cache.set(pricelistId, value);
  return value;
}

/* ---------- Moteur de calcul ---------- */

function itemMatches(item, product, qty, catPaths, today) {
  if ((item.min_quantity || 0) > qty) return false;
  if (item.date_start && String(item.date_start).slice(0, 10) > today) return false;
  if (item.date_end && String(item.date_end).slice(0, 10) < today) return false;
  switch (item.applied_on) {
    case '0_product_variant': return idOf(item.product_id) === product.id;
    case '1_product': return idOf(item.product_tmpl_id) === product.templateId;
    case '2_product_category': {
      const path = catPaths.get(product.categoryId) || '';
      return `/${path}`.includes(`/${idOf(item.categ_id)}/`);
    }
    default: return true;
  }
}

function roundTo(value, step) {
  return step ? Math.round(value / step) * step : value;
}

async function priceFor(product, qty, pricelist, ctx, depth = 0) {
  if (!pricelist || depth > 4) return { price: product.listPrice, rule: null };
  const item = pricelist.items.find((it) => itemMatches(it, product, qty, ctx.catPaths, ctx.today));
  if (!item) return { price: product.listPrice, rule: null };

  const basePrice = async () => {
    if (item.base === 'standard_price') return product.cost;
    if (item.base === 'pricelist' && item.base_pricelist_id) {
      const parent = await loadPricelist(idOf(item.base_pricelist_id), ctx.cache);
      return (await priceFor(product, qty, parent, ctx, depth + 1)).price;
    }
    return product.listPrice;
  };

  let price;
  if (item.compute_price === 'fixed') {
    price = item.fixed_price || 0;
  } else if (item.compute_price === 'percentage') {
    const base = await basePrice();
    price = base - (base * (item.percent_price || 0)) / 100;
  } else {
    const base = await basePrice();
    price = base - (base * (item.price_discount || 0)) / 100;
    if (item.price_round) price = roundTo(price, item.price_round);
    if (item.price_surcharge) price += item.price_surcharge;
    if (item.price_min_margin) price = Math.max(price, base + item.price_min_margin);
    if (item.price_max_margin) price = Math.min(price, base + item.price_max_margin);
  }
  return { price: round2(price), rule: item };
}

/** Contexte de calcul pour un client (liste de prix, catégories). */
export async function pricingContext(partnerId) {
  const cache = new Map();
  const [pricelistId, catPaths] = await Promise.all([partnerPricelistId(partnerId), loadCategoryPaths()]);
  const pricelist = await loadPricelist(pricelistId, cache);
  return { pricelist, catPaths, cache, today: new Date().toISOString().slice(0, 10) };
}

export async function unitPrice(product, qty, ctx) {
  return (await priceFor(product, qty, ctx.pricelist, ctx)).price;
}

/* ---------- Description lisible des règles ---------- */

const fmt = (n) => `${Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`;
const baseLabel = (item) =>
  item.base === 'standard_price' ? 'coût' : item.base === 'pricelist' ? `liste « ${item.base_pricelist_id?.[1] || 'parente'} »` : 'prix public';

function describeItem(item) {
  const parts = [];
  if (item.compute_price === 'fixed') parts.push(`Prix fixe : ${fmt(item.fixed_price)}`);
  else if (item.compute_price === 'percentage') parts.push(`Remise de ${item.percent_price} % sur le ${baseLabel(item)}`);
  else {
    let f = `Formule : ${baseLabel(item)}`;
    if (item.price_discount) f += ` − ${item.price_discount} %`;
    if (item.price_surcharge) f += ` ${item.price_surcharge > 0 ? '+' : '−'} ${fmt(Math.abs(item.price_surcharge))}`;
    if (item.price_round) f += `, arrondi à ${item.price_round}`;
    parts.push(f);
  }
  const scope = {
    '0_product_variant': 'ce produit',
    '1_product': 'ce produit',
    '2_product_category': `catégorie ${item.categ_id?.[1] || ''}`.trim(),
    '3_global': 'tous les produits',
  }[item.applied_on] || 'tous les produits';
  return {
    minQuantity: item.min_quantity || 0,
    scope,
    label: parts.join(' '),
    validity: item.date_start || item.date_end
      ? `${item.date_start ? `du ${String(item.date_start).slice(0, 10)}` : ''} ${item.date_end ? `au ${String(item.date_end).slice(0, 10)}` : ''}`.trim()
      : null,
  };
}

/** Règles de la liste de prix du client qui s'appliquent à ce produit (toutes quantités). */
export function rulesFor(product, ctx) {
  if (!ctx.pricelist) return { pricelist: null, rules: [] };
  const rules = ctx.pricelist.items
    .filter((it) => itemMatches({ ...it, min_quantity: 0, date_start: false, date_end: false }, product, 1, ctx.catPaths, ctx.today))
    .map(describeItem)
    .sort((a, b) => a.minQuantity - b.minQuantity);
  return { pricelist: ctx.pricelist.name, rules };
}
