export default function StockBadge({ stock }) {
  if (stock === null || stock === undefined) return <span className="muted">—</span>;
  const n = Number(stock);
  const tone = n <= 0 ? 'red' : n < 20 ? 'amber' : 'green';
  return <span className={`stock stock--${tone}`}>{n <= 0 ? 'Rupture' : Number.isInteger(n) ? n : n.toFixed(2)}</span>;
}
