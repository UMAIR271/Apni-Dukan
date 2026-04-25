# Quick Wholesale Access Guide

## 🔍 How to See Wholesale Features

### Step 1: Login
- Make sure you're logged in to your account
- You should see your profile icon (👤) in the top right corner

### Step 2: Open Profile Menu
- **Click the profile icon** (👤) in the navbar
- A dropdown menu will appear showing:
  - Your name and email
  - Account status badge
  - "Request Wholesale" button (if retail)
  - "Logout" button

### Step 3: Request Wholesale Access
- Click **"Request Wholesale"** from the profile menu
- OR go directly to: `http://localhost:3000/wholesale`
- Fill the form and submit

### Step 4: Get Approved (Admin Required)
**Option A: Django Admin**
1. Go to: `http://localhost:8000/admin`
2. Login as admin
3. Navigate to: **Store → User Profiles**
4. Find your user
5. Check ✅ **"Wholesale approved"**
6. Save

**Option B: Django Shell**
```bash
python manage.py shell
```
```python
from django.contrib.auth.models import User
user = User.objects.get(username='YOUR_USERNAME')
user.profile.wholesale_approved = True
user.profile.save()
```

### Step 5: Refresh & See Wholesale Features
- **Refresh your browser** or **logout and login again**
- You should now see:
  - ✅ **"Wholesale" badge** in navbar (orange badge)
  - ✅ **"Wholesale Store" filter** on home page
  - ✅ **Wholesale pricing** on products
  - ✅ **MOQ labels** on products

---

## 🎯 What You'll See After Approval

### 1. Profile Menu (Click 👤 icon)
- Shows: "✓ Wholesale Account" badge
- Your name and email
- Logout button

### 2. Home Page (`/`)
- **Two filter buttons** appear:
  - 🟢 **Retail Store** - Shows all products
  - 🟠 **Wholesale Store** - Shows only wholesale products
- Products show **wholesale prices**
- **MOQ** (Minimum Order Quantity) displayed

### 3. Product Pages
- **Wholesale price** highlighted
- Retail price shown as strikethrough
- **MOQ** requirement shown
- Can't add less than MOQ

### 4. Cart Page (`/cart`)
- Wholesale pricing on all items
- **Minimum order warning** if < Rs. 3,000
- **Free delivery** (always for wholesale)

### 5. Checkout Page (`/checkout`)
- **"Wholesale Order"** badge
- Free delivery
- Payment options available

---

## 🐛 Troubleshooting

### Profile Menu Not Showing?
- ✅ Make sure you're **logged in**
- ✅ Click the **profile icon** (👤) - it's clickable
- ✅ Menu appears below the icon
- ✅ Click outside to close it

### Can't See "Request Wholesale"?
- ✅ You might already be WHOLESALE type
- ✅ Check profile menu - if you see "Pending Approval", you already requested
- ✅ If approved, you'll see "Wholesale Account" badge

### Wholesale Features Not Showing?
- ✅ Make sure you're **approved** (check Django admin)
- ✅ **Refresh browser** after approval
- ✅ Try **logout and login** again
- ✅ Check if products have `is_wholesale_available = True`

### Wholesale Store Filter Not Showing?
- ✅ Only shows if `accountType === 'WHOLESALE' && wholesaleApproved === true`
- ✅ Make sure admin approved you
- ✅ Refresh the page

---

## 📋 Testing Checklist

- [ ] Login to account
- [ ] Click profile icon (👤)
- [ ] See profile menu with name, email, logout
- [ ] Click "Request Wholesale"
- [ ] Fill form and submit
- [ ] Admin approves in Django admin
- [ ] Refresh browser
- [ ] See "Wholesale" badge in navbar
- [ ] See "Wholesale Store" filter on home page
- [ ] Click "Wholesale Store" filter
- [ ] See wholesale pricing on products
- [ ] Add products to cart
- [ ] See MOQ enforcement
- [ ] See minimum order validation (Rs. 3,000)
- [ ] Checkout with free delivery

---

## 🎨 Visual Indicators

| Status | Badge | Location |
|--------|-------|----------|
| Retail | None | Profile menu |
| Pending Approval | 🟡 Yellow "Pending Approval" | Profile menu |
| Approved Wholesale | 🟠 Orange "Wholesale" | Navbar + Profile menu |
| Wholesale Order | 🟠 "Wholesale Order" | Checkout page |
| MOQ | 📦 "MOQ: X unit" | Product cards |
| Free Delivery | ✅ "Free Delivery" | Cart/Checkout |

---

## 🔗 Quick Links

- **Request Wholesale**: `/wholesale`
- **Django Admin**: `http://localhost:8000/admin`
- **User Profiles**: `http://localhost:8000/admin/store/userprofile/`
- **API Profile Check**: `GET /api/me/`

---

## 💡 Pro Tips

1. **After admin approval**, always refresh or re-login to see changes
2. **Wholesale Store filter** only shows wholesale-available products
3. **MOQ** is enforced - can't add less than minimum quantity
4. **Minimum order** is Rs. 3,000 for wholesale (checkout disabled if less)
5. **Free delivery** is automatic for all wholesale orders
