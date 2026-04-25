# Apni Dukan - Grocery Delivery Backend

A complete Django REST Framework backend for a grocery delivery application.

## Features

- **User Authentication**: Token-based authentication, rate-limited signup/login
- **Product Management**: Categories and products with image uploads + URL fallback
- **Shopping Cart**: Add, update, remove items
- **Order Management**: Full lifecycle with a 4-step visual progress tracker
- **Reorder**: One-click "buy these again" from any past order
- **Address Management**: Multiple delivery addresses per user
- **Stock Management**: Auto stock reduction on order confirmation, low-stock badges
- **Configurable business rules**: minimum order, free-delivery threshold, delivery fee
- **Promo codes / coupons**: percent or flat discounts with usage limits & expiry
- **Reviews & ratings**: 5-star reviews per product, moderated from admin
- **Order email notifications**: shop owner gets an email on every order (background thread)
- **Newsletter signup**: capture email subscribers to a managed list
- **WhatsApp contact button**: floating CTA wired to your number
- **Search**: ranked multi-field search with type-ahead suggestions
- **Admin dashboard**: revenue, top products, low-stock, orders by status (`/admin/dashboard`)
- **SEO**: `sitemap.xml`, `robots.txt`, per-product page metadata
- **Production hardening**: caching, rate limiting, threaded emails
- **Admin Panel**: Full Django admin for products, categories, orders, coupons, reviews, subscribers

## Tech Stack

- Django 4.2.7
- Django REST Framework 3.14.0
- PostgreSQL (production) / SQLite (development)
- Token Authentication

## Project Structure

```
Apni Dukan/
├── apni_dukan/          # Main project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── store/               # Main app
│   ├── models.py        # All data models
│   ├── views.py         # API views
│   ├── serializers.py   # DRF serializers
│   ├── admin.py         # Admin configuration
│   ├── urls.py          # API routes
│   └── signals.py       # Stock management signals
├── manage.py
├── requirements.txt
└── README.md
```

## Setup Instructions

### 1. Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- PostgreSQL (optional, for production)

### 2. Installation

```bash
# Clone or navigate to the project directory
cd "Apni Dukan"

# Create a virtual environment (recommended)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Setup

#### For Development (SQLite - Default)

No additional setup needed. SQLite database will be created automatically.

#### For Production (PostgreSQL)

1. Create a PostgreSQL database:
```sql
CREATE DATABASE apni_dukan;
```

2. Update `apni_dukan/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'apni_dukan',
        'USER': 'your_username',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Or use environment variables:
```bash
export DB_NAME=apni_dukan
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_HOST=localhost
export DB_PORT=5432
```

### 4. Run Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### 5. Create Superuser (Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### 6. Create Test Data (Optional)

Populate the database with sample data for testing:

```bash
python manage.py create_test_data
```

This will create:
- 8 categories (Fruits & Vegetables, Dairy & Eggs, etc.)
- 30+ products across all categories
- 3 test users with authentication tokens
- Sample addresses
- Sample cart items
- Sample orders

**Test Users Created:**
- `testuser1` / `testpass123` - Has items in cart
- `testuser2` / `testpass123` - Empty cart
- `customer1` / `customer123` - Has a confirmed order

The command will display authentication tokens for each user that you can use directly in API requests.

### 7. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

Admin panel: `http://localhost:8000/admin/`

## API Endpoints

### Authentication

#### Sign Up
- **POST** `/api/auth/signup/`
- **Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```
- **Response:**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Login
- **POST** `/api/auth/login/`
- **Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```
- **Response:** Same as signup

### Categories

#### List Categories
- **GET** `/api/categories/`
- **Authentication:** Not required
- **Response:**
```json
[
  {
    "id": 1,
    "name": "Fruits & Vegetables",
    "slug": "fruits-vegetables",
    "is_active": true
  }
]
```

### Products

#### List Products
- **GET** `/api/products/`
- **Query Parameters:**
  - `category` (optional): Filter by category slug
  - `search` (optional): Search in name/description
- **Examples:**
  - `/api/products/?category=fruits-vegetables`
  - `/api/products/?search=apple`
  - `/api/products/?category=fruits-vegetables&search=apple`
- **Authentication:** Not required

#### Product Detail
- **GET** `/api/products/{id}/`
- **Authentication:** Not required

### Cart

#### Get Cart
- **GET** `/api/cart/`
- **Authentication:** Required (Token)
- **Headers:** `Authorization: Token {your_token}`
- **Response:**
```json
{
  "id": 1,
  "items": [
    {
      "id": 1,
      "product": 1,
      "product_name": "Fresh Apples",
      "product_image": "https://example.com/apple.jpg",
      "quantity": 2,
      "price_snapshot": "150.00",
      "subtotal": "300.00"
    }
  ],
  "total": "300.00",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### Add to Cart
- **POST** `/api/cart/add/`
- **Authentication:** Required (Token)
- **Body:**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

#### Update Cart Item
- **PUT** `/api/cart/update/{cart_item_id}/`
- **Authentication:** Required (Token)
- **Body:**
```json
{
  "quantity": 3
}
```

#### Remove Cart Item
- **DELETE** `/api/cart/remove/{cart_item_id}/`
- **Authentication:** Required (Token)

### Addresses

#### List/Create Addresses
- **GET** `/api/addresses/` - List user addresses
- **POST** `/api/addresses/` - Create new address
- **Authentication:** Required (Token)
- **Body (POST):**
```json
{
  "full_name": "John Doe",
  "phone": "+923001234567",
  "city": "Karachi",
  "area": "Clifton",
  "street": "Main Street",
  "house_no": "123",
  "notes": "Ring the bell twice"
}
```

#### Address Detail/Update/Delete
- **GET** `/api/addresses/{id}/` - Get address
- **PUT** `/api/addresses/{id}/` - Update address
- **DELETE** `/api/addresses/{id}/` - Delete address
- **Authentication:** Required (Token)

### Checkout

#### Create Order
- **POST** `/api/checkout/`
- **Authentication:** Required (Token)
- **Body:**
```json
{
  "address_id": 1,
  "payment_method": "COD"
}
```
- **Payment Methods:** `COD`, `JAZZCASH`, `EASYPAISA`
- **Response:**
```json
{
  "id": 1,
  "user": 1,
  "address": 1,
  "address_details": {
    "id": 1,
    "full_name": "John Doe",
    "phone": "+923001234567",
    "city": "Karachi",
    "area": "Clifton",
    "street": "Main Street",
    "house_no": "123",
    "notes": "Ring the bell twice",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "status": "PLACED",
  "payment_method": "COD",
  "subtotal": "750.00",
  "delivery_fee": "50.00",
  "total": "800.00",
  "items": [
    {
      "id": 1,
      "product": 1,
      "product_name": "Fresh Apples",
      "quantity": 5,
      "price_snapshot": "150.00",
      "subtotal": "750.00"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Orders

#### List Orders
- **GET** `/api/orders/`
- **Authentication:** Required (Token)
- Returns all orders for the authenticated user

#### Order Detail
- **GET** `/api/orders/{id}/`
- **Authentication:** Required (Token)

## Postman Collection Examples

### 1. Sign Up
```
POST http://localhost:8000/api/auth/signup/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "testpass123",
  "first_name": "Test",
  "last_name": "User"
}
```

### 2. Login
```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass123"
}
```

### 3. Get Categories
```
GET http://localhost:8000/api/categories/
```

### 4. Get Products
```
GET http://localhost:8000/api/products/
GET http://localhost:8000/api/products/?category=fruits-vegetables
GET http://localhost:8000/api/products/?search=apple
```

### 5. Get Cart (Authenticated)
```
GET http://localhost:8000/api/cart/
Authorization: Token {your_token_here}
```

### 6. Add to Cart
```
POST http://localhost:8000/api/cart/add/
Authorization: Token {your_token_here}
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2
}
```

### 7. Update Cart Item
```
PUT http://localhost:8000/api/cart/update/1/
Authorization: Token {your_token_here}
Content-Type: application/json

{
  "quantity": 5
}
```

### 8. Remove Cart Item
```
DELETE http://localhost:8000/api/cart/remove/1/
Authorization: Token {your_token_here}
```

### 9. Create Address
```
POST http://localhost:8000/api/addresses/
Authorization: Token {your_token_here}
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+923001234567",
  "city": "Karachi",
  "area": "Clifton",
  "street": "Main Street",
  "house_no": "123",
  "notes": "Ring the bell"
}
```

### 10. Checkout (Create Order)
```
POST http://localhost:8000/api/checkout/
Authorization: Token {your_token_here}
Content-Type: application/json

{
  "address_id": 1,
  "payment_method": "COD"
}
```

### 11. Get Orders
```
GET http://localhost:8000/api/orders/
Authorization: Token {your_token_here}
```

### 12. Get Order Detail
```
GET http://localhost:8000/api/orders/1/
Authorization: Token {your_token_here}
```

## Business Logic

### Stock Management
- Stock is checked when adding items to cart
- Stock is checked again during checkout
- Stock is **reduced automatically** when order status changes to `CONFIRMED` (via signal)
- Stock is **restored** if a confirmed order is cancelled

### Delivery Fee Calculation
- If order subtotal >= 800: `delivery_fee = 0`
- Otherwise: `delivery_fee = 50`

### Order Status Flow
1. **PLACED** - Order created from cart
2. **CONFIRMED** - Admin confirms order (stock reduced)
3. **PACKED** - Order is packed
4. **OUT_FOR_DELIVERY** - Order is out for delivery
5. **DELIVERED** - Order delivered successfully
6. **CANCELLED** - Order cancelled (stock restored if was confirmed)

## Admin Panel

Access the admin panel at `http://localhost:8000/admin/`

### Features:
- Manage Categories (create, edit, activate/deactivate)
- Manage Products (create, edit, update stock, set prices)
- View and manage Orders
  - Update order status easily
  - View order items inline
  - See order totals and delivery fees
- View User addresses and carts

## Testing the API

### Using cURL

```bash
# Sign up
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# Get products (no auth required)
curl http://localhost:8000/api/products/

# Add to cart (replace TOKEN with your token)
curl -X POST http://localhost:8000/api/cart/add/ \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":2}'
```

## Production Deployment

### Security Checklist

1. **Change SECRET_KEY** in `settings.py`
2. **Set DEBUG = False**
3. **Configure ALLOWED_HOSTS**
4. **Use PostgreSQL** instead of SQLite
5. **Set up proper CORS** origins
6. **Use environment variables** for sensitive data
7. **Set up SSL/HTTPS**
8. **Configure static files** serving (use WhiteNoise or CDN)

### Environment Variables Example

```bash
export SECRET_KEY='your-secret-key-here'
export DEBUG=False
export ALLOWED_HOSTS='yourdomain.com,www.yourdomain.com'
export DB_NAME=apni_dukan
export DB_USER=postgres
export DB_PASSWORD=secure_password
export DB_HOST=localhost
export DB_PORT=5432
```

## License

This project is open source and available for use.

## Support

For issues or questions, please create an issue in the repository.
