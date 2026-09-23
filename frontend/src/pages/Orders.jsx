import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink, SearchX } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH, formatDate, normalize } from '../lib/format';
import { Button, SearchInput, Skeleton, ErrorState, EmptyState } from '../components/ui';
import PageHeader from '../components/PageHeader';

const TONES = { draft: 'amber', sent: 'amber', sale: 'green', done: 'navy', cancel: 'red' };

export default function Orders() {
  const orders = useAsync(() => api.orders().then((d) => d.orders), []);
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const n = normalize(q);
    return (orders.data || []).filter((o) => !n || normalize(`${o.number} ${o.client}`).includes(n));
  }, [orders.data, q]);

  return (
    <>
      <PageHeader title="Commandes" subtitle="Vos commandes enregistrées dans Odoo." />
      <section className="panel">
        <div className="panel__head">
          <SearchInput value={q} onChange={setQ} placeholder="Rechercher un numéro ou un client…" className="panel__search panel__search--wide" />
        </div>
        {orders.loading && <Skeleton rows={5} height={52} />}
        {orders.error && <ErrorState message={orders.error} onRetry={orders.reload} />}
        {orders.data && !orders.data.length && (
          <EmptyState icon={ClipboardList} title="Aucune commande pour le moment" text="Vos commandes apparaîtront ici après confirmation."
            action={<Button as={Link} to="/clients">Préparer une commande</Button>} />
        )}
        {orders.data?.length > 0 && (shown.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Numéro</th><th>Client</th><th>Date</th><th>Statut</th><th className="num">Total TTC</th><th className="num"><span className="sr-only">Odoo</span></th></tr></thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id}>
                    <td className="strong">{o.number}</td>
                    <td>{o.client}</td>
                    <td className="muted">{formatDate(o.date, false)}</td>
                    <td><span className={`badge badge--${TONES[o.state] || 'navy'}`}>{o.stateLabel}</span></td>
                    <td className="num strong">{formatDH(o.amountTotal)}</td>
                    <td className="num"><a className="icon-btn" href={o.odooUrl} target="_blank" rel="noreferrer" title="Ouvrir dans Odoo" aria-label={`Ouvrir ${o.number} dans Odoo`}><ExternalLink size={16} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={SearchX} title="Aucune commande trouvée" text={`Aucun résultat pour « ${q} ».`} />)}
      </section>
    </>
  );
}
