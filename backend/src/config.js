import 'dotenv/config';

const bool = (v, def = false) => (v === undefined || v === '' ? def : String(v).toLowerCase() === 'true');

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Variable manquante : ${name} (voir backend/.env.example)`);
    process.exit(1);
  }
  return v;
}

const odooUrl = required('ODOO_URL').replace(/\/+$/, '');

export const config = {
  port: Number(process.env.PORT) || 4001,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  odoo: {
    url: odooUrl,
    publicUrl: (process.env.ODOO_PUBLIC_URL || odooUrl).replace(/\/+$/, ''),
    db: required('ODOO_DB'),
    username: required('ODOO_USERNAME'),
    password: required('ODOO_PASSWORD'),
    confirmOrder: bool(process.env.ODOO_CONFIRM_ORDER, true),
    taxId: process.env.ODOO_TAX_ID ? Number(process.env.ODOO_TAX_ID) : null,
  },
  clientsOnlyMine: bool(process.env.CLIENTS_ONLY_MINE, false),
  ordersOnlyMine: bool(process.env.ORDERS_ONLY_MINE, true),
  vatRate: 0.2, // TVA fixée à 20 %
};
