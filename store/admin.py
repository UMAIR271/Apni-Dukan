from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, Address, Cart, CartItem, Order, OrderItem, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'account_type', 'wholesale_approved', 'shop_name', 'shop_phone', 'created_at']
    list_filter = ['account_type', 'wholesale_approved', 'created_at']
    search_fields = ['user__username', 'user__email', 'shop_name', 'shop_phone']
    readonly_fields = ['created_at', 'updated_at']
    list_editable = ['wholesale_approved']

    fieldsets = (
        ('User Information', {
            'fields': ('user', 'account_type')
        }),
        ('Wholesale Information', {
            'fields': ('wholesale_approved', 'shop_name', 'shop_address', 'shop_phone')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['image_preview', 'name', 'slug', 'is_active', 'created_at']
    list_display_links = ['image_preview', 'name']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['image_preview_large']

    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'is_active')
        }),
        ('Image', {
            'fields': ('image', 'image_preview_large'),
            'description': 'Upload a category image (PNG/JPG). Optional.',
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;border-radius:6px;object-fit:cover;" />',
                obj.image.url,
            )
        return '—'
    image_preview.short_description = 'Image'

    def image_preview_large(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height:200px;max-width:200px;border-radius:8px;object-fit:cover;" />',
                obj.image.url,
            )
        return 'No image uploaded yet.'
    image_preview_large.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'image_preview', 'name', 'category', 'price', 'sale_price', 'wholesale_price',
        'wholesale_min_qty', 'is_wholesale_available', 'stock_quantity', 'unit',
        'is_active', 'created_at',
    ]
    list_display_links = ['image_preview', 'name']
    list_filter = ['category', 'is_active', 'is_wholesale_available', 'unit', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'image_preview_large']

    fieldsets = (
        ('Basic Information', {
            'fields': ('category', 'name', 'slug', 'description', 'is_active')
        }),
        ('Image', {
            'fields': ('image', 'image_preview_large', 'image_url'),
            'description': 'Upload an image OR paste an external image URL. The uploaded file takes priority.',
        }),
        ('Retail Pricing', {
            'fields': ('price', 'sale_price')
        }),
        ('Wholesale Pricing', {
            'fields': ('is_wholesale_available', 'wholesale_price', 'wholesale_min_qty')
        }),
        ('Inventory', {
            'fields': ('stock_quantity', 'unit')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )

    def image_preview(self, obj):
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html(
                '<img src="{}" style="height:40px;width:40px;border-radius:6px;object-fit:cover;" />',
                url,
            )
        return '—'
    image_preview.short_description = 'Image'

    def image_preview_large(self, obj):
        url = obj.image.url if obj.image else obj.image_url
        if url:
            return format_html(
                '<img src="{}" style="max-height:200px;max-width:200px;border-radius:8px;object-fit:cover;" />',
                url,
            )
        return 'No image yet.'
    image_preview_large.short_description = 'Preview'


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'city', 'area', 'phone', 'created_at']
    list_filter = ['city', 'created_at']
    search_fields = ['full_name', 'phone', 'city', 'area']
    readonly_fields = ['created_at']


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price_snapshot', 'subtotal']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at']
    inlines = [CartItemInline]
    readonly_fields = ['created_at']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'price_snapshot', 'subtotal']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'order_type', 'status', 'payment_method', 'subtotal', 'delivery_fee', 'total', 'created_at']
    list_filter = ['order_type', 'status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'address__full_name']
    readonly_fields = ['subtotal', 'delivery_fee', 'total', 'created_at']
    inlines = [OrderItemInline]

    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'address', 'order_type', 'status', 'payment_method')
        }),
        ('Financial Information', {
            'fields': ('subtotal', 'delivery_fee', 'total')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
