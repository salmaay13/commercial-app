import { Link, Navigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button, EmptyState } from '../components/ui';
import PageHeader from '../components/PageHeader';

/** Les prix dépendent du client : on ouvre le catalogue du dernier client consulté, sinon on invite à en choisir un. */
export default function ProductsEntry() {
  const { lastClientId } = useCart();
  if (lastClientId) return <Navigate to={`/clients/${lastClientId}`} replace />;
  return (
    <>
      <PageHeader title="Produits" subtitle="Les prix affichés dépendent du client sélectionné." />
      <section className="panel">
        <EmptyState icon={Package} title="Choisissez d’abord un client" text="Sélectionnez un client pour voir ses produits et ses tarifs."
          action={<Button as={Link} to="/clients">Voir mes clients</Button>} />
      </section>
    </>
  );
}
