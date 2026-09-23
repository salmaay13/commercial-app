import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { formatDH } from '../lib/format';
import { useCart } from '../context/CartContext';
import { usePricedLines } from '../lib/usePricedLines';
import { Button, QuantityStepper, ProductThumb, EmptyState } from './ui';
import OrderSummary from './OrderSummary';

export default function Cart({ client, onNavigate }) {
  const cart = useCart();
  const navigate = useNavigate();
  const items = cart.getItems(client.id);
  const { lines, totals, pricing } = usePricedLines(client.id, items);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <section className="cart" aria-label="Panier">
      <div className="cart__head">
        <h2>Panier</h2>
        {count > 0 && <span className="badge badge--orange">{count} article{count > 1 ? 's' : ''}</span>}
      </div>

      {lines.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Panier vide" text="Ajoutez des produits depuis la liste pour préparer la commande." />
      ) : (
        <>
          <ul className="cart__lines">
            {lines.map((l) => (
              <li key={l.product.id} className="cart-line">
                <ProductThumb product={l.product} size={40} />
                <div className="cart-line__body">
                  <div className="cart-line__top">
                    <strong>{l.product.name}</strong>
                    <button className="icon-btn icon-btn--sm" onClick={() => cart.remove(client, l.product.id)} aria-label={`Retirer ${l.product.name}`} title="Retirer"><Trash2 size={15} /></button>
                  </div>
                  <span className="muted">{formatDH(l.unitPrice)} / unité</span>
                  <div className="cart-line__bottom">
                    <QuantityStepper size="sm" value={l.qty} onChange={(q) => cart.setQty(client, l.product.id, q)} />
                    <span className="strong">{formatDH(l.subtotal)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <OrderSummary totals={totals} compact pricing={pricing} />
          <Button
            className="btn--block" iconRight={ArrowRight}
            onClick={() => { onNavigate?.(); navigate(`/clients/${client.id}/confirmation`); }}
          >
            Passer à la confirmation
          </Button>
        </>
      )}
    </section>
  );
}
