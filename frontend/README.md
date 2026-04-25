# Apni Dukan Frontend - PWA

A mobile-first Progressive Web App (PWA) frontend for the Apni Dukan grocery delivery application.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **PWA** (Service Worker + Manifest)

## Features

- 🛒 **Shopping Experience**: Browse categories, search products, add to cart
- 📱 **Mobile-First Design**: Optimized for mobile devices
- 🔐 **Authentication**: Login/Signup with token-based auth
- 🛍️ **Cart Management**: Add, update, remove items
- 💳 **Checkout**: Address management and payment method selection
- 📦 **Order Tracking**: View order history and details
- ⚡ **PWA**: Installable app with offline support
- 🎨 **Clean UI**: Green/White/Orange color scheme

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (see main README)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure API URL:**
   
   Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
   
   For production, update this to your backend API URL.

4. **Run development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── products/          # Products listing
│   ├── category/[slug]/   # Category page
│   ├── product/[id]/      # Product detail
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout page
│   ├── orders/            # Order history & detail
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/            # Reusable components
│   ├── Navbar.tsx
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
├── lib/                   # Utilities
│   └── api.ts            # API client
├── public/                # Static assets
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service worker
└── app/globals.css        # Global styles
```

## Pages

### 1. Home (`/`)
- Categories horizontal scroll
- Featured products grid
- Search bar

### 2. Products (`/products`)
- Product listing with filters
- Search functionality
- Category filtering

### 3. Category (`/category/[slug]`)
- Products filtered by category
- Grid layout

### 4. Product Detail (`/product/[id]`)
- Product information
- Quantity selector
- Add to cart button

### 5. Cart (`/cart`)
- Cart items list
- Update quantity
- Remove items
- Subtotal, delivery fee, total calculation

### 6. Checkout (`/checkout`)
- Address selection/creation
- Payment method selection (COD/JazzCash/EasyPaisa)
- Place order

### 7. Orders (`/orders`)
- Order history list
- Order status badges
- Order details page

## Authentication

- Uses localStorage to store authentication token
- Protected routes redirect to login if not authenticated
- Token is sent with all API requests

## PWA Features

### Install as App

1. Open the app in a mobile browser (Chrome/Safari)
2. Look for "Add to Home Screen" prompt
3. Or use browser menu → "Add to Home Screen"

### Service Worker

- Caches static assets
- Enables offline functionality
- Automatically registered on app load

### Manifest

- App name: "Apni Dukan"
- Theme color: Green (#22c55e)
- Icons: 192x192 and 512x512 (add your own icons)

## Color Scheme

- **Primary Green**: `#22c55e` - Fresh/vegetables vibe
- **White**: Clean and simple background
- **Orange Accent**: `#f97316` - Offers/energy

## API Integration

The frontend integrates with the Django REST API backend:

- Base URL: Configured via `NEXT_PUBLIC_API_URL`
- Authentication: Token-based (stored in localStorage)
- All API calls are handled in `lib/api.ts`

## Development

### Adding New Pages

1. Create a new file in `app/` directory
2. Export a default React component
3. Use `Layout` component for consistent layout
4. Use `ProtectedRoute` for authenticated pages

### Styling

- Uses Tailwind CSS utility classes
- Custom colors defined in `tailwind.config.js`
- Mobile-first responsive design

## Troubleshooting

### API Connection Issues

- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Ensure backend is running on the correct port
- Check CORS settings in backend

### PWA Not Installing

- Ensure HTTPS in production (required for PWA)
- Check manifest.json is accessible
- Verify service worker is registered

### Authentication Issues

- Clear localStorage and try again
- Check token is being stored correctly
- Verify backend authentication endpoints

## Production Deployment

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

3. **Deploy to hosting:**
   - Vercel (recommended for Next.js)
   - Netlify
   - Any Node.js hosting

4. **Enable HTTPS:**
   - Required for PWA features
   - Service workers only work on HTTPS (or localhost)

## Notes

- The app is optimized for mobile devices
- All prices are displayed in PKR (Pakistani Rupees)
- Delivery fee is free for orders >= Rs. 800
- Stock validation happens on backend

## Support

For issues or questions, refer to the main project README or create an issue.
