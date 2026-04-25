from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Order, OrderItem, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when a User is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(pre_save, sender=Order)
def handle_order_status_change(sender, instance, **kwargs):
    """Handle stock reduction/restoration when order status changes"""
    if instance.pk:  # Only for existing orders
        try:
            old_order = Order.objects.get(pk=instance.pk)
            old_status = old_order.status
            new_status = instance.status
            
            # If order is being confirmed, reduce stock
            if old_status != 'CONFIRMED' and new_status == 'CONFIRMED':
                for order_item in old_order.items.all():
                    product = order_item.product
                    product.stock_quantity -= order_item.quantity
                    product.save()
            
            # If order is being cancelled and was confirmed, restore stock
            if old_status == 'CONFIRMED' and new_status == 'CANCELLED':
                for order_item in old_order.items.all():
                    product = order_item.product
                    product.stock_quantity += order_item.quantity
                    product.save()
        except Order.DoesNotExist:
            pass
