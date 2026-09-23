import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { SearchInput, Avatar } from './ui';
import { useAuth } from '../context/AuthContext';

export default function Header({ onMenu }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e) => {
    e.preventDefault();
    navigate(`/clients${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
    setQ('');
  };
  return (
    <header className="topbar">
      <button className="icon-btn topbar__menu" onClick={onMenu} aria-label="Ouvrir le menu"><Menu size={20} /></button>
      <form onSubmit={submit} className="topbar__search">
        <SearchInput value={q} onChange={setQ} placeholder="Rechercher un client…" />
      </form>
      <div className="topbar__user">
        <div className="topbar__user-info">
          <strong>{user?.name}</strong>
          <span>{user?.login}</span>
        </div>
        <Avatar name={user?.name} size={36} tone="orange" />
      </div>
    </header>
  );
}
