import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { computeTotals } from './format';

/**
 * Lignes du panier avec prix unitaires recalculés par le backend
 * (les listes de prix Odoo peuvent dépendre de la quantité).
 */
export function usePricedLines(clientId, items) {
  const [prices, setPrices] = useState({});
  const [pricing, setPricing] = useState(false);
  const signature = items.map((i) => `${i.product.id}:${i.qty}`).join(',');

  useEffect(() => {
    if (!clientId || !items.length) { setPrices({}); return undefined; }
    let cancelled = false;
    setPricing(true);
    const t = setTimeout(() => {
      api.quote(clientId, items.map((i) => ({ productId: i.product.id, qty: i.qty })))
        .then((d) => { if (!cancelled) setPrices(Object.fromEntries(d.lines.map((l) => [l.productId, l.unitPrice]))); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setPricing(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, signature]);

  return useMemo(() => {
    const lines = items.map((i) => {
      const unitPrice = prices[i.product.id] ?? i.product.price;
      return { ...i, unitPrice, subtotal: unitPrice * i.qty };
    });
    return { lines, totals: computeTotals(lines), pricing };
  }, [items, prices, pricing]);
}
