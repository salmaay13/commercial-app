import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Calculator, Info, Tag, Boxes, Ruler } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Button, QuantityStepper, Skeleton, ErrorState, ProductThumb } from '../components/ui';
import StockBadge from '../components/StockBadge';

export default function ProductDetail() {
  const { clientId, productId } = useParams();
  const cid = Number(clientId);
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState(null);

  const data = useAsync(() => Promise.all([api.client(cid), api.product(cid, productId)])
    .then(([c, p]) => ({ client: c.client, ...p })), [cid, productId]);

  // Prix unitaire recalculé selon la quantité (paliers de la liste de prix)
  useEffect(() => {
    if (!data.data) return undefined;
    const t = setTimeout(() => {
      api.quote(cid, [{ productId: Number(productId), qty }])
        .then((d) => setUnit(d.lines[0]?.unitPrice ?? null)).catch(() => setUnit(null));
    }, 200);
    return () => clearTimeout(t);
  }, [qty, data.data, cid, productId]);

  if (data.loading) return <Skeleton rows={3} height={140} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;

  const { client, product: p, rules, pricelist } = data.data;
  const unitPrice = unit ?? p.price;
  const add = () => {
    cart.add(client, { ...p, price: p.price }, qty);
    toast(`${qty} × ${p.name} ajouté au panier`);
    navigate(`/clients/${cid}`);
  };

  return (
    <>
      <Link to={`/clients/${cid}`} className="back-link"><ArrowLeft size={16} /> {client.name}</Link>
      <div className="detail">
        <div className="detail__main">
          <section className="panel detail__hero">
            <ProductThumb product={p} size={132} />
            <div>
              <h1>{p.name}</h1>
              <p className="muted">Référence : {p.reference || '—'}</p>
              <div className="detail__price">
                {formatDH(p.price)}
                {p.price < p.listPrice && <s className="list-price">{formatDH(p.listPrice)}</s>}
              </div>
              <p className="detail__stock">En stock : <StockBadge stock={p.stock} /></p>
              {p.description && <p className="detail__desc">{p.description}</p>}
            </div>
          </section>
          <section className="panel">
            <h2 className="panel__title">Détails du produit</h2>
            <ul className="facts">
              <li><Tag size={16} /> Catégorie : <strong>{p.category || '—'}</strong></li>
              <li><Ruler size={16} /> Unité : <strong>{p.uom || '—'}</strong></li>
              <li><Boxes size={16} /> Stock : <strong>{p.stock ?? '—'}{p.stock != null && ' unités'}</strong></li>
            </ul>
          </section>
        </div>

        <aside className="panel detail__side">
          <h2 className="panel__title"><Calculator size={18} /> Règles de calcul</h2>
          <ul className="rules">
            <li><span>Prix public</span><strong>{formatDH(p.listPrice)}</strong></li>
            {rules.length ? rules.map((r, i) => (
              <li key={i}>
                <span>{r.minQuantity > 1 ? `À partir de ${r.minQuantity} unités` : pricelist}<small>{r.scope}{r.validity ? `, ${r.validity}` : ''}</small></span>
                <strong>{r.label}</strong>
              </li>
            )) : <li><span>Liste de prix</span><strong>{pricelist ? `${pricelist} : aucune règle spécifique` : 'Prix public appliqué'}</strong></li>}
            <li><span>TVA</span><strong>20 %, ajoutée à la confirmation</strong></li>
          </ul>

          <div className="qty-block">
            <label>Quantité</label>
            <QuantityStepper value={qty} onChange={setQty} />
          </div>
          <div className="calc">
            <div><span>Prix unitaire</span><span>{formatDH(unitPrice)}</span></div>
            <div className="calc__total"><span>Total HT</span><span>{formatDH(unitPrice * qty)}</span></div>
          </div>
          <p className="hint"><Info size={15} /> Le prix unitaire est recalculé selon la quantité et les règles de la liste de prix du client.</p>
          <Button className="btn--block" size="lg" icon={ShoppingCart} onClick={add}>Ajouter au panier</Button>
        </aside>
      </div>
    </>
  );
}
