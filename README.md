# SangraH

Premium full-stack e-commerce application for decorative glass home decor, timeless treasures, and unique products in one place.

## Folder Structure

```text
.
├── client/
│   ├── index.html
│   ├── public/images/             # AI-generated product imagery
│   └── src/
│       ├── components/            # Layout, product cards, shadcn-style UI
│       ├── context/AuthContext.tsx # Session auth state and useAuth hook
│       ├── lib/                   # API client and utilities
│       └── pages/                 # Home, shop, product, cart, wishlist, auth, admin
├── server/
│   ├── db.ts                      # MongoDB connection and Mongoose models
│   ├── index.ts                   # Express app bootstrap
│   ├── routes.ts                  # API routes and session auth
│   ├── seed.ts                    # Initial categories and products
│   └── storage.ts                 # Storage interface and Mongo implementation
├── shared/schema.ts               # Zod schemas and shared TypeScript types
├── vercel.json                    # Frontend deployment config
├── render.yaml                    # Render backend blueprint
└── .env
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Update `.env` with your local MongoDB, auth, payment, and shipping values.

3. Start MongoDB locally or provide `MONGODB_URI`.

4. Seed the catalog:

```bash
npm run seed
```

5. Start the backend Express API server (Terminal 1):

```bash
npm run server
```
or with file-watching / auto-reload on changes:
```bash
npm run dev:server
```
The API server will run on `http://localhost:5000`.

6. Start the frontend Next.js dev server (Terminal 2):

```bash
npm run dev
```
The web app will run on `http://localhost:3000` and communicate with the backend at `http://localhost:5000`.

> **Note**: Alternatively, if `NEXT_PUBLIC_API_URL` in `.env` is left empty, Next.js can serve both the frontend and backend together on `http://localhost:3000` via its integrated serverless route handler (`pages/api/[...path].ts`) with just `npm run dev`.

## Deployment

Vercel frontend:
- Set `VITE_API_URL` to the Render backend URL.
- Use the included `vercel.json`.

Render backend:
- Set `MONGODB_URI`, `SESSION_SECRET`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
- `PORT` is provided automatically by Render.

## Payments

Checkout supports:

- Razorpay Checkout for UPI, cards, netbanking, and wallets when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured.
- Demo card payments for local development without Razorpay keys.
- Cash on delivery.

Authenticated customers can place orders from `/checkout`, complete payment on `/payment/:id`, and view history at `/orders`.

## Shipping

Shiprocket shipment creation is available from each order card in the admin Orders tab. Configure these backend environment variables before using it:

```text
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_PICKUP_LOCATION=
SHIPROCKET_FALLBACK_EMAIL=support@sangrah.com
SHIPROCKET_DEFAULT_LENGTH_CM=20
SHIPROCKET_DEFAULT_BREADTH_CM=15
SHIPROCKET_DEFAULT_HEIGHT_CM=8
SHIPROCKET_DEFAULT_WEIGHT_KG=0.5
```

`SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD` should be API user credentials generated from Shiprocket, not necessarily the regular dashboard login. `SHIPROCKET_PICKUP_LOCATION` must match a pickup location configured in the Shiprocket panel.

## Admin

The admin page is available at `/admin`.

Admin password:

```text
Sangrah@2026
```
