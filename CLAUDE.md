@AGENTS.md

# CNA-Web — Frontend Knowledge Base

## What This Is
Next.js 16 (App Router) frontend for the CNA Shop e-commerce platform. It talks to **CNA.WebApi** (default: `https://localhost:44381`). The app is in Romanian (UI labels and error messages).

## Tech Stack
- **Framework**: Next.js 16.2.1 with App Router + Turbopack
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4
- **State**: React Context API (Auth, Cart, Favorites, Theme)
- **Forms**: React Hook Form 7 + Zod 4
- **Icons**: Lucide React
- **Auth**: JWT (localStorage) + `@react-oauth/google` for Google OAuth
- **HTTP**: Native `fetch` (Axios is installed but not used)
- Zustand is installed but unused — Context API handles all global state

## Running the App
```bash
npm run dev      # Dev server on :3000, Turbopack, --use-system-ca for cert trust
npm run build
npm run start
npm run lint
```

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_API_URL=https://localhost:44381
NEXT_PUBLIC_GOOGLE_CLIENT_ID=356280144991-kke7k7falr5dc31bds4g52rc2n73kktu.apps.googleusercontent.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Project Structure
```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout — wraps all providers in order
  page.tsx              # Home page (server component)
  globals.css
  admin/                # Admin panel (role-gated: Admin or Seller)
    layout.tsx          # Sidebar navigation for admin
    page.tsx            # Dashboard
    categorii/          # Category CRUD
    products/           # Product CRUD
    variante/           # Variant CRUD
    unitati/            # Measurement units CRUD
    comenzi/            # Order management
    returns/            # Returns management
    statistici/         # Revenue & sales analytics
    users/              # User list
  auth/
    login/              # Unified login + register page
    confirm-email/
    forgot-password/
    reset-password/
  cart/
  checkout/
  payment/[orderId]/
  produse/              # Product catalog with advanced filtering (831-line page)
  categories/
  favourites/
  profil/               # User profile, settings, addresses, returns
  comenzi/              # User order history
  contact/
  despre-noi/
  search/

components/             # Global shared components
  layout/
    Navbar.tsx          # Sticky header: logo, links, search, cart/fav badges, user menu
    CartBadge.tsx
    FavouritesBadge.tsx
    UserMenu.tsx
    UnpaidOrderBanner.tsx
    GoogleProvider.tsx
  home/
    HeroSection.tsx
    FeaturedCategories.tsx
    CategorySidebar.tsx
    FilterBar.tsx
    SearchBar.tsx
    HomeContent.tsx
  products/
    ProductCard.tsx
    VariantCard.tsx     # Primary grid card: image, price, rating
    ImageGallery.tsx
    AddToCartButton.tsx # Includes quantity selector
    FavoriteButton.tsx  # Heart icon toggle
    ReviewForm.tsx
  ui/
    PageSpinner.tsx

context/                # Global React Context providers
  AuthContext.tsx       # JWT + refresh token, Google OAuth, role parsing
  CartContext.tsx       # Cart for users and guests (UUID session)
  FavoritesContext.tsx  # Wishlist; uses variant ID map for O(1) lookup
  ThemeContext.tsx      # Light/dark toggle, persisted to localStorage

lib/api/                # All API service functions (one file per domain)
  auth.ts               # login, register, googleLogin, refreshToken, confirmEmail, resetPassword
  products.ts           # getProducts, getVariantsFiltered, getVariantDetail
  categories.ts
  cart.ts               # getCart, addToCart, updateCartItem, removeCartItem, checkout, mergeSessionCart
  favorites.ts
  orders.ts
  user.ts
  shippingContacts.ts
  reviews.ts
  returns.ts
  payments.ts
  admin.ts              # Admin/Seller ops: images, analytics, bulk deletes, import

types/                  # TypeScript interfaces (auth, product, cart, category, favorite)
```

## Provider Wrapping Order (root `layout.tsx`)
```
GoogleProvider → AuthProvider → ThemeProvider → CartProvider → FavoritesProvider
```

## Auth Flow
- JWT access token (60 min) + refresh token stored in `localStorage`
- `AuthContext` silently refreshes the token 60 seconds before expiry
- Claims parsed from JWT: `userId`, `email`, `role` (Admin | Seller | User)
- Protected pages redirect to `/auth/login` via `useEffect` role check
- Google OAuth via `@react-oauth/google` — same `/api/auth/google` endpoint on the API

## Cart & Guest Sessions
- Guest users get a `guestSessionId` (UUID via `crypto.randomUUID()`) in `localStorage`
- Session ID sent as both `X-Session-Id` header and query param (CORS workaround)
- On login, `POST /api/cart/merge` merges the guest cart into the user's cart

## Product Filtering (`/produse`)
- All filter state lives in URL query params (bookmarkable/shareable)
- Server-side: `searchText`, `categoryId`, `productId`, `brand`, `onlyActive`, `onlyInStock`, `featured`, `sortBy`, `minPrice`, `maxPrice`, `page`, `pageSize`
- Client-side attribute filters (numeric ranges, text toggles) applied after fetch
- 24 items per page; sort options: price, name, rating, review count

## API Communication Pattern
All calls go through `lib/api/*.ts`. Functions use native `fetch`:
- `Authorization: Bearer <token>` for authenticated requests
- Base URL from `NEXT_PUBLIC_API_URL`
- Try/catch with user-friendly Romanian error messages

## Admin Section
- Route-guarded: non-Admin/Seller users redirected away
- Full CRUD: categories, products, variants, measurement units
- Order management: dispatch with AWB tracking number, cancellation
- Revenue statistics with granularity: Hour / Day / Week / Month / Year
- Top-selling variants and monthly product sales reports

## Key Conventions
- `"use client"` on all interactive components; home/product pages are server components
- Path alias `@/*` maps to repo root
- Dark mode via Tailwind `dark:` prefix; inline script in `layout.tsx` prevents FOUC
- Romanian UI: all user-visible strings and route names are in Romanian (`comenzi`, `produse`, `despre-noi`, etc.)
- No Axios despite it being installed — use native `fetch` throughout
