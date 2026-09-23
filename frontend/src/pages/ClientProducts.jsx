import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, SearchX, ShoppingCart, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH, normalize } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { usePricedLines } from '../lib/usePricedLines';
import { SearchInput, Skeleton, ErrorState, EmptyState, Avatar, Modal } from '../components/ui';
import ProductTable from '../components/ProductTable';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';

export default function ClientProducts() {
  const { clientId } = useParams();
  const id = Number(clientId);
  const cart = useCart();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [cartOpen, setCartOpen] = useState(false);

  const data = useAsync(() => Promise.all([api.client(id), api.products(id)])
    .then(([c, p]) => ({ client: c.client, products: p.products, pricelist: p.pricelist })), [id]);

  useEffect(() => { cart.setLastClientId(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(
    () => [...new Set((data.data?.products || []).map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [data.data],
  );
  const shown = useMemo(() => {
    const n = normalize(q);
    return (data.data?.products || []).filter((p) =>
      (!category || p.category === category) && (!n || normalize(`${p.name} ${p.reference}`).includes(n)));
  }, [data.data, q, category]);

  const client = data.data?.client;
  const items = client ? cart.getItems(id) : [];
  const { totals } = usePricedLines(id, items);
  const qtyOf = (pid) => items.find((i) => i.product.id === pid)?.qty || 0;
  const add = (p) => { cart.add(client, p, 1); toast(`${p.name} ajouté au panier`); };
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      <Link to="/clients" className="back-link"><ArrowLeft size={16} /> Mes clients</Link>
      {data.loading && <Skeleton rows={6} height={60} />}
      {data.error && <ErrorState message={data.error} onRetry={data.reload} />}
      {client && (
        <div className="with-cart">
          <div className="with-cart__main">
            <div className="client-hero">
              <Avatar name={client.name} size={52} />
              <div>
                <h1>{client.name}</h1>
                <p><MapPin size={14} /> {client.city || 'Ville non renseignée'}
                  {data.data.pricelist && <><span className="sep" /><Tag size={14} /> {data.data.pricelist}</>}
                </p>
              </div>
            </div>

            <section className="panel">
              <div className="panel__head">
                <h2>Produits disponibles</h2>
                <div className="filters">
                  <SearchInput value={q} onChange={setQ} placeholder="Rechercher un produit…" className="panel__search" />
                  <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Catégorie">
                    <option value="">Toutes les catégories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {shown.length ? (
                <>
                  <div className="only-desktop"><ProductTable products={shown} clientId={id} inCart={qtyOf} onAdd={add} /></div>
                  <div className="only-mobile product-list">
                    {shown.map((p) => <ProductCard key={p.id} product={p} clientId={id} qty={qtyOf(p.id)} onAdd={add} />)}
                  </div>
                </>
              ) : (
                <EmptyState icon={SearchX} title="Aucun produit trouvé" text="Modifiez la recherche ou choisissez une autre catégorie." />
              )}
            </section>
          </div>

          <aside className="with-cart__side"><Cart client={client} /></aside>

          {count > 0 && (
            <button className="cart-bar" onClick={() => setCartOpen(true)}>
              <span><ShoppingCart size={18} /> {count} article{count > 1 ? 's' : ''}</span>
              <strong>{formatDH(totals.totalTTC)} TTC</strong>
            </button>
          )}
          <Modal open={cartOpen} onClose={() => setCartOpen(false)} title="Panier" variant="sheet">
            <Cart client={client} onNavigate={() => setCartOpen(false)} />
          </Modal>
        </div>
      )}
    </>
  );
}
