import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { formatDH } from '../lib/format';
import { Button, ProductThumb } from './ui';
import StockBadge from './StockBadge';

export default function ProductTable({ products, clientId, inCart, onAdd }) {
  return (
    <div className="table-wrap">
      <table className="table table--products">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Référence</th>
            <th>Catégorie</th>
            <th className="num">Prix client</th>
            <th className="num">Stock</th>
            <th className="num"><span className="sr-only">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const qty = inCart(p.id);
            return (
              <tr key={p.id}>
                <td>
                  <Link to={`/clients/${clientId}/produits/${p.id}`} className="product-cell">
                    <ProductThumb product={p} size={40} />
                    <span>{p.name}</span>
                  </Link>
                </td>
                <td className="muted mono-num">{p.reference || '—'}</td>
                <td className="muted">{p.category || '—'}</td>
                <td className="num strong">
                  {formatDH(p.price)}
                  {p.price < p.listPrice && <s className="list-price">{formatDH(p.listPrice)}</s>}
                </td>
                <td className="num"><StockBadge stock={p.stock} /></td>
                <td className="num">
                  <Button size="sm" variant={qty ? 'soft' : 'primary'} icon={Plus} onClick={() => onAdd(p)} title={qty ? `${qty} déjà au panier` : undefined}>
                    Ajouter{qty > 0 && <span className="btn__count">{qty}</span>}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
