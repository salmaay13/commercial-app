import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Wallet, Users, Clock, ArrowRight, SearchX } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH, normalize } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SearchInput, Skeleton, ErrorState, EmptyState } from '../components/ui';
import ClientCard from '../components/ClientCard';

function StatCard({ icon: Icon, label, value, tone, hint }) {
  return (
    <div className="stat">
      <span className={`stat__icon stat__icon--${tone}`}><Icon size={20} /></span>
      <div>
        <span className="stat__label">{label}</span>
        <strong className="stat__value">{value}</strong>
        {hint && <span className="stat__hint">{hint}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const cart = useCart();
  const stats = useAsync(() => api.stats(), []);
  const clients = useAsync(() => api.clients().then((d) => d.clients), []);
  const [q, setQ] = useState('');
  const firstName = (user?.name || '').split(' ')[0];

  const shown = useMemo(() => {
    const list = clients.data || [];
    const n = normalize(q);
    return (n ? list.filter((c) => normalize(`${c.name} ${c.city}`).includes(n)) : list).slice(0, 12);
  }, [clients.data, q]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Bonjour {firstName} !</h1>
          <p>Voici un aperçu de votre activité.</p>
        </div>
      </div>

      {stats.error ? null : (
        <div className="stats">
          {stats.loading ? Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 92 }} />) : (
            <>
              <StatCard icon={ClipboardList} tone="orange" label="Total commandes" value={stats.data.totalOrders} />
              <StatCard icon={Wallet} tone="blue" label="Chiffre d'affaires" value={formatDH(stats.data.revenue)} hint="Commandes confirmées, TTC" />
              <StatCard icon={Users} tone="green" label="Clients actifs" value={stats.data.activeClients} hint="Avec au moins une commande" />
              <StatCard icon={Clock} tone="amber" label="En attente" value={stats.data.pendingOrders} hint="Devis non confirmés" />
            </>
          )}
        </div>
      )}

      <section className="panel">
        <div className="panel__head">
          <h2>Vos clients</h2>
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher un client…" className="panel__search" />
          <Link to="/clients" className="link">Voir tous les clients <ArrowRight size={15} /></Link>
        </div>
        {clients.loading && <Skeleton rows={4} height={104} />}
        {clients.error && <ErrorState message={clients.error} onRetry={clients.reload} />}
        {clients.data && (shown.length ? (
          <div className="client-grid">
            {shown.map((c) => <ClientCard key={c.id} client={c} cartCount={cart.count(c.id)} />)}
          </div>
        ) : (
          <EmptyState icon={SearchX} title="Aucun client trouvé" text={q ? `Aucun résultat pour « ${q} ».` : 'Aucun client n’est encore rattaché à votre compte dans Odoo.'} />
        ))}
      </section>
    </>
  );
}
