import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../components/ui';

export default function NotFound() {
  return <section className="panel"><EmptyState icon={Compass} title="Page introuvable" text="Cette adresse ne correspond à aucune page." action={<Button as={Link} to="/">Retour à l’accueil</Button>} /></section>;
}
