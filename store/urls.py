from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'reviews', views.ReviewViewSet, basename='review')

urlpatterns = [
    path('auth/signup/', views.signup, name='signup'),
    path('auth/login/', views.login, name='login'),
    path('me/', views.get_user_profile, name='user-profile'),
    path('wholesale/request/', views.request_wholesale, name='wholesale-request'),
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/update/<int:cart_item_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/remove/<int:cart_item_id>/', views.remove_cart_item, name='remove-cart-item'),
    path('checkout/', views.checkout, name='checkout'),
    path('coupons/validate/', views.validate_coupon, name='validate-coupon'),
    path('newsletter/subscribe/', views.newsletter_subscribe, name='newsletter-subscribe'),
    path('admin/dashboard-stats/', views.admin_dashboard_stats, name='admin-dashboard-stats'),
    path('', include(router.urls)),
]
