import { config } from '../config.js';

let rpcId = 0;
let serviceUid = null;
const fieldsCache = new Map();

export class OdooError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

async function jsonRpc(service, method, args) {
  let res;
  try {
    res = await fetch(`${config.odoo.url}/jsonrpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: ++rpcId, params: { service, method, args } }),
    });
  } catch (e) {
    throw new OdooError(`Odoo injoignable (${config.odoo.url}) : ${e.message}`, 503);
  }
  if (!res.ok) throw new OdooError(`Odoo a répondu HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) {
    const msg = data.error.data?.message || data.error.message || 'Erreur Odoo';
    throw new OdooError(msg);
  }
  return data.result;
}

/** Vérifie des identifiants Odoo. Retourne l'uid ou false. */
export function authenticate(login, password) {
  return jsonRpc('common', 'authenticate', [config.odoo.db, login, password, {}]);
}

async function getServiceUid() {
  if (serviceUid) return serviceUid;
  const uid = await authenticate(config.odoo.username, config.odoo.password);
  if (!uid) throw new OdooError('Compte technique Odoo refusé : vérifier ODOO_USERNAME / ODOO_PASSWORD', 500);
  serviceUid = uid;
  return uid;
}

/** Appel execute_kw avec le compte technique. */
export async function call(model, method, args = [], kwargs = {}) {
  const uid = await getServiceUid();
  return jsonRpc('object', 'execute_kw', [config.odoo.db, uid, config.odoo.password, model, method, args, kwargs]);
}

export const searchRead = (model, domain = [], fields = [], opts = {}) =>
  call(model, 'search_read', [domain], { fields, ...opts });

/** Champs disponibles d'un modèle (en cache) — permet de s'adapter aux versions/modules Odoo installés. */
export async function modelFields(model) {
  if (!fieldsCache.has(model)) {
    const f = await call(model, 'fields_get', [], { attributes: ['type'] });
    fieldsCache.set(model, new Set(Object.keys(f)));
  }
  return fieldsCache.get(model);
}

export function orderUrl(id) {
  return `${config.odoo.publicUrl}/web#id=${id}&model=sale.order&view_type=form`;
}
