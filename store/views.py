from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q
from decimal import Decimal

from .models import Category, Product, Address, Cart, CartItem, Order, OrderItem, UserProfile
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer, AddressSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, AddToCartSerializer,
    UpdateCartItemSerializer, CheckoutSerializer, UserProfileSerializer, WholesaleRequestSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    """User registration endpoint"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User login endpoint"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username and password:
        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing products with filtering"""
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True)
        
        # Filter by category slug
        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Filter by pricing type (retail/wholesale)
        pricing = self.request.query_params.get('pricing', None)
        if pricing == 'wholesale':
            queryset = queryset.filter(is_wholesale_available=True)
        
        return queryset
    
    def get_serializer_context(self):
        """Add request to serializer context for user-based pricing"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class AddressViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user addresses"""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CartView(generics.RetrieveAPIView):
    """Get current user's cart"""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """Add product to cart with wholesale pricing support"""
    serializer = AddToCartSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    product_id = serializer.validated_data['product_id']
    quantity = serializer.validated_data['quantity']
    
    product = Product.objects.get(id=product_id, is_active=True)
    
    # Check stock availability
    if product.stock_quantity < quantity:
        return Response(
            {'error': f'Insufficient stock. Available: {product.stock_quantity}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check minimum quantity for wholesale
    min_qty = product.get_min_qty_for_user(request.user)
    if quantity < min_qty:
        return Response(
            {'error': f'Minimum quantity required: {min_qty} {product.unit}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cart, created = Cart.objects.get_or_create(user=request.user)
    # Use user-specific pricing
    price_snapshot = product.get_price_for_user(request.user)
    
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity, 'price_snapshot': price_snapshot}
    )
    
    if not created:
        # Update quantity if item already exists
        new_quantity = cart_item.quantity + quantity
        if product.stock_quantity < new_quantity:
            return Response(
                {'error': f'Insufficient stock. Available: {product.stock_quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Check minimum quantity for updated total
        if new_quantity < min_qty:
            return Response(
                {'error': f'Minimum quantity required: {min_qty} {product.unit}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        cart_item.quantity = new_quantity
        cart_item.price_snapshot = price_snapshot  # Update price snapshot
        cart_item.save()
    
    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item(request, cart_item_id):
    """Update cart item quantity with wholesale pricing support"""
    cart_item = get_object_or_404(CartItem, id=cart_item_id, cart__user=request.user)
    
    serializer = UpdateCartItemSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    quantity = serializer.validated_data['quantity']
    
    # Check stock availability
    if cart_item.product.stock_quantity < quantity:
        return Response(
            {'error': f'Insufficient stock. Available: {cart_item.product.stock_quantity}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check minimum quantity for wholesale
    min_qty = cart_item.product.get_min_qty_for_user(request.user)
    if quantity < min_qty:
        return Response(
            {'error': f'Minimum quantity required: {min_qty} {cart_item.product.unit}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    cart_item.quantity = quantity
    # Update price snapshot with user-specific pricing
    cart_item.price_snapshot = cart_item.product.get_price_for_user(request.user)
    cart_item.save()
    
    cart = cart_item.cart
    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_cart_item(request, cart_item_id):
    """Remove item from cart"""
    cart_item = get_object_or_404(CartItem, id=cart_item_id, cart__user=request.user)
    cart_item.delete()
    
    cart = Cart.objects.get(user=request.user)
    return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def checkout(request):
    """Create order from cart with wholesale support"""
    serializer = CheckoutSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    cart = Cart.objects.get(user=request.user)
    cart_items = cart.items.all()
    
    if not cart_items.exists():
        return Response(
            {'error': 'Cart is empty'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Determine order type
    profile = getattr(request.user, 'profile', None)
    is_wholesale = profile and profile.is_wholesale_customer
    order_type = 'WHOLESALE' if is_wholesale else 'RETAIL'
    
    # Validate stock and calculate subtotal
    subtotal = Decimal('0.00')
    order_items_data = []
    
    for cart_item in cart_items:
        product = cart_item.product
        
        # Check stock availability
        if product.stock_quantity < cart_item.quantity:
            return Response(
                {'error': f'Insufficient stock for {product.name}. Available: {product.stock_quantity}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate minimum quantity for wholesale
        if is_wholesale and product.is_wholesale_available:
            min_qty = product.wholesale_min_qty
            if cart_item.quantity < min_qty:
                return Response(
                    {'error': f'Minimum quantity for {product.name}: {min_qty} {product.unit}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        item_subtotal = cart_item.quantity * cart_item.price_snapshot
        subtotal += item_subtotal
        
        order_items_data.append({
            'product': product,
            'quantity': cart_item.quantity,
            'price_snapshot': cart_item.price_snapshot,
        })
    
    # Validate minimum order for wholesale
    WHOLESALE_MIN_ORDER = Decimal('3000.00')
    if is_wholesale and subtotal < WHOLESALE_MIN_ORDER:
        return Response(
            {'error': f'Minimum order amount for wholesale is Rs. {WHOLESALE_MIN_ORDER}. Your order total is Rs. {subtotal}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate delivery fee based on order type
    if order_type == 'WHOLESALE':
        delivery_fee = Decimal('0.00')  # Free delivery for wholesale
    else:
        # Retail rule: free if subtotal >= 800, else 50
        delivery_fee = Decimal('0.00') if subtotal >= Decimal('800.00') else Decimal('50.00')
    
    total = subtotal + delivery_fee
    
    # Create order
    address = Address.objects.get(id=serializer.validated_data['address_id'], user=request.user)
    order = Order.objects.create(
        user=request.user,
        address=address,
        payment_method=serializer.validated_data['payment_method'],
        order_type=order_type,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
    )
    
    # Create order items
    # Stock will be reduced automatically when order status changes to CONFIRMED (via signal)
    for item_data in order_items_data:
        OrderItem.objects.create(
            order=order,
            product=item_data['product'],
            quantity=item_data['quantity'],
            price_snapshot=item_data['price_snapshot'],
        )
    
    # Clear cart
    cart_items.delete()
    
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing user orders"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user profile with account type and wholesale status"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    return Response({
        'user': UserSerializer(request.user).data,
        'account_type': profile.account_type,
        'wholesale_approved': profile.wholesale_approved,
        'shop_name': profile.shop_name,
        'shop_address': profile.shop_address,
        'shop_phone': profile.shop_phone,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_wholesale(request):
    """Request wholesale account access"""
    serializer = WholesaleRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Update account type to WHOLESALE (pending approval)
    profile.account_type = 'WHOLESALE'
    profile.wholesale_approved = False  # Reset approval status
    
    # Update shop details if provided
    if serializer.validated_data.get('shop_name'):
        profile.shop_name = serializer.validated_data['shop_name']
    if serializer.validated_data.get('shop_address'):
        profile.shop_address = serializer.validated_data['shop_address']
    if serializer.validated_data.get('shop_phone'):
        profile.shop_phone = serializer.validated_data['shop_phone']
    
    profile.save()
    
    return Response({
        'message': 'Wholesale account request submitted. Waiting for admin approval.',
        'profile': UserProfileSerializer(profile).data
    }, status=status.HTTP_200_OK)
