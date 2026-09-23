import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pencil, MapPin, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH } from '../lib/format';
import { useCart } from '../context/CartContext';
import { usePricedLines } from '../lib/usePricedLines';
import { Button, Skeleton, ErrorState, Avatar, ProductThumb } from '../components/ui';
import OrderSummary from '../components/OrderSummary';
import PageHeader from '../components/PageHeader';

export default function Confirmation() {
  const { clientId } = useParams();
  const id = Number(clientId);
  const cart = useCart();
  const navigate = useNavigate();
  const items = cart.getItems(id);
  const { lines, totals, pricing } = usePricedLines(id, items);
  const client = useAsync(() => api.client(id).then((d) => d.client), [id]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!items.length && !sending) return <Navigate to={`/clients/${id}`} replace />;

  const confirm = async () => {
    setError('');
    setSending(true);
    try {
      const res = await api.createOrder(id, items.map((i) => ({ productId: i.product.id, qty: i.qty })));
      cart.clear(id);
      navigate(`/commandes/${res.order.id}/confirmee`, { replace: true, state: res });
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  };

  return (
    <>
      <Link to={`/clients/${id}`} className="back-link"><ArrowLeft size={16} /> Retour aux produits</Link>
      <PageHeader title="Confirmation de commande" subtitle="Vérifiez votre commande avant de la confirmer." />
      <div className="confirm">
        <section className="panel confirm__lines">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Produit</th><th className="num">Qté</th><th className="num">Prix unitaire</th><th className="num">Sous-total</th></tr></thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.product.id}>
                    <td><span className="product-cell"><ProductThumb product={l.product} size={36} /><span>{l.product.name}<small className="muted">{l.product.reference}</small></span></span></td>
                    <td className="num">{l.qty}</td>
                    <td className="num">{formatDH(l.unitPrice)}</td>
                    <td className="num strong">{formatDH(l.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel confirm__side">
          {client.loading ? <Skeleton rows={1} height={56} /> : client.error ? <ErrorState message={client.error} /> : (
            <div className="confirm__client">
              <Avatar name={client.data.name} size={46} />
              <div>
                <span className="muted small">Client</span>
                <strong>{client.data.name}</strong>
                <span className="muted small"><MapPin size={12} /> {client.data.city || '—'}</span>
              </div>
            </div>
          )}
          <OrderSummary totals={totals} pricing={pricing} />
          {error && <div className="alert alert--error" role="alert"><AlertCircle size={17} />{error}</div>}
          <div className="confirm__actions">
            <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/clients/${id}`)} disabled={sending}>Modifier la commande</Button>
            <Button icon={Check} onClick={confirm} loading={sending} disabled={pricing}>Confirmer la commande</Button>
          </div>
        </aside>
      </div>
    </>
  );
}
