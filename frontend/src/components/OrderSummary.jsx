import { formatDH } from '../lib/format';

export default function OrderSummary({ totals, compact = false, pricing = false }) {
  return (
    <div className={`summary ${compact ? 'summary--compact' : ''} ${pricing ? 'is-pricing' : ''}`}>
      <div className="summary__row"><span>Total HT</span><span>{formatDH(totals.totalHT)}</span></div>
      <div className="summary__row summary__row--muted"><span>TVA (20 %)</span><span>{formatDH(totals.vat)}</span></div>
      <div className="summary__row summary__row--total"><span>Total TTC</span><span>{formatDH(totals.totalTTC)}</span></div>
    </div>
  );
}
