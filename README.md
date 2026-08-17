# WarehouseAPI Client

React single-page app consuming [WarehouseAPI](https://github.com/omrkocar/WarehouseAPI), a .NET inventory and order management REST API.

**Live:** [warehouse-api-frontend.vercel.app](https://warehouse-api-frontend.vercel.app)  
**API docs:** [warehouseapi-h38c.onrender.com/scalar/v1](https://warehouseapi-h38c.onrender.com/scalar/v1)

Demo credentials: `admin` / `Admin123!`. The API runs on a free tier, so the first request after a period of inactivity takes ~30s to cold start.

---

## Stack

React 19 · TypeScript · Vite · React Router · TanStack Query · Axios

Deployed on Vercel, built independently of the backend.

---

## Architecture Decisions

**localStorage persists the token; Context makes it reactive.** The JWT lives in `localStorage` so a refresh doesn't log you out, but localStorage writes don't trigger re-renders. `AuthContext` wraps it in state, so anything reading `useAuth()` updates the moment auth changes - the nav switches between logged-in and logged-out without a reload. The provider decodes the JWT once on mount instead of having every consumer re-parse it.

**Interceptors centralize auth.** A request interceptor attaches the bearer token to every outgoing call. A response interceptor catches `401`, clears the stored token, and redirects to login - expiry is handled in one place rather than at each call site.

**Declarative navigation over imperative.** Redirects render from state (`if (user) return <Navigate to="/" replace />`) rather than firing `navigate()` inside mutation callbacks. Routing and UI derive from the same source, so they can't disagree - an earlier imperative version produced a visible lag where the route changed before the nav bar caught up.

**Route-level guards.** `<ProtectedRoute>` wraps guarded routes instead of each page checking auth for itself, keeping the access policy in one readable place in the routing config.

**React Query owns server state.** Caching, request lifecycle, loading and error states all belong to it. `useState` is reserved for genuinely local concerns like form inputs.

---

## Running Locally

Requires Node 20+ and the [backend](https://github.com/omrkocar/WarehouseAPI) running locally.

```bash
npm install
npm run dev
```

Serves at `http://localhost:5173`, reading `VITE_API_URL` from `.env.development`.

```bash
npm run build
```

Vite inlines `VITE_*` variables into the bundle at build time - they are public by design and hold no secrets. The API base URL is the only one used here.

---

## Structure

```
src/
├── api/client.ts             axios instance + auth interceptors
├── auth/
│   ├── AuthContext.tsx       token persistence, JWT decoding, auth state
│   └── ProtectedRoute.tsx    route guard
├── hooks/useLogin.ts         login mutation
├── pages/                    route components
├── types/                    API response contracts
└── App.tsx                   routing and navigation
```

---

## Scope

Deliberately minimal. This client demonstrates the integration surface - authentication, protected routing, typed API access, and server state management - rather than covering every backend endpoint. The API is the primary project; its full surface is documented and explorable in [the Scalar docs](https://warehouseapi-h38c.onrender.com/scalar/v1).

---

*Built by Omer Kocar - [LinkedIn](https://www.linkedin.com/in/omrkocar/)*
