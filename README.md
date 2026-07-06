# CNA Shop — Web

<!-- Replace OWNER with your GitHub username (and the repo name if different) once pushed. -->
[![Web CI](https://github.com/OWNER/cna-web/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/cna-web/actions/workflows/ci.yml)

Frontend for **CNA Shop**, a full-stack e-commerce platform. A **Next.js 16** (App Router) storefront + admin panel in **TypeScript** and **Tailwind CSS 4**, talking to an ASP.NET Core 8 API. The UI is in Romanian.

> Companion API: **[CNA.WebApi](../CNA.WebApi)** · Architecture deep-dive: **[ARCHITECTURE.md](../CNA.WebApi/ARCHITECTURE.md)**

<!-- Add storefront + admin screenshots here for instant visual context -->

---

## Highlights

- 🧭 **App Router** — server components render and fetch on the server where possible; interactive views are client components.
- 🔐 **Silent-refresh auth** — JWT access + refresh tokens; the token is renewed ~1 min before expiry. A single `authFetch` wrapper attaches the Bearer token and transparently retries once on `401`.
- 🪝 **Custom hooks** — e.g. `useTokenRef`, which keeps the token in a ref so data-fetch effects don't re-fire on background refresh.
- 🛒 **Guest + user carts** — guests get a `crypto.randomUUID()` session cart that merges into the account cart on login.
- 🔎 **URL-driven catalog filtering** — all filter/sort/pagination state lives in query params, so views are bookmarkable and shareable.
- 🌗 **Dark mode** with no flash-of-unstyled-content, responsive layout, and a mobile navigation drawer.
- 🧑‍💼 **Full admin panel** — products, variants, categories, orders (AWB dispatch), returns, coupons, gift cards, and analytics dashboards.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 |
| State | React Context (Auth · Cart · Favorites · Theme) |
| Forms | React Hook Form 7 + Zod 4 |
| Auth | JWT (localStorage) + `@react-oauth/google` |
| HTTP | native `fetch` via typed `lib/api/*` wrappers |
| Icons | Lucide React |

---

## Getting started

**Prerequisites:** Node 18+, and the [CNA.WebApi](../CNA.WebApi) backend running on `https://localhost:44381`.

```bash
npm install
npm run dev     # http://localhost:3000
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=https://localhost:44381
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> The `dev` script sets `NODE_TLS_REJECT_UNAUTHORIZED=0` so **server-side** rendering can fetch the API over its self-signed dev certificate. Without it, server-rendered pages (e.g. product detail) fail to load in development.

```bash
npm run build   # production build
npm run lint    # ESLint (0 errors)
```

---

## Project structure

```
app/                 # App Router pages
  admin/             # Role-gated admin panel (products, orders, returns, analytics…)
  produse/           # Catalog + product/variant detail (server-rendered)
  cart/ checkout/    # Cart and multi-step checkout
  payment/ profil/   # Stripe payment redirect, user profile & orders
components/           # Shared UI (layout, home, products, ui)
context/             # Auth, Cart, Favorites, Theme providers
hooks/               # Reusable hooks (useTokenRef, …)
lib/api/             # One typed fetch module per API domain
types/               # Shared TypeScript interfaces
```

Providers wrap in order: `GoogleProvider → AuthProvider → ThemeProvider → CartProvider → FavoritesProvider`.

---

## Testing

End-to-end coverage lives with the backend as a **67-test Selenium suite** (`CNA.E2ETests`) that drives a real browser against this frontend, the API, and a seeded database. There is also a Playwright spec set under `e2e/`.

---

## License

Portfolio / educational project.
