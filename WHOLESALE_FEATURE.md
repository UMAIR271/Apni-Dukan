# Wholesale (B2B) Feature Documentation

## Overview
The "Apni Dukan" backend now supports both Retail (B2C) and Wholesale (B2B) orders. The same product catalog serves both customer types, but wholesale customers see wholesale pricing and have different order rules.

## Key Features

### 1. User Types
- **Retail Customers**: Default account type, see retail pricing
- **Wholesale Customers**: Must be approved by admin, see wholesale pricing

### 2. UserProfile Model
Each user has a profile with:
- `account_type`: RETAIL or WHOLESALE (default: RETAIL)
- `wholesale_approved`: Boolean (default: False)
- `shop_name`: Optional shop name for wholesale customers
- `shop_address`: Optional shop address
- `shop_phone`: Optional shop phone

### 3. Product Wholesale Fields
Products can have wholesale pricing:
- `wholesale_price`: Wholesale price (nullable)
- `wholesale_min_qty`: Minimum quantity for wholesale orders (default: 1)
- `is_wholesale_available`: Whether product is available for wholesale (default: False)

### 4. Order Rules

#### Retail Orders:
- Minimum order: None
- Delivery fee: Free if subtotal >= Rs. 800, else Rs. 50

#### Wholesale Orders:
- Minimum order: Rs. 3,000
- Delivery fee: Free (always)
- Must meet `wholesale_min_qty` per product

### 5. Pricing Logic
- Retail customers see: `price` or `sale_price` (if available)
- Wholesale customers see: `wholesale_price` (if available and approved), otherwise fallback to retail price
- Product serializer returns:
  - `display_price`: Price based on user type
  - `retail_price`: Always shows retail price
  - `wholesale_price`: Only shown if user is approved wholesale customer

## API Endpoints

### New Endpoints

#### GET `/api/me/`
Get current user profile with account type and wholesale status.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "customer1",
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "account_type": "WHOLESALE",
      "wholesale_approved": true,
      "shop_name": "ABC Store",
      "shop_address": "123 Main St",
      "shop_phone": "1234567890"
    }
  },
  "account_type": "WHOLESALE",
  "wholesale_approved": true,
  "shop_name": "ABC Store",
  "shop_address": "123 Main St",
  "shop_phone": "1234567890"
}
```

#### POST `/api/wholesale/request/`
Request wholesale account access.

**Request Body:**
```json
{
  "shop_name": "ABC Store",
  "shop_address": "123 Main St",
  "shop_phone": "1234567890"
}
```

**Response:**
```json
{
  "message": "Wholesale account request submitted. Waiting for admin approval.",
  "profile": {
    "account_type": "WHOLESALE",
    "wholesale_approved": false,
    "shop_name": "ABC Store",
    "shop_address": "123 Main St",
    "shop_phone": "1234567890"
  }
}
```

### Updated Endpoints

#### GET `/api/products/`
Now accepts `pricing` query parameter:
- `?pricing=retail` - Show only retail products
- `?pricing=wholesale` - Show only wholesale-available products

Product response includes:
- `display_price`: Price based on user type
- `retail_price`: Retail price
- `wholesale_price`: Wholesale price (only if user is approved wholesale)
- `wholesale_min_qty`: Minimum quantity for wholesale
- `is_wholesale_available`: Whether product is available for wholesale

#### POST `/api/cart/add/`
- Automatically uses wholesale pricing if user is approved wholesale customer
- Validates `wholesale_min_qty` for wholesale customers

#### PUT `/api/cart/update/<cart_item_id>/`
- Updates price snapshot based on user type
- Validates `wholesale_min_qty` for wholesale customers

#### POST `/api/checkout/`
- Automatically sets `order_type` based on user profile
- Validates minimum order amount for wholesale (Rs. 3,000)
- Applies appropriate delivery fee rules

## Admin Panel

### UserProfile Admin
- View all user profiles
- Toggle `wholesale_approved` status
- Edit shop details
- Filter by account type and approval status

### Product Admin
- Edit wholesale fields:
  - `is_wholesale_available`
  - `wholesale_price`
  - `wholesale_min_qty`

### Order Admin
- View `order_type` (RETAIL or WHOLESALE)
- Filter orders by order type

## Workflow

### For Wholesale Customers:
1. User signs up (defaults to RETAIL)
2. User requests wholesale access via `/api/wholesale/request/`
3. Admin approves via Django admin panel
4. User can now:
   - See wholesale pricing on products
   - Add products to cart with wholesale pricing
   - Place wholesale orders (minimum Rs. 3,000)
   - Get free delivery

### For Admins:
1. Go to Django admin → UserProfiles
2. Find user requesting wholesale access
3. Toggle `wholesale_approved` to True
4. Optionally update shop details

## Database Migrations

Run migrations to apply changes:
```bash
python manage.py migrate
```

This will:
1. Create `UserProfile` model
2. Add wholesale fields to `Product` model
3. Add `order_type` to `Order` model
4. Create UserProfile for existing users

## Testing

### Test Wholesale Pricing:
1. Create a product with `is_wholesale_available=True` and `wholesale_price`
2. Create a user and request wholesale access
3. Admin approves the user
4. User logs in and views products - should see `wholesale_price` in response
5. Add product to cart - should use wholesale price
6. Checkout - should create order with `order_type=WHOLESALE`

### Test Minimum Order:
1. As approved wholesale customer, add products totaling < Rs. 3,000
2. Try to checkout - should get error message
3. Add more products to reach Rs. 3,000+
4. Checkout should succeed

### Test Minimum Quantity:
1. Create product with `wholesale_min_qty=10`
2. As approved wholesale customer, try to add 5 units
3. Should get error: "Minimum quantity required: 10"
4. Add 10+ units - should succeed

## Notes

- UserProfile is automatically created when a User is created (via signal)
- Existing users will get UserProfile created via migration
- Retail customers are not affected by wholesale features
- Wholesale pricing is optional - products can have retail-only pricing
- Order type is automatically determined based on user's profile at checkout time
