import { NavLink } from 'react-router-dom';
import { Home, Users, Package, ClipboardList, Settings, LogOut, X } from 'lucide-react';
import { Logo, Avatar } from './ui';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/clients', label: 'Mes clients', icon: Users },
  { to: '/produits', label: 'Produits', icon: Package },
  { to: '/commandes', label: 'Commandes', icon: ClipboardList },
  { to: '/parametres', label: 'Paramètres', icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar__top">
          <Logo light />
          <button className="icon-btn sidebar__close" onClick={onClose} aria-label="Fermer le menu"><X size={18} /></button>
        </div>
        <nav className="sidebar__nav" aria-label="Navigation principale">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <Avatar name={user?.name} size={38} tone="orange" />
          <div className="sidebar__user-info">
            <strong>{user?.name}</strong>
            <span>Commercial</span>
          </div>
          <button className="icon-btn icon-btn--dark" onClick={logout} title="Déconnexion" aria-label="Déconnexion"><LogOut size={17} /></button>
        </div>
      </aside>
    </>
  );
}
