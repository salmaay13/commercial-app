import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatDH } from '../lib/format';
import { Button, ProductThumb } from './ui';
import StockBadge from './StockBadge';

export default function ProductCard({ product: p, clientId, qty, onAdd }) {
  return (
    <div className="product-card">
      <Link to={`/clients/${clientId}/produits/${p.id}`} className="product-card__head">
        <ProductThumb product={p} size={48} />
        <div>
          <strong>{p.name}</strong>
          <span className="muted">{[p.reference, p.category].filter(Boolean).join(' – ')}</span>
        </div>
      </Link>
      <dl className="product-card__meta">
        <div><dt>Prix client</dt><dd className="strong">{formatDH(p.price)}</dd></div>
        <div><dt>Stock</dt><dd><StockBadge stock={p.stock} /></dd></div>
      </dl>
      <Button size="sm" variant={qty ? 'soft' : 'primary'} icon={Plus} onClick={() => onAdd(p)} className="product-card__btn">
        Ajouter{qty > 0 && <span className="btn__count">{qty}</span>}
      </Button>
    </div>
  );
}
