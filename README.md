# CommercialApp

Application de prise de commande pour les commerciaux, connectée à Odoo.

Parcours : connexion → clients → produits du client (prix client + stock) → panier → confirmation (TVA 20 %) → commande créée dans Odoo.

- `frontend/` : React + Vite (port 5173)
- `backend/` : Node.js + Express (port 4001), parle à Odoo en JSON-RPC

Prérequis : Node.js 18 ou plus.

## 1. Installation du backend

```
cd backend
npm install
cp .env.example .env
```

Puis remplir `backend/.env` (voir section 3).

## 2. Installation du frontend

```
cd frontend
npm install
```

Aucun `.env` n'est nécessaire en développement : Vite redirige `/api` vers `http://localhost:4001`.

## 3. Variables `.env` (backend)

| Variable | Rôle |
|---|---|
| `PORT` | Port du backend (4001) |
| `CORS_ORIGIN` | URL du frontend (http://localhost:5173) |
| `JWT_SECRET` | Longue chaîne aléatoire pour signer les sessions |
| `ODOO_URL` | URL de ton Odoo |
| `ODOO_DB` | Nom de la base Odoo |
| `ODOO_USERNAME` / `ODOO_PASSWORD` | Compte technique Odoo (mot de passe ou clé API) |
| `ODOO_CONFIRM_ORDER` | `true` = la commande est confirmée dans Odoo, `false` = reste en devis |
| `ODOO_TAX_ID` | Optionnel : id de la taxe 20 %. Sinon recherche automatique d'une taxe de vente à 20 % |
| `CLIENTS_ONLY_MINE` | `true` = chaque commercial ne voit que ses clients (champ Vendeur) |
| `ORDERS_ONLY_MINE` | `true` = stats et commandes limitées au commercial connecté |

Ne jamais mettre de vrais secrets dans le code ni dans Git : ils restent dans `.env`.

## 4. Lancer le backend

```
cd backend
npm run dev
```

## 5. Lancer le frontend

```
cd frontend
npm run dev
```

Ouvrir http://localhost:5173 et se connecter avec ses identifiants Odoo.

## Tester sans Odoo (optionnel)

Un faux Odoo en mémoire est fourni, uniquement pour les tests :

```
cd backend
npm run mock:odoo
```

Dans `backend/.env` : `ODOO_URL=http://localhost:8069`, `ODOO_DB=demo`, `ODOO_USERNAME=api`, `ODOO_PASSWORD=api`.
Connexion dans l'app : `salma@demo.ma` / `demo`.

## Fonctionnement

- **Connexion** : vérifiée par Odoo avec les identifiants du commercial, puis session JWT.
- **Prix client** : calculés depuis la liste de prix Odoo du client (prix fixe, remise %, formule, paliers de quantité). Recalculés côté serveur à la création de la commande.
- **TVA** : fixée à 20 %. La taxe Odoo à 20 % est appliquée aux lignes de commande.
- **Commande** : créée dans `sale.order` avec le commercial connecté comme vendeur.

## Production

```
cd frontend
npm run build
```

Le dossier `frontend/dist` est à servir en statique. Si le backend est sur un autre domaine, mettre `VITE_API_URL=https://url-du-backend` dans `frontend/.env` avant le build, et mettre l'URL du frontend dans `CORS_ORIGIN`.
