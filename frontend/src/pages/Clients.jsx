import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { normalize } from '../lib/format';
import { useCart } from '../context/CartContext';
import { SearchInput, Skeleton, ErrorState, EmptyState } from '../components/ui';
import ClientCard from '../components/ClientCard';
import PageHeader from '../components/PageHeader';

export default function Clients() {
  const cart = useCart();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const clients = useAsync(() => api.clients().then((d) => d.clients), []);

  const shown = useMemo(() => {
    const n = normalize(q);
    const list = clients.data || [];
    return n ? list.filter((c) => normalize(`${c.name} ${c.city}`).includes(n)) : list;
  }, [clients.data, q]);

  return (
    <>
      <PageHeader
        title="Mes clients"
        subtitle={clients.data ? `${clients.data.length} client${clients.data.length > 1 ? 's' : ''}` : 'Choisissez un client pour préparer sa commande.'}
      />
      <section className="panel">
        <div className="panel__head">
          <SearchInput value={q} onChange={(v) => setParams(v ? { q: v } : {}, { replace: true })} placeholder="Rechercher un client ou une ville…" className="panel__search panel__search--wide" />
        </div>
        {clients.loading && <Skeleton rows={8} height={104} />}
        {clients.error && <ErrorState message={clients.error} onRetry={clients.reload} />}
        {clients.data && (shown.length ? (
          <div className="client-grid">{shown.map((c) => <ClientCard key={c.id} client={c} cartCount={cart.count(c.id)} />)}</div>
        ) : (
          <EmptyState icon={SearchX} title="Aucun client trouvé" text={q ? `Aucun résultat pour « ${q} ».` : 'Aucun client disponible.'} />
        ))}
      </section>
    </>
  );
}
