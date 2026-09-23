import { LogOut, ShoppingCart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Button } from '../components/ui';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const { user, logout } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const openCarts = Object.values(cart.carts);

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Votre compte et vos paniers en cours." />
      <div className="settings">
        <section className="panel">
          <h2 className="panel__title">Mon compte</h2>
          <div className="profile">
            <Avatar name={user.name} size={56} tone="orange" />
            <div><strong>{user.name}</strong><span className="muted">{user.login}</span><span className="badge badge--navy">Commercial</span></div>
          </div>
          <p className="muted small">Votre compte et votre mot de passe sont gérés dans Odoo.</p>
          <Button variant="secondary" icon={LogOut} onClick={logout}>Déconnexion</Button>
        </section>
        <section className="panel">
          <h2 className="panel__title">Paniers en cours</h2>
          {openCarts.length ? (
            <ul className="cart-list">
              {openCarts.map((c) => (
                <li key={c.client.id}>
                  <span><ShoppingCart size={16} /> {c.client.name}<small className="muted">{Object.keys(c.items).length} produit(s)</small></span>
                  <Button size="sm" variant="ghost" onClick={() => { cart.clear(c.client.id); toast('Panier vidé'); }}>Vider</Button>
                </li>
              ))}
            </ul>
          ) : <p className="muted">Aucun panier en cours.</p>}
        </section>
      </div>
    </>
  );
}
