/**
 * Faux serveur Odoo (JSON-RPC) — UNIQUEMENT pour tester l'application sans accès à un vrai Odoo.
 * Lancement : npm run mock:odoo  (port 8069)
 * Puis dans backend/.env : ODOO_URL=http://localhost:8069, ODOO_DB=demo, ODOO_USERNAME=api, ODOO_PASSWORD=api
 * Connexion dans l'app : salma@demo.ma / demo
 * Ne jamais utiliser en production : les données sont en mémoire et perdues à l'arrêt.
 */
import http from 'node:http';

const users = [
  { id: 1, login: 'api', password: 'api', name: 'API', email: '' },
  { id: 2, login: 'salma@demo.ma', password: 'demo', name: 'Salma Ayouch', email: 'salma@demo.ma' },
];
const m2o = (rows, id) => { const r = rows.find((x) => x.id === id); return r ? [r.id, r.name] : false; };

const pricelists = [{ id: 1, name: 'Tarif public' }, { id: 2, name: 'Tarif CHR' }];
const categories = [
  { id: 1, name: 'Tous', parent_path: '1/' },
  { id: 2, name: 'Tous / Café & Thé', parent_path: '1/2/' },
  { id: 3, name: 'Tous / Épicerie', parent_path: '1/3/' },
  { id: 4, name: 'Tous / Biscuiterie', parent_path: '1/4/' },
];
const db = {
  'res.users': users,
  'res.partner': [
    ['2 VIEWS COFFEE', 'Kenitra', 2], ['A.E.I PRESTIGIA', 'Rabat', 1], ['A2 SNACK & MORE', 'Rabat', 2],
    ['AB GROUP', 'Marrakech', 1], ['ABDERAHMAN EL KHADRI', 'Meknès', 1], ['ABLAZ', 'Marrakech', 2],
    ['ADAMS', 'Casablanca', 1], ['ADAMS BAKERY', 'Rabat', 2],
  ].map(([name, city, pl], i) => ({
    id: 10 + i, name, city, street: '', email: '', phone: '', mobile: '', active: true, customer_rank: 1,
    is_company: true, user_id: 2, property_product_pricelist: m2o(pricelists, pl),
  })),
  'product.category': categories,
  'product.product': [
    ['Café Arabica 1kg', 'CA-001', 140, 90, 2, 84], ['Thé Vert 500g', 'TV-002', 85, 50, 2, 56],
    ['Sucre 1kg', 'SU-003', 18, 12, 3, 120], ['Lait en poudre 400g', 'LP-004', 45, 30, 3, 78],
    ['Chocolat en poudre 1kg', 'CH-005', 65, 40, 3, 34], ['Biscuits Premium', 'BI-006', 22, 14, 4, 90],
  ].map(([name, code, lst, cost, cat, qty], i) => ({
    id: 100 + i, name, default_code: code, lst_price: lst, standard_price: cost, categ_id: m2o(categories, cat),
    product_tmpl_id: [200 + i, name], uom_id: [1, 'Unité(s)'], description_sale: '', image_128: false,
    qty_available: qty, sale_ok: true, active: true,
  })),
  'product.pricelist': pricelists,
  'product.pricelist.item': [
    { id: 1, pricelist_id: [2, 'Tarif CHR'], applied_on: '0_product_variant', product_id: [100, 'Café Arabica 1kg'], product_tmpl_id: false, categ_id: false, min_quantity: 0, compute_price: 'fixed', fixed_price: 130, base: 'list_price' },
    { id: 2, pricelist_id: [2, 'Tarif CHR'], applied_on: '0_product_variant', product_id: [100, 'Café Arabica 1kg'], product_tmpl_id: false, categ_id: false, min_quantity: 10, compute_price: 'fixed', fixed_price: 122, base: 'list_price' },
    { id: 3, pricelist_id: [2, 'Tarif CHR'], applied_on: '2_product_category', product_id: false, product_tmpl_id: false, categ_id: [3, 'Tous / Épicerie'], min_quantity: 0, compute_price: 'percentage', percent_price: 5, base: 'list_price' },
  ],
  'account.tax': [{ id: 1, name: 'TVA 20%', type_tax_use: 'sale', amount_type: 'percent', amount: 20 }],
  'sale.order': [],
  'sale.order.line': [],
};
const fieldsOf = {
  'res.partner': ['name', 'city', 'street', 'email', 'phone', 'mobile', 'customer_rank', 'is_company', 'user_id', 'property_product_pricelist', 'active'],
  'product.product': ['name', 'default_code', 'lst_price', 'standard_price', 'categ_id', 'product_tmpl_id', 'uom_id', 'description_sale', 'image_128', 'qty_available', 'sale_ok', 'active'],
  'product.pricelist.item': ['applied_on', 'product_id', 'product_tmpl_id', 'categ_id', 'min_quantity', 'compute_price', 'fixed_price', 'percent_price', 'price_discount', 'price_surcharge', 'price_round', 'price_min_margin', 'price_max_margin', 'base', 'base_pricelist_id', 'date_start', 'date_end'],
  'sale.order': ['name', 'partner_id', 'user_id', 'date_order', 'amount_untaxed', 'amount_tax', 'amount_total', 'state', 'pricelist_id', 'order_line'],
  'sale.order.line': ['product_id', 'product_uom_qty', 'price_unit', 'tax_id'],
};

const val = (v) => (Array.isArray(v) ? v[0] : v);
function match(rec, domain) {
  return domain.every((c) => {
    if (!Array.isArray(c)) return true;
    const [f, op, v] = c; const r = val(rec[f]);
    switch (op) {
      case '=': return r === v || (v === false && !r);
      case '!=': return r !== v;
      case '>': return r > v;
      case 'in': return v.includes(r);
      default: return true;
    }
  });
}
const pick = (r, fields) => (fields?.length ? Object.fromEntries(['id', ...fields].map((f) => [f, r[f] ?? false])) : r);

function execute(model, method, args, kw) {
  const rows = db[model] || [];
  switch (method) {
    case 'fields_get': return Object.fromEntries((fieldsOf[model] || []).map((f) => [f, { type: 'char' }]));
    case 'search_read': {
      let out = rows.filter((r) => match(r, args[0] || []));
      if (kw.order?.startsWith('name')) out = [...out].sort((a, b) => a.name.localeCompare(b.name));
      if (kw.order?.startsWith('date_order')) out = [...out].sort((a, b) => b.id - a.id);
      return out.slice(0, kw.limit || 1e9).map((r) => pick(r, kw.fields));
    }
    case 'read': return rows.filter((r) => args[0].includes(r.id)).map((r) => pick(r, args[1] || kw.fields));
    case 'create': {
      const v = args[0]; const id = rows.length + 1;
      let untaxed = 0; let tax = 0;
      for (const [, , l] of v.order_line) {
        const sub = l.price_unit * l.product_uom_qty; untaxed += sub; if (l.tax_id) tax += sub * 0.2;
      }
      rows.push({
        id, name: `S${String(id).padStart(5, '0')}`, partner_id: m2o(db['res.partner'], v.partner_id), user_id: m2o(users, v.user_id),
        date_order: new Date().toISOString().replace('T', ' ').slice(0, 19), state: 'draft',
        amount_untaxed: +untaxed.toFixed(2), amount_tax: +tax.toFixed(2), amount_total: +(untaxed + tax).toFixed(2),
      });
      return id;
    }
    case 'action_confirm': args[0].forEach((id) => { const o = rows.find((r) => r.id === id); if (o) o.state = 'sale'; }); return true;
    default: throw new Error(`Méthode non simulée : ${model}.${method}`);
  }
}

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    const send = (payload) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload)); };
    try {
      const { id, params } = JSON.parse(body || '{}');
      const { service, method, args } = params;
      if (service === 'common' && method === 'authenticate') {
        const u = users.find((x) => x.login === args[1] && x.password === args[2]);
        return send({ jsonrpc: '2.0', id, result: u ? u.id : false });
      }
      if (service === 'object' && method === 'execute_kw') {
        const [, , , model, m, a = [], kw = {}] = args;
        return send({ jsonrpc: '2.0', id, result: execute(model, m, a, kw) });
      }
      throw new Error('Service non simulé');
    } catch (e) {
      send({ jsonrpc: '2.0', error: { message: 'Odoo Server Error', data: { message: e.message } } });
    }
  });
}).listen(8069, () => console.log('Faux Odoo (test) sur http://localhost:8069 — login app : salma@demo.ma / demo'));
