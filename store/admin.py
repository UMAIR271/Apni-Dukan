from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, Product, Address, Cart, CartItem, Order, OrderItem, UserProfile,
    Review, Coupon, NewsletterSubscriber,
)


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
            'fields': ('image', 'image_preview_large', 'image_url'),
            'description': 'Upload an image OR paste an external image URL. The uploaded file takes priority.',
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
    list_display = ['id', 'user', 'order_type', 'status', 'payment_method', 'subtotal', 'discount', 'delivery_fee', 'total', 'created_at']
    list_filter = ['order_type', 'status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'address__full_name', 'coupon_code']
    readonly_fields = ['subtotal', 'discount', 'delivery_fee', 'total', 'coupon_code', 'created_at']
    inlines = [OrderItemInline]

    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'address', 'order_type', 'status', 'payment_method')
        }),
        ('Financial Information', {
            'fields': ('subtotal', 'discount', 'coupon', 'coupon_code', 'delivery_fee', 'total')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'min_order_amount',
                    'is_active', 'times_used', 'max_uses_total', 'valid_until']
    list_filter = ['is_active', 'discount_type']
    search_fields = ['code', 'description']
    readonly_fields = ['times_used', 'created_at']

    fieldsets = (
        (None, {
            'fields': ('code', 'description', 'is_active'),
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_value', 'min_order_amount', 'max_discount_amount'),
            'description': 'For PERCENT, use a value like 10 (= 10%). For FLAT, use a Rupee amount.',
        }),
        ('Usage limits', {
            'fields': ('max_uses_total', 'max_uses_per_user', 'times_used'),
        }),
        ('Validity period', {
            'fields': ('valid_from', 'valid_until'),
        }),
        ('Timestamps', {
            'fields': ('created_at',),
        }),
    )


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'title', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'rating', 'created_at']
    search_fields = ['product__name', 'user__username', 'title', 'body']
    list_editable = ['is_approved']
    readonly_fields = ['created_at']


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['email']
    readonly_fields = ['created_at']
    actions = ['mark_inactive', 'mark_active']

    def mark_inactive(self, request, queryset):
        queryset.update(is_active=False)
    mark_inactive.short_description = "Unsubscribe selected emails"

    def mark_active(self, request, queryset):
        queryset.update(is_active=True)
    mark_active.short_description = "Re-activate selected emails"
