from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from decimal import Decimal


class UserProfile(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('RETAIL', 'Retail'),
        ('WHOLESALE', 'Wholesale'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default='RETAIL')
    wholesale_approved = models.BooleanField(default=False)
    shop_name = models.CharField(max_length=200, blank=True, null=True)
    shop_address = models.TextField(blank=True, null=True)
    shop_phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.account_type}"
    
    @property
    def is_wholesale_customer(self):
        """Check if user is an approved wholesale customer"""
        return self.account_type == 'WHOLESALE' and self.wholesale_approved


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('liter', 'Liter'),
        ('pack', 'Pack'),
    ]

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # Wholesale fields
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    wholesale_min_qty = models.PositiveIntegerField(default=1)
    is_wholesale_available = models.BooleanField(default=False)
    stock_quantity = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='kg')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        """Returns sale_price if available, otherwise price (retail pricing)"""
        return self.sale_price if self.sale_price else self.price
    
    def get_price_for_user(self, user):
        """Returns appropriate price based on user type"""
        if user.is_authenticated and hasattr(user, 'profile'):
            profile = user.profile
            if profile.is_wholesale_customer and self.is_wholesale_available and self.wholesale_price:
                return self.wholesale_price
        return self.effective_price
    
    def get_min_qty_for_user(self, user):
        """Returns minimum quantity based on user type"""
        if user.is_authenticated and hasattr(user, 'profile'):
            profile = user.profile
            if profile.is_wholesale_customer and self.is_wholesale_available:
                return self.wholesale_min_qty
        return 1

    def __str__(self):
        return self.name


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    city = models.CharField(max_length=100)
    area = models.CharField(max_length=100)
    street = models.CharField(max_length=200)
    house_no = models.CharField(max_length=50)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.city}, {self.area}"


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Cart for {self.user.username}"

    @property
    def total(self):
        """Calculate total cart value"""
        items = self.items.all()
        if not items.exists():
            return Decimal('0.00')
        return sum(item.subtotal for item in items)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ['cart', 'product']

    @property
    def subtotal(self):
        if self.quantity is None or self.price_snapshot is None:
            return Decimal('0.00')
        return self.quantity * self.price_snapshot

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Coupon(models.Model):
    """Promo codes / discount coupons that customers can apply at checkout."""

    DISCOUNT_TYPE_CHOICES = [
        ('PERCENT', 'Percentage'),
        ('FLAT', 'Flat amount'),
    ]

    code = models.CharField(max_length=50, unique=True, help_text="Customer-facing code, e.g. WELCOME200")
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='PERCENT')
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        help_text="Percent (e.g. 10 = 10%) or flat amount (e.g. 200 = Rs. 200 off)"
    )
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Cap for percentage coupons (optional)"
    )
    max_uses_total = models.PositiveIntegerField(null=True, blank=True, help_text="Site-wide cap (blank = unlimited)")
    max_uses_per_user = models.PositiveIntegerField(default=1)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    times_used = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.code

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def is_valid_now(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, "This coupon is no longer active."
        if self.valid_from and now < self.valid_from:
            return False, "This coupon is not yet valid."
        if self.valid_until and now > self.valid_until:
            return False, "This coupon has expired."
        if self.max_uses_total is not None and self.times_used >= self.max_uses_total:
            return False, "This coupon has reached its usage limit."
        return True, ""

    def calculate_discount(self, subtotal):
        """Return the discount amount for the given subtotal (Decimal). Capped by max_discount_amount."""
        from decimal import Decimal
        subtotal = Decimal(subtotal)
        if subtotal < self.min_order_amount:
            return Decimal('0.00')
        if self.discount_type == 'PERCENT':
            discount = (subtotal * self.discount_value / Decimal('100')).quantize(Decimal('0.01'))
        else:
            discount = Decimal(self.discount_value)
        if self.max_discount_amount is not None:
            discount = min(discount, self.max_discount_amount)
        return min(discount, subtotal)


class Order(models.Model):
    STATUS_CHOICES = [
        ('PLACED', 'Placed'),
        ('CONFIRMED', 'Confirmed'),
        ('PACKED', 'Packed'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('COD', 'Cash on Delivery'),
        ('JAZZCASH', 'JazzCash'),
        ('EASYPAISA', 'EasyPaisa'),
    ]
    
    ORDER_TYPE_CHOICES = [
        ('RETAIL', 'Retail'),
        ('WHOLESALE', 'Wholesale'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    address = models.ForeignKey(Address, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLACED')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='COD')
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='RETAIL')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    coupon_code = models.CharField(max_length=50, blank=True, help_text="Snapshot of coupon code at the time of checkout")
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.status}"

    def calculate_delivery_fee(self):
        """Calculate delivery fee based on order type and subtotal.

        Retail rules (configurable via settings):
          - Free delivery when subtotal >= RETAIL_FREE_DELIVERY_THRESHOLD
          - Otherwise, flat RETAIL_DELIVERY_FEE
        Wholesale orders always get free delivery.
        """
        from django.conf import settings
        if self.order_type == 'WHOLESALE':
            return Decimal('0.00')
        threshold = Decimal(str(getattr(settings, 'RETAIL_FREE_DELIVERY_THRESHOLD', 5000)))
        fee = Decimal(str(getattr(settings, 'RETAIL_DELIVERY_FEE', 100)))
        if self.subtotal >= threshold:
            return Decimal('0.00')
        return fee

    def save(self, *args, **kwargs):
        if not self.delivery_fee:
            self.delivery_fee = self.calculate_delivery_fee()
        self.total = (self.subtotal or Decimal('0.00')) - (self.discount or Decimal('0.00')) + (self.delivery_fee or Decimal('0.00'))
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ['id']

    @property
    def subtotal(self):
        if self.quantity is None or self.price_snapshot is None:
            return Decimal('0.00')
        return self.quantity * self.price_snapshot

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Review(models.Model):
    """A customer review for a product."""

    RATING_CHOICES = [(i, f"{i} star{'s' if i != 1 else ''}") for i in range(1, 6)]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True, help_text="Uncheck to hide review without deleting it")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('product', 'user')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} -> {self.product.name} ({self.rating} stars)"


class NewsletterSubscriber(models.Model):
    """Email addresses captured from the newsletter signup form."""

    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.email
