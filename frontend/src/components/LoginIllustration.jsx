/** Illustration vectorielle : rayonnages d'un entrepôt de distribution. */
export default function LoginIllustration() {
  const box = (x, y, w, h, c) => <rect x={x} y={y} width={w} height={h} rx="3" fill={c} />;
  const shelf = (y) => (
    <g>
      <rect x="20" y={y} width="360" height="6" rx="2" fill="#1E3A63" />
      {box(34, y - 44, 52, 44, '#2563EB')}{box(92, y - 30, 38, 30, '#1E4E9E')}
      {box(140, y - 52, 46, 52, '#FF7A00')}{box(194, y - 36, 60, 36, '#2B4A78')}
      {box(262, y - 46, 40, 46, '#2563EB')}{box(310, y - 28, 56, 28, '#FF9A3D')}
    </g>
  );
  return (
    <svg className="login__art" viewBox="0 0 400 250" role="img" aria-label="Rayonnages de produits">
      <rect x="10" y="8" width="380" height="234" rx="14" fill="#10284A" />
      <rect x="20" y="18" width="6" height="214" fill="#1E3A63" /><rect x="374" y="18" width="6" height="214" fill="#1E3A63" />
      {shelf(88)}{shelf(158)}{shelf(228)}
    </svg>
  );
}
