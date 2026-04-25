import logging
import threading

from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Sum, Avg
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from decimal import Decimal

from .models import (
    Category, Product, Address, Cart, CartItem, Order, OrderItem, UserProfile,
    Review, Coupon, NewsletterSubscriber,
)
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer, AddressSerializer,
    CartSerializer, CartItemSerializer, OrderSerializer, AddToCartSerializer,
    UpdateCartItemSerializer, CheckoutSerializer, UserProfileSerializer, WholesaleRequestSerializer,
    ReviewSerializer, CouponSerializer, NewsletterSubscribeSerializer,
)


logger = logging.getLogger(__name__)


def _send_order_notification_sync(order_id):
    """Compose and send the email. Runs in a background thread."""
    try:
        order = Order.objects.select_related('user', 'address').prefetch_related('items__product').get(pk=order_id)
    except Order.DoesNotExist:
        logger.error("Order %s vanished before notification could be sent", order_id)
        return

    notify_to = getattr(settings, 'ORDER_NOTIFICATION_EMAIL', '')
    if not notify_to:
        return

    address = order.address
    items = order.items.all()
    item_lines = "\n".join(
        f"  - {item.product.name} x {item.quantity} @ Rs. {item.price_snapshot} = Rs. {item.subtotal}"
        for item in items
    )
    coupon_line = f"Coupon:       {order.coupon_code}\nDiscount:     -Rs. {order.discount}\n" if order.coupon_code else ""
    subject = f"New Order #{order.id} - Rs. {order.total} ({order.get_order_type_display()})"
    body = (
        f"A new order has been placed on Apni Dukan.\n\n"
        f"Order ID: #{order.id}\n"
        f"Customer: {order.user.get_full_name() or order.user.username} ({order.user.email or 'no email'})\n"
        f"Order type: {order.get_order_type_display()}\n"
        f"Status: {order.get_status_display()}\n"
        f"Payment: {order.get_payment_method_display()}\n\n"
        f"Delivery Address:\n"
        f"  {address.full_name}\n"
        f"  {address.house_no}, {address.street}\n"
        f"  {address.area}, {address.city}\n"
        f"  Phone: {address.phone}\n"
        + (f"  Notes: {address.notes}\n" if address.notes else "") +
        f"\nItems:\n{item_lines}\n\n"
        f"Subtotal:     Rs. {order.subtotal}\n"
        + coupon_line +
        f"Delivery fee: Rs. {order.delivery_fee}\n"
        f"Total:        Rs. {order.total}\n"
    )
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notify_to],
            fail_silently=False,
        )
    except Exception as exc:  # pragma: no cover - best-effort notification
        logger.exception("Failed to send order notification for order %s: %s", order.id, exc)


def _send_order_notification_async(order_id):
    """Fire-and-forget the email so the API response isn't delayed by SMTP latency."""
    thread = threading.Thread(
        target=_send_order_notification_sync,
        args=(order_id,),
        daemon=True,
    )
    thread.start()


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/m', block=False)
@ratelimit(key='ip', rate='30/h', block=False)
def signup(request):
    """User registration endpoint. Rate-limited: 5/min and 30/hour per IP."""
    if getattr(request, 'limited', False):
        return Response(
            {'error': 'Too many signup attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
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
@ratelimit(key='ip', rate='10/m', block=False)
@ratelimit(key='post:username', rate='5/m', block=False)
def login(request):
    """User login endpoint. Rate-limited: 10/min per IP and 5/min per username."""
    if getattr(request, 'limited', False):
        return Response(
            {'error': 'Too many login attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
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

    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing products with multi-field ranked search."""

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('category')

        category_slug = self.request.query_params.get('category', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        # Multi-field ranked search: searches across name, description, and category.
        # Results that match the product name are ranked higher than description-only matches.
        search = self.request.query_params.get('search', None)
        if search:
            terms = [t for t in search.strip().split() if t]
            if terms:
                term_q = Q()
                for term in terms:
                    term_q &= (
                        Q(name__icontains=term)
                        | Q(description__icontains=term)
                        | Q(category__name__icontains=term)
                    )
                queryset = queryset.filter(term_q).distinct()

                # Approximate relevance: name matches first, then description.
                from django.db.models import Case, When, IntegerField
                first_term = terms[0]
                queryset = queryset.annotate(
                    _rank=Case(
                        When(name__istartswith=first_term, then=0),
                        When(name__icontains=first_term, then=1),
                        When(description__icontains=first_term, then=2),
                        default=3,
                        output_field=IntegerField(),
                    )
                ).order_by('_rank', 'name')

        pricing = self.request.query_params.get('pricing', None)
        if pricing == 'wholesale':
            queryset = queryset.filter(is_wholesale_available=True)

        in_stock = self.request.query_params.get('in_stock')
        if in_stock in {'1', 'true', 'yes'}:
            queryset = queryset.filter(stock_quantity__gt=0)

        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @method_decorator(cache_page(60 * 2))
    @method_decorator(vary_on_headers('Authorization'))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)


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
    
    # Validate minimum order amount
    wholesale_min = Decimal(str(getattr(settings, 'WHOLESALE_MIN_ORDER', 3000)))
    retail_min = Decimal(str(getattr(settings, 'RETAIL_MIN_ORDER', 800)))
    if is_wholesale and subtotal < wholesale_min:
        return Response(
            {'error': f'Minimum order amount for wholesale is Rs. {wholesale_min}. Your order total is Rs. {subtotal}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not is_wholesale and subtotal < retail_min:
        shortfall = retail_min - subtotal
        return Response(
            {'error': f'Minimum order amount is Rs. {retail_min}. Add Rs. {shortfall} more to place this order.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate delivery fee based on order type and configured thresholds
    if order_type == 'WHOLESALE':
        delivery_fee = Decimal('0.00')
    else:
        free_threshold = Decimal(str(getattr(settings, 'RETAIL_FREE_DELIVERY_THRESHOLD', 5000)))
        retail_fee = Decimal(str(getattr(settings, 'RETAIL_DELIVERY_FEE', 100)))
        delivery_fee = Decimal('0.00') if subtotal >= free_threshold else retail_fee

    # Apply coupon if provided
    coupon = None
    discount = Decimal('0.00')
    coupon_code_input = (serializer.validated_data.get('coupon_code') or '').strip().upper()
    if coupon_code_input:
        try:
            coupon = Coupon.objects.get(code=coupon_code_input)
        except Coupon.DoesNotExist:
            return Response({'error': f'Coupon "{coupon_code_input}" is not valid.'}, status=status.HTTP_400_BAD_REQUEST)

        ok, reason = coupon.is_valid_now()
        if not ok:
            return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)
        if subtotal < coupon.min_order_amount:
            return Response(
                {'error': f'This coupon requires a minimum order of Rs. {coupon.min_order_amount}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if coupon.max_uses_per_user:
            user_uses = Order.objects.filter(user=request.user, coupon=coupon).count()
            if user_uses >= coupon.max_uses_per_user:
                return Response(
                    {'error': 'You have already used this coupon the maximum number of times.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        discount = coupon.calculate_discount(subtotal)

    total = subtotal - discount + delivery_fee

    # Create order
    address = Address.objects.get(id=serializer.validated_data['address_id'], user=request.user)
    order = Order.objects.create(
        user=request.user,
        address=address,
        payment_method=serializer.validated_data['payment_method'],
        order_type=order_type,
        subtotal=subtotal,
        discount=discount,
        coupon=coupon,
        coupon_code=coupon.code if coupon else '',
        delivery_fee=delivery_fee,
        total=total,
    )

    # Create order items.
    # Stock will be reduced automatically when order status changes to CONFIRMED (via signal).
    for item_data in order_items_data:
        OrderItem.objects.create(
            order=order,
            product=item_data['product'],
            quantity=item_data['quantity'],
            price_snapshot=item_data['price_snapshot'],
        )

    if coupon:
        Coupon.objects.filter(pk=coupon.pk).update(times_used=coupon.times_used + 1)

    cart_items.delete()

    transaction.on_commit(lambda: _send_order_notification_async(order.id))

    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing user orders"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).select_related('address').prefetch_related('items__product')

    @action(detail=True, methods=['post'], url_path='reorder')
    @transaction.atomic
    def reorder(self, request, pk=None):
        """POST /api/orders/<id>/reorder/ - copy a previous order's items into the cart.

        Skips items where the product is unavailable or out of stock.
        Returns a summary so the UI can show which items were skipped.
        """
        order = get_object_or_404(Order, pk=pk, user=request.user)
        cart, _ = Cart.objects.get_or_create(user=request.user)

        added, skipped = [], []
        for item in order.items.select_related('product').all():
            product = item.product
            if not product.is_active:
                skipped.append({'name': product.name, 'reason': 'Product is no longer available.'})
                continue
            qty = min(item.quantity, product.stock_quantity)
            if qty <= 0:
                skipped.append({'name': product.name, 'reason': 'Out of stock.'})
                continue
            price = product.get_price_for_user(request.user)
            existing = CartItem.objects.filter(cart=cart, product=product).first()
            if existing:
                target_qty = min(existing.quantity + qty, product.stock_quantity)
                existing.quantity = target_qty
                existing.price_snapshot = price
                existing.save()
            else:
                CartItem.objects.create(cart=cart, product=product, quantity=qty, price_snapshot=price)
            added.append({'name': product.name, 'quantity': qty})

        return Response({
            'cart': CartSerializer(cart).data,
            'added': added,
            'skipped': skipped,
        }, status=status.HTTP_200_OK)


class ReviewViewSet(viewsets.ModelViewSet):
    """Customer reviews. Anyone can read, only authenticated users can write their own."""

    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Review.objects.filter(is_approved=True).select_related('user', 'product')
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        # Update if user already reviewed this product, otherwise create.
        Review.objects.update_or_create(
            product=product,
            user=self.request.user,
            defaults={
                'rating': serializer.validated_data['rating'],
                'title': serializer.validated_data.get('title', ''),
                'body': serializer.validated_data.get('body', ''),
            },
        )

    def perform_update(self, serializer):
        review = self.get_object()
        if review.user_id != self.request.user.id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own review.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own review.")
        instance.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_coupon(request):
    """Validate a coupon code against the current cart and return the discount amount."""
    code = (request.data.get('code') or '').strip().upper()
    if not code:
        return Response({'error': 'Please enter a coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        coupon = Coupon.objects.get(code=code)
    except Coupon.DoesNotExist:
        return Response({'error': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)

    ok, reason = coupon.is_valid_now()
    if not ok:
        return Response({'error': reason}, status=status.HTTP_400_BAD_REQUEST)

    cart = Cart.objects.filter(user=request.user).first()
    subtotal = Decimal('0.00')
    if cart:
        for item in cart.items.all():
            subtotal += item.quantity * item.price_snapshot

    if subtotal < coupon.min_order_amount:
        return Response({
            'error': f'This coupon requires a minimum order of Rs. {coupon.min_order_amount}.',
            'min_order_amount': str(coupon.min_order_amount),
            'subtotal': str(subtotal),
        }, status=status.HTTP_400_BAD_REQUEST)

    if coupon.max_uses_per_user:
        user_uses = Order.objects.filter(user=request.user, coupon=coupon).count()
        if user_uses >= coupon.max_uses_per_user:
            return Response(
                {'error': 'You have already used this coupon the maximum number of times.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    discount = coupon.calculate_discount(subtotal)
    return Response({
        'coupon': CouponSerializer(coupon).data,
        'discount': str(discount),
        'subtotal': str(subtotal),
        'new_total_before_delivery': str(subtotal - discount),
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@ratelimit(key='ip', rate='5/h', block=False)
def newsletter_subscribe(request):
    """Subscribe an email to the newsletter list."""
    if getattr(request, 'limited', False):
        return Response(
            {'error': 'Too many subscription attempts. Please try again later.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
    serializer = NewsletterSubscribeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    email = serializer.validated_data['email'].lower().strip()
    sub, created = NewsletterSubscriber.objects.get_or_create(email=email)
    if not created and not sub.is_active:
        sub.is_active = True
        sub.save(update_fields=['is_active'])
        created = True
    return Response({
        'message': "You're subscribed!" if created else "You're already on the list.",
        'email': sub.email,
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Admin-only metrics: revenue, order counts, top products, low stock."""
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

    from django.utils import timezone
    from datetime import timedelta

    today = timezone.now().date()
    last_7 = today - timedelta(days=6)
    last_30 = today - timedelta(days=29)

    orders = Order.objects.exclude(status='CANCELLED')

    totals = {
        'all_time_orders': orders.count(),
        'all_time_revenue': str(orders.aggregate(s=Sum('total'))['s'] or 0),
        'orders_last_7_days': orders.filter(created_at__date__gte=last_7).count(),
        'revenue_last_7_days': str(orders.filter(created_at__date__gte=last_7).aggregate(s=Sum('total'))['s'] or 0),
        'orders_last_30_days': orders.filter(created_at__date__gte=last_30).count(),
        'revenue_last_30_days': str(orders.filter(created_at__date__gte=last_30).aggregate(s=Sum('total'))['s'] or 0),
        'pending_orders': orders.exclude(status='DELIVERED').count(),
    }

    top_products = (
        OrderItem.objects.values('product__id', 'product__name')
        .annotate(qty_sold=Sum('quantity'), revenue=Sum('price_snapshot'))
        .order_by('-qty_sold')[:10]
    )

    low_threshold = getattr(settings, 'LOW_STOCK_THRESHOLD', 5)
    low_stock = Product.objects.filter(
        is_active=True, stock_quantity__lte=low_threshold,
    ).order_by('stock_quantity')[:25].values('id', 'name', 'stock_quantity', 'unit')

    status_counts = {
        choice[0]: orders.filter(status=choice[0]).count()
        for choice in Order.STATUS_CHOICES
    }

    return Response({
        'totals': totals,
        'top_products': list(top_products),
        'low_stock': list(low_stock),
        'orders_by_status': status_counts,
    })


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
