import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

/**
 * Un panier par client, conservé dans le navigateur.
 * carts = { [clientId]: { client: {id,name,city}, items: { [productId]: { product, qty } } } }
 */
const CartContext = createContext(null);
const keyFor = (uid) => `commercialapp.carts.${uid}`;

function load(uid) {
  try { return JSON.parse(localStorage.getItem(keyFor(uid))) || {}; } catch { return {}; }
}

const slimProduct = ({ id, name, reference, price, image, uom, stock, category }) =>
  ({ id, name, reference, price, image, uom, stock, category });

export function CartProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const [store, setStore] = useState(() => ({ uid, carts: uid ? load(uid) : {} }));
  const [lastClientId, setLastClientId] = useState(null);

  // Chargement synchrone quand l'utilisateur change (évite un panier vide au rechargement de page)
  if (store.uid !== uid) setStore({ uid, carts: uid ? load(uid) : {} });
  const carts = store.uid === uid ? store.carts : {};
  const setCarts = (fn) => setStore((s) => ({ ...s, carts: fn(s.carts) }));

  useEffect(() => {
    if (!uid || store.uid !== uid) return;
    try { localStorage.setItem(keyFor(uid), JSON.stringify(carts)); } catch { /* stockage plein : on ignore */ }
  }, [carts, uid]);

  const value = useMemo(() => {
    const update = (client, fn) => setCarts((all) => {
      const cart = all[client.id] || { client, items: {} };
      const items = fn({ ...cart.items });
      const next = { ...all };
      if (Object.keys(items).length) next[client.id] = { client: { id: client.id, name: client.name, city: client.city }, items };
      else delete next[client.id];
      return next;
    });

    return {
      carts,
      lastClientId,
      setLastClientId,
      getItems: (clientId) => Object.values(carts[clientId]?.items || {}),
      count: (clientId) => Object.values(carts[clientId]?.items || {}).reduce((s, i) => s + i.qty, 0),
      add: (client, product, qty = 1) => update(client, (items) => {
        const cur = items[product.id];
        items[product.id] = { product: slimProduct(product), qty: (cur?.qty || 0) + qty };
        return items;
      }),
      setQty: (client, productId, qty) => update(client, (items) => {
        if (qty <= 0) delete items[productId];
        else if (items[productId]) items[productId] = { ...items[productId], qty };
        return items;
      }),
      remove: (client, productId) => update(client, (items) => { delete items[productId]; return items; }),
      clear: (clientId) => setCarts((all) => { const next = { ...all }; delete next[clientId]; return next; }),
    };
  }, [carts, lastClientId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
