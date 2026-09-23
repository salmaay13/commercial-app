import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="app__main">
        <Header onMenu={() => setMenuOpen(true)} />
        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}
