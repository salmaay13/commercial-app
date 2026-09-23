import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, ShieldCheck, MousePointerClick, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Logo } from '../components/ui';

const PERKS = [
  { icon: Zap, title: 'Rapide', text: 'Commande en quelques clics' },
  { icon: ShieldCheck, title: 'Sécurisé', text: 'Vos identifiants Odoo' },
  { icon: MousePointerClick, title: 'Simple', text: 'Une interface claire' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ login: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.login, form.password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <aside className="login__brand">
        <Logo light />
        <div className="login__pitch">
          <h1>Votre espace commercial</h1>
          <p>Commandez facilement, gérez vos clients et accédez à vos tarifs personnalisés.</p>
        </div>
        <ul className="login__perks">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title}><Icon size={20} /><strong>{title}</strong><span>{text}</span></li>
          ))}
        </ul>
      </aside>

      <section className="login__form-side">
        <form className="login__card" onSubmit={submit} noValidate>
          <div className="login__mobile-logo"><Logo /></div>
          <h2>Connexion</h2>
          <p className="muted">Connectez-vous avec vos identifiants</p>

          {error && <div className="alert alert--error" role="alert"><AlertCircle size={17} />{error}</div>}

          <Input
            id="login" label="Email / identifiant" icon={Mail} autoComplete="username" autoFocus
            value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="prenom.nom@entreprise.ma"
          />
          <Input
            id="password" label="Mot de passe" icon={Lock} type={show ? 'text' : 'password'} autoComplete="current-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Votre mot de passe"
            right={(
              <button type="button" className="field__toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          />

          <Button type="submit" size="lg" className="btn--block" loading={loading} iconRight={ArrowRight} disabled={!form.login || !form.password}>
            Se connecter
          </Button>
          <p className="login__foot">Accès réservé aux commerciaux autorisés</p>
        </form>
      </section>
    </div>
  );
}
