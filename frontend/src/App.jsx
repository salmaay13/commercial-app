import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientProducts from './pages/ClientProducts';
import ProductDetail from './pages/ProductDetail';
import Confirmation from './pages/Confirmation';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import ProductsEntry from './pages/ProductsEntry';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="boot"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:clientId" element={<ClientProducts />} />
        <Route path="clients/:clientId/produits/:productId" element={<ProductDetail />} />
        <Route path="clients/:clientId/confirmation" element={<Confirmation />} />
        <Route path="produits" element={<ProductsEntry />} />
        <Route path="commandes" element={<Orders />} />
        <Route path="commandes/:orderId/confirmee" element={<OrderSuccess />} />
        <Route path="parametres" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
