# Wholesale Flow Guide - Apni Dukan

## Complete Wholesale Flow

### Step 1: Sign Up / Login
1. **Sign Up**: Create a new account at `/signup`
   - Default account type: **RETAIL**
   - You'll see regular retail pricing

2. **Login**: Use your credentials at `/login`

---

### Step 2: Request Wholesale Access

**Option A: Via Profile Menu**
1. Click on your **profile icon** (👤) in the top right navbar
2. Click **"Request Wholesale"** from the dropdown menu
3. You'll be redirected to `/wholesale` page

**Option B: Direct Navigation**
1. Go to `/wholesale` page directly
2. Fill out the form (optional):
   - Shop Name
   - Shop Address  
   - Shop Phone
3. Click **"Request Wholesale Account"** button

**What Happens:**
- Your account type changes to `WHOLESALE`
- Status: **Pending Approval** (wholesale_approved = False)
- You'll see "Pending Approval" badge in profile menu
- You still see retail pricing until approved

---

### Step 3: Admin Approval (Backend)

**Admin Steps:**
1. Go to Django Admin: `http://localhost:8000/admin`
2. Navigate to **Store → User Profiles**
3. Find your user profile
4. Check the **"Wholesale approved"** checkbox
5. Optionally update shop details
6. Click **Save**

**Alternative: Via Django Shell**
```python
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from store.models import UserProfile
>>> user = User.objects.get(username='your_username')
>>> profile = user.profile
>>> profile.wholesale_approved = True
>>> profile.save()
```

---

### Step 4: Access Wholesale Features (After Approval)

Once approved, refresh your browser or log out and log back in. You'll now see:

**1. Wholesale Badge**
- Orange "Wholesale" badge in navbar (desktop view)
- "Wholesale Account" label in profile dropdown

**2. Wholesale Store Filter**
- On Home page (`/`) and Products page (`/products`)
- Two filter buttons appear:
  - **Retail Store** (green) - Shows all products
  - **Wholesale Store** (orange) - Shows only wholesale-available products

**3. Wholesale Pricing**
- Products show `wholesale_price` instead of retail price
- Retail price shown as strikethrough for comparison
- MOQ (Minimum Order Quantity) displayed on products

**4. Shopping Features**
- Add products with wholesale pricing
- MOQ enforcement (can't add less than minimum quantity)
- Free delivery (always)
- Minimum order: Rs. 3,000

---

### Step 5: Place Wholesale Order

**Cart Page (`/cart`):**
- See wholesale pricing on all items
- MOQ validation (can't reduce below minimum)
- **Minimum Order Warning**: If subtotal < Rs. 3,000, checkout button disabled
- Shows message: "Add Rs. X more to proceed"
- Delivery fee: **Free** (always for wholesale)

**Checkout Page (`/checkout`):**
- Order summary shows **"Wholesale Order"** badge
- Delivery fee: **Free**
- Payment methods: COD / JazzCash / EasyPaisa

**Order Confirmation:**
- Order type: **WHOLESALE**
- Order shows in Orders page with wholesale label

---

## Quick Test Flow

### For Testing Wholesale:

**1. Create Test Product with Wholesale Pricing:**
```bash
# In Django Admin or shell
- Product: "Test Product"
- Price: 100 (retail)
- Wholesale Price: 80
- Wholesale Min Qty: 10
- Is Wholesale Available: ✓ (checked)
```

**2. Create User & Request Wholesale:**
- Sign up → Login
- Click profile icon → "Request Wholesale"
- Fill form → Submit

**3. Approve User:**
- Admin panel → User Profiles → Find user → Check "Wholesale approved"

**4. Test Wholesale Shopping:**
- Refresh browser
- See "Wholesale" badge
- Click "Wholesale Store" filter
- Add products (must meet MOQ)
- Cart must be ≥ Rs. 3,000
- Checkout → Free delivery

---

## Troubleshooting

### Profile Menu Not Showing?
- Make sure you're **logged in**
- Click the **profile icon** (👤) in top right
- Menu should appear below the icon

### Can't See Wholesale Features?
- Check if you're **approved**: Profile menu should show "Wholesale Account" badge
- If you see "Pending Approval", admin hasn't approved yet
- Try **refreshing** the page or **logging out and back in**

### Wholesale Pricing Not Showing?
- Make sure product has `is_wholesale_available = True`
- Make sure product has `wholesale_price` set
- Make sure you're **approved** wholesale customer
- Try clicking "Wholesale Store" filter

### Can't Checkout?
- Check minimum order: Must be ≥ Rs. 3,000 for wholesale
- Check MOQ: Each product must meet minimum quantity
- Check stock availability

---

## API Endpoints for Testing

**Check Your Profile:**
```bash
GET http://localhost:8000/api/me/
Headers: Authorization: Token YOUR_TOKEN
```

**Request Wholesale:**
```bash
POST http://localhost:8000/api/wholesale/request/
Headers: Authorization: Token YOUR_TOKEN
Body: {
  "shop_name": "My Shop",
  "shop_address": "123 Main St",
  "shop_phone": "1234567890"
}
```

**View Products (Wholesale):**
```bash
GET http://localhost:8000/api/products/?pricing=wholesale
Headers: Authorization: Token YOUR_TOKEN
```

---

## Visual Indicators

- **🟢 Green Badge**: Retail account
- **🟠 Orange Badge**: Approved Wholesale account  
- **🟡 Yellow Badge**: Pending Wholesale approval
- **MOQ Label**: Shows minimum quantity required
- **Wholesale Price**: Highlighted in orange/accent color
- **Free Delivery**: Green badge in cart/checkout
