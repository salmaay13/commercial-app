import { Link, useLocation, useParams } from 'react-router-dom';
import { Check, ExternalLink, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { formatDH, formatDate } from '../lib/format';
import { Button, Skeleton, ErrorState } from '../components/ui';

export default function OrderSuccess() {
  const { orderId } = useParams();
  const { state } = useLocation();
  // Données renvoyées à la création ; sinon (rechargement de page) relues depuis Odoo
  const data = useAsync(() => (state?.order ? Promise.resolve(state) : api.order(orderId)), [orderId]);

  if (data.loading) return <Skeleton rows={2} height={160} />;
  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  const { order, totals } = data.data;
  const ttc = totals?.totalTTC ?? order.amountTotal;

  return (
    <div className="success">
      <div className="success__card">
        <span className="success__check"><Check size={34} strokeWidth={3} /></span>
        <h1>Commande confirmée !</h1>
        <p className="muted">Votre commande a été envoyée à Odoo.</p>
        <dl className="success__facts">
          <div><dt>Client</dt><dd>{order.client}</dd></div>
          <div><dt>Numéro de commande</dt><dd>{order.number}</dd></div>
          <div><dt>Date</dt><dd>{formatDate(order.date)}</dd></div>
          <div><dt>Statut Odoo</dt><dd>{order.stateLabel}</dd></div>
          <div className="success__total"><dt>Total TTC</dt><dd>{formatDH(ttc)}</dd></div>
        </dl>
        <div className="success__actions">
          <Button as="a" variant="secondary" href={order.odooUrl} target="_blank" rel="noreferrer" iconRight={ExternalLink}>Voir dans Odoo</Button>
          <Button as={Link} to="/clients" icon={Plus}>Nouvelle commande</Button>
        </div>
      </div>
    </div>
  );
}
