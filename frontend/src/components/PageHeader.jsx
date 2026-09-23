export default function PageHeader({ title, subtitle, back, actions }) {
  return (
    <div className="page-header">
      <div>
        {back}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}
