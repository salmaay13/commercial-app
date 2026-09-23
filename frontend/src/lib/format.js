export const VAT_RATE = 0.2; // TVA fixée à 20 %

const money = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatDH = (n) => `${money.format(Number(n) || 0)} DH`;

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function computeTotals(lines) {
  const totalHT = round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
  const vat = round2(totalHT * VAT_RATE);
  return { totalHT, vat, totalTTC: round2(totalHT + vat) };
}

export function initials(name = '') {
  const safeName = String(name ?? '');

  const words = safeName
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return '?';

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Odoo renvoie les dates en UTC au format "YYYY-MM-DD HH:MM:SS". */
export function formatDate(value, withTime = true) {
  if (!value) return '—';
  const d = new Date(String(value).replace(' ', 'T') + (String(value).includes('Z') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('fr-FR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

export const normalize = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
