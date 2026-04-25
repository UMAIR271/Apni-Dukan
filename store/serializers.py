from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Category, Product, Address, Cart, CartItem, Order, OrderItem, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['account_type', 'wholesale_approved', 'shop_name', 'shop_address', 'shop_phone', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        Token.objects.create(user=user)
        return user


def _resolve_image(request, file_field, fallback_url=None):
    """Return absolute URL for an uploaded image, falling back to an external URL."""
    if file_field:
        url = file_field.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url
    return fallback_url or None


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image_url', 'is_active']

    def get_image_url(self, obj):
        return _resolve_image(self.context.get('request'), obj.image)


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    display_price = serializers.SerializerMethodField()
    retail_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    wholesale_price = serializers.SerializerMethodField()
    wholesale_min_qty = serializers.IntegerField(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'name', 'slug', 'description',
            'price', 'sale_price', 'effective_price', 'display_price',
            'retail_price', 'wholesale_price', 'wholesale_min_qty',
            'is_wholesale_available', 'stock_quantity',
            'unit', 'image_url', 'is_active', 'created_at'
        ]

    def get_image_url(self, obj):
        return _resolve_image(self.context.get('request'), obj.image, obj.image_url)
    
    def get_display_price(self, obj):
        """Return price based on user type"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_price_for_user(request.user)
        return obj.effective_price
    
    def get_retail_price(self, obj):
        """Return retail price (effective_price)"""
        return obj.effective_price
    
    def get_wholesale_price(self, obj):
        """Return wholesale price only if user is approved wholesale customer"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if hasattr(request.user, 'profile') and request.user.profile.is_wholesale_customer:
                return obj.wholesale_price if obj.is_wholesale_available else None
        return None


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'full_name', 'phone', 'city', 'area', 'street', 'house_no', 'notes', 'created_at']
        read_only_fields = ['created_at']


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price_snapshot', 'subtotal']

    def get_product_image(self, obj):
        return _resolve_image(self.context.get('request'), obj.product.image, obj.product.image_url)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'created_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_snapshot', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    address_details = AddressSerializer(source='address', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'address', 'address_details', 'status', 'payment_method',
            'order_type', 'subtotal', 'delivery_fee', 'total', 'items', 'created_at'
        ]
        read_only_fields = ['user', 'subtotal', 'delivery_fee', 'total', 'created_at', 'order_type']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
            if product.stock_quantity <= 0:
                raise serializers.ValidationError("Product is out of stock")
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default='COD')

    def validate_address_id(self, value):
        try:
            Address.objects.get(id=value, user=self.context['request'].user)
            return value
        except Address.DoesNotExist:
            raise serializers.ValidationError("Address not found")


class WholesaleRequestSerializer(serializers.Serializer):
    shop_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shop_address = serializers.CharField(required=False, allow_blank=True)
    shop_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
