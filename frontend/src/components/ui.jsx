import { forwardRef, useEffect } from 'react';
import { Loader2, X, AlertCircle, Minus, Plus, PackageOpen } from 'lucide-react';
import { initials } from '../lib/format';

export function Button({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading, children, className = '', as: Tag = 'button', ...props }) {
  return (
    <Tag className={`btn btn--${variant} btn--${size} ${className}`} disabled={Tag === 'button' ? (loading || props.disabled) : undefined} {...props}>
      {loading ? <Loader2 size={16} className="spin" /> : Icon && <Icon size={16} />}
      {children && <span>{children}</span>}
      {IconRight && !loading && <IconRight size={16} />}
    </Tag>
  );
}

export const Input = forwardRef(function Input({ icon: Icon, label, id, right, className = '', ...props }, ref) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={id} className="field__label">{label}</label>}
      <div className="field__control">
        {Icon && <Icon size={18} className="field__icon" />}
        <input ref={ref} id={id} className={`input ${Icon ? 'input--icon' : ''}`} {...props} />
        {right}
      </div>
    </div>
  );
});

export function SearchInput({ value, onChange, placeholder, className = '', ...props }) {
  return (
    <div className={`search ${className}`}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="search__icon" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input type="search" className="input input--icon" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} {...props} />
    </div>
  );
}

export function Modal({ open, onClose, title, children, variant = 'center' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`modal modal--${variant}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

export function QuantityStepper({ value, onChange, min = 1, size = 'md' }) {
  return (
    <div className={`stepper stepper--${size}`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Diminuer"><Minus size={14} /></button>
      <input
        type="number" inputMode="numeric" min={min} value={value} aria-label="Quantité"
        onChange={(e) => { const n = parseInt(e.target.value, 10); if (!Number.isNaN(n)) onChange(Math.max(min, n)); }}
      />
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Augmenter"><Plus size={14} /></button>
    </div>
  );
}

export function Avatar({ name, size = 40, tone }) {
  const tones = ['blue', 'orange', 'navy', 'green'];
  const t = tone || tones[[...String(name)].reduce((s, c) => s + c.charCodeAt(0), 0) % tones.length];
  return <span className={`avatar avatar--${t}`} style={{ width: size, height: size, fontSize: size * 0.34 }}>{initials(name)}</span>;
}

export function ProductThumb({ product, size = 44 }) {
  return product.image
    ? <img className="thumb" src={product.image} alt="" width={size} height={size} />
    : <span className="thumb thumb--empty" style={{ width: size, height: size }}><PackageOpen size={size * 0.45} /></span>;
}

export function Spinner({ label = 'Chargement…' }) {
  return <div className="state state--loading"><Loader2 size={22} className="spin" /><span>{label}</span></div>;
}

export function Skeleton({ rows = 4, height = 64 }) {
  return <div className="skeletons">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height }} />)}</div>;
}

export function EmptyState({ icon: Icon = PackageOpen, title, text, action }) {
  return (
    <div className="state state--empty">
      <span className="state__icon"><Icon size={22} /></span>
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error">
      <span className="state__icon"><AlertCircle size={22} /></span>
      <strong>Chargement impossible</strong>
      <p>{message}</p>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Réessayer</Button>}
    </div>
  );
}

export function Logo({ light = false }) {
  return (
    <span className={`logo ${light ? 'logo--light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="logo__bg" />
        <path d="M16 6l9 5v10l-9 5-9-5V11z M7 11l9 5 9-5 M16 16v10" fill="none" stroke="#FF7A00" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      <span>CommercialApp</span>
    </span>
  );
}
