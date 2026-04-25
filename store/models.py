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
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.status}"

    def calculate_delivery_fee(self):
        """Calculate delivery fee based on order type and subtotal"""
        if self.order_type == 'WHOLESALE':
            return 0  # Free delivery for wholesale
        # Retail rule: free if subtotal >= 800, else 50
        if self.subtotal >= 800:
            return 0
        return 50

    def save(self, *args, **kwargs):
        # Calculate delivery fee if not set
        if not self.delivery_fee:
            self.delivery_fee = self.calculate_delivery_fee()
        # Calculate total
        self.total = self.subtotal + self.delivery_fee
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
