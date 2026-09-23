import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Avatar } from './ui';

export default function ClientCard({ client, cartCount = 0 }) {
  return (
    <Link to={`/clients/${client.id}`} className="client-card">
      <div className="client-card__head">
        <Avatar name={client.name} size={42} />
        <div className="client-card__id">
          <strong title={client.name}>{client.name}</strong>
          <span><MapPin size={13} />{client.city || 'Ville non renseignée'}</span>
        </div>
      </div>
      <div className="client-card__foot">
        {cartCount > 0
          ? <span className="badge badge--orange">{cartCount} article{cartCount > 1 ? 's' : ''} au panier</span>
          : <span className="client-card__pl">{client.pricelist || 'Tarif standard'}</span>}
        <span className="client-card__cta">Voir les produits <ArrowRight size={15} /></span>
      </div>
    </Link>
  );
}
