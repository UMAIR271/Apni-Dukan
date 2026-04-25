from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from store.models import Category, Product, Address, Cart, CartItem, Order, OrderItem
from decimal import Decimal


class Command(BaseCommand):
    help = 'Creates test data for Apni Dukan'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating test data...'))
        
        # Create Categories
        self.stdout.write('Creating categories...')
        categories_data = [
            {'name': 'Fruits & Vegetables', 'slug': 'fruits-vegetables'},
            {'name': 'Dairy & Eggs', 'slug': 'dairy-eggs'},
            {'name': 'Meat & Seafood', 'slug': 'meat-seafood'},
            {'name': 'Bakery', 'slug': 'bakery'},
            {'name': 'Beverages', 'slug': 'beverages'},
            {'name': 'Snacks & Sweets', 'slug': 'snacks-sweets'},
            {'name': 'Grains & Pulses', 'slug': 'grains-pulses'},
            {'name': 'Spices & Condiments', 'slug': 'spices-condiments'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name'], 'is_active': True}
            )
            categories[cat_data['slug']] = category
            if created:
                self.stdout.write(f'  Created category: {category.name}')
        
        # Create Products
        self.stdout.write('Creating products...')
        products_data = [
            # Fruits & Vegetables
            {'name': 'Fresh Apples (1kg)', 'category': 'fruits-vegetables', 'price': 150.00, 'sale_price': 130.00, 'stock': 50, 'unit': 'kg', 'description': 'Fresh red apples, locally sourced'},
            {'name': 'Bananas (1 dozen)', 'category': 'fruits-vegetables', 'price': 80.00, 'stock': 100, 'unit': 'pack', 'description': 'Ripe yellow bananas'},
            {'name': 'Tomatoes (1kg)', 'category': 'fruits-vegetables', 'price': 120.00, 'stock': 75, 'unit': 'kg', 'description': 'Fresh red tomatoes'},
            {'name': 'Onions (1kg)', 'category': 'fruits-vegetables', 'price': 100.00, 'stock': 200, 'unit': 'kg', 'description': 'White onions'},
            {'name': 'Potatoes (1kg)', 'category': 'fruits-vegetables', 'price': 90.00, 'stock': 150, 'unit': 'kg', 'description': 'Fresh potatoes'},
            {'name': 'Spinach (250g)', 'category': 'fruits-vegetables', 'price': 50.00, 'stock': 60, 'unit': 'pack', 'description': 'Fresh green spinach'},
            
            # Dairy & Eggs
            {'name': 'Fresh Milk (1 liter)', 'category': 'dairy-eggs', 'price': 180.00, 'stock': 100, 'unit': 'liter', 'description': 'Full cream milk'},
            {'name': 'Eggs (1 dozen)', 'category': 'dairy-eggs', 'price': 250.00, 'sale_price': 230.00, 'stock': 80, 'unit': 'pack', 'description': 'Farm fresh eggs'},
            {'name': 'Butter (250g)', 'category': 'dairy-eggs', 'price': 350.00, 'stock': 40, 'unit': 'pack', 'description': 'Pure butter'},
            {'name': 'Yogurt (500g)', 'category': 'dairy-eggs', 'price': 150.00, 'stock': 70, 'unit': 'pack', 'description': 'Plain yogurt'},
            {'name': 'Cheese (200g)', 'category': 'dairy-eggs', 'price': 450.00, 'stock': 30, 'unit': 'pack', 'description': 'Cheddar cheese'},
            
            # Meat & Seafood
            {'name': 'Chicken Breast (1kg)', 'category': 'meat-seafood', 'price': 650.00, 'stock': 25, 'unit': 'kg', 'description': 'Fresh chicken breast'},
            {'name': 'Beef Mince (1kg)', 'category': 'meat-seafood', 'price': 850.00, 'stock': 20, 'unit': 'kg', 'description': 'Fresh beef mince'},
            {'name': 'Fish (1kg)', 'category': 'meat-seafood', 'price': 700.00, 'stock': 15, 'unit': 'kg', 'description': 'Fresh fish'},
            
            # Bakery
            {'name': 'White Bread (1 loaf)', 'category': 'bakery', 'price': 80.00, 'stock': 50, 'unit': 'pack', 'description': 'Fresh white bread'},
            {'name': 'Brown Bread (1 loaf)', 'category': 'bakery', 'price': 90.00, 'stock': 40, 'unit': 'pack', 'description': 'Whole wheat bread'},
            {'name': 'Croissant (pack of 4)', 'category': 'bakery', 'price': 200.00, 'stock': 30, 'unit': 'pack', 'description': 'Buttery croissants'},
            
            # Beverages
            {'name': 'Orange Juice (1 liter)', 'category': 'beverages', 'price': 250.00, 'stock': 60, 'unit': 'liter', 'description': 'Fresh orange juice'},
            {'name': 'Mineral Water (1.5 liter)', 'category': 'beverages', 'price': 80.00, 'stock': 200, 'unit': 'liter', 'description': 'Pure mineral water'},
            {'name': 'Tea (250g)', 'category': 'beverages', 'price': 350.00, 'stock': 100, 'unit': 'pack', 'description': 'Premium tea leaves'},
            {'name': 'Coffee (200g)', 'category': 'beverages', 'price': 550.00, 'sale_price': 500.00, 'stock': 50, 'unit': 'pack', 'description': 'Ground coffee'},
            
            # Snacks & Sweets
            {'name': 'Biscuits (200g)', 'category': 'snacks-sweets', 'price': 120.00, 'stock': 80, 'unit': 'pack', 'description': 'Assorted biscuits'},
            {'name': 'Chocolate Bar', 'category': 'snacks-sweets', 'price': 150.00, 'stock': 100, 'unit': 'pack', 'description': 'Milk chocolate bar'},
            {'name': 'Chips (150g)', 'category': 'snacks-sweets', 'price': 100.00, 'stock': 90, 'unit': 'pack', 'description': 'Potato chips'},
            
            # Grains & Pulses
            {'name': 'Basmati Rice (5kg)', 'category': 'grains-pulses', 'price': 1200.00, 'stock': 40, 'unit': 'pack', 'description': 'Premium basmati rice'},
            {'name': 'Lentils (1kg)', 'category': 'grains-pulses', 'price': 250.00, 'stock': 60, 'unit': 'kg', 'description': 'Red lentils'},
            {'name': 'Chickpeas (1kg)', 'category': 'grains-pulses', 'price': 300.00, 'stock': 50, 'unit': 'kg', 'description': 'Dried chickpeas'},
            
            # Spices & Condiments
            {'name': 'Salt (500g)', 'category': 'spices-condiments', 'price': 50.00, 'stock': 150, 'unit': 'pack', 'description': 'Iodized salt'},
            {'name': 'Black Pepper (100g)', 'category': 'spices-condiments', 'price': 200.00, 'stock': 70, 'unit': 'pack', 'description': 'Ground black pepper'},
            {'name': 'Turmeric Powder (200g)', 'category': 'spices-condiments', 'price': 150.00, 'stock': 80, 'unit': 'pack', 'description': 'Pure turmeric powder'},
        ]
        
        products = []
        for prod_data in products_data:
            product, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults={
                    'category': categories[prod_data['category']],
                    'price': Decimal(str(prod_data['price'])),
                    'sale_price': Decimal(str(prod_data.get('sale_price', 0))) if prod_data.get('sale_price') else None,
                    'stock_quantity': prod_data['stock'],
                    'unit': prod_data['unit'],
                    'description': prod_data.get('description', ''),
                    'is_active': True,
                }
            )
            products.append(product)
            if created:
                self.stdout.write(f'  Created product: {product.name}')
        
        # Create Test Users
        self.stdout.write('Creating test users...')
        test_users = [
            {'username': 'testuser1', 'email': 'testuser1@example.com', 'password': 'testpass123', 'first_name': 'Test', 'last_name': 'User 1'},
            {'username': 'testuser2', 'email': 'testuser2@example.com', 'password': 'testpass123', 'first_name': 'Test', 'last_name': 'User 2'},
            {'username': 'customer1', 'email': 'customer1@example.com', 'password': 'customer123', 'first_name': 'John', 'last_name': 'Doe'},
        ]
        
        users = []
        for user_data in test_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'  Created user: {user.username} (password: {user_data["password"]})')
            users.append(user)
        
        # Create Addresses for users
        self.stdout.write('Creating addresses...')
        addresses_data = [
            {
                'user': 'testuser1',
                'full_name': 'Test User 1',
                'phone': '+923001234567',
                'city': 'Karachi',
                'area': 'Clifton',
                'street': 'Main Street',
                'house_no': '123',
                'notes': 'Ring the bell twice'
            },
            {
                'user': 'testuser1',
                'full_name': 'Test User 1',
                'phone': '+923001234567',
                'city': 'Karachi',
                'area': 'DHA Phase 5',
                'street': 'Street 5',
                'house_no': '45-A',
                'notes': 'Call before delivery'
            },
            {
                'user': 'customer1',
                'full_name': 'John Doe',
                'phone': '+923009876543',
                'city': 'Lahore',
                'area': 'Gulberg',
                'street': 'MM Alam Road',
                'house_no': '789',
                'notes': ''
            },
        ]
        
        for addr_data in addresses_data:
            user = User.objects.get(username=addr_data['user'])
            address, created = Address.objects.get_or_create(
                user=user,
                city=addr_data['city'],
                area=addr_data['area'],
                house_no=addr_data['house_no'],
                defaults={
                    'full_name': addr_data['full_name'],
                    'phone': addr_data['phone'],
                    'street': addr_data['street'],
                    'notes': addr_data['notes'],
                }
            )
            if created:
                self.stdout.write(f'  Created address for {user.username}: {addr_data["city"]}, {addr_data["area"]}')
        
        # Create some cart items for testuser1
        self.stdout.write('Creating cart items...')
        user1 = User.objects.get(username='testuser1')
        cart, created = Cart.objects.get_or_create(user=user1)
        
        # Add some products to cart
        cart_products = [
            {'product': 'Fresh Apples (1kg)', 'quantity': 2},
            {'product': 'Eggs (1 dozen)', 'quantity': 1},
            {'product': 'Fresh Milk (1 liter)', 'quantity': 2},
        ]
        
        for cart_prod in cart_products:
            product = Product.objects.get(name=cart_prod['product'])
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={
                    'quantity': cart_prod['quantity'],
                    'price_snapshot': product.effective_price,
                }
            )
            if created:
                self.stdout.write(f'  Added {product.name} to cart for {user1.username}')
        
        # Create a sample order for customer1
        self.stdout.write('Creating sample orders...')
        customer1 = User.objects.get(username='customer1')
        address1 = Address.objects.filter(user=customer1).first()
        
        if address1:
            # Create order with some items
            order_products = [
                {'product': 'Basmati Rice (5kg)', 'quantity': 1},
                {'product': 'Chicken Breast (1kg)', 'quantity': 2},
                {'product': 'Fresh Milk (1 liter)', 'quantity': 3},
            ]
            
            subtotal = Decimal('0.00')
            order_items_data = []
            
            for order_prod in order_products:
                product = Product.objects.get(name=order_prod['product'])
                quantity = order_prod['quantity']
                price = product.effective_price
                subtotal += quantity * price
                order_items_data.append({
                    'product': product,
                    'quantity': quantity,
                    'price_snapshot': price,
                })
            
            delivery_fee = Decimal('0.00') if subtotal >= 800 else Decimal('50.00')
            total = subtotal + delivery_fee
            
            order = Order.objects.create(
                user=customer1,
                address=address1,
                status='CONFIRMED',
                payment_method='COD',
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total=total,
            )
            
            for item_data in order_items_data:
                OrderItem.objects.create(
                    order=order,
                    product=item_data['product'],
                    quantity=item_data['quantity'],
                    price_snapshot=item_data['price_snapshot'],
                )
            
            self.stdout.write(f'  Created order #{order.id} for {customer1.username} (Status: {order.status})')
        
        self.stdout.write(self.style.SUCCESS('\nTest data created successfully!'))
        self.stdout.write('\nTest Users:')
        self.stdout.write('  - testuser1 / testpass123')
        self.stdout.write('  - testuser2 / testpass123')
        self.stdout.write('  - customer1 / customer123')
        self.stdout.write('\nYou can now login with these credentials to test the API.')
