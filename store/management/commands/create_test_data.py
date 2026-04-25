from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from store.models import Category, Product, Address, Cart, CartItem, Order, OrderItem
from decimal import Decimal


class Command(BaseCommand):
    help = 'Creates test data for Apni Dukan (Pakistan General Store)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing test data before creating new data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing test data...'))
            # Delete test data (keep admin users)
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            CartItem.objects.all().delete()
            Cart.objects.all().delete()
            Address.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()
            # Delete test users (users with testuser or customer in username)
            User.objects.filter(username__in=['testuser1', 'testuser2', 'customer1']).delete()
            self.stdout.write(self.style.SUCCESS('Existing test data cleared!'))
        
        self.stdout.write(self.style.SUCCESS('Creating Pakistani General Store test data...'))
        
        # Create Categories (Pakistani General Store Categories)
        self.stdout.write('Creating categories...')
        categories_data = [
            {'name': 'Rice & Grains', 'slug': 'rice-grains'},
            {'name': 'Flour & Atta', 'slug': 'flour-atta'},
            {'name': 'Daal & Pulses', 'slug': 'daal-pulses'},
            {'name': 'Spices & Masala', 'slug': 'spices-masala'},
            {'name': 'Cooking Oil & Ghee', 'slug': 'cooking-oil-ghee'},
            {'name': 'Sugar & Salt', 'slug': 'sugar-salt'},
            {'name': 'Tea & Coffee', 'slug': 'tea-coffee'},
            {'name': 'Dairy Products', 'slug': 'dairy-products'},
            {'name': 'Biscuits & Snacks', 'slug': 'biscuits-snacks'},
            {'name': 'Beverages', 'slug': 'beverages'},
            {'name': 'Soap & Detergents', 'slug': 'soap-detergents'},
            {'name': 'Personal Care', 'slug': 'personal-care'},
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
        
        # Create Products (Realistic Pakistani General Store Products)
        self.stdout.write('Creating products...')
        products_data = [
            # Rice & Grains
            {'name': 'Super Basmati Rice (5kg)', 'category': 'rice-grains', 'price': 1250.00, 'sale_price': 1199.00, 'stock': 50, 'unit': 'pack', 'description': 'Premium Super Basmati Rice'},
            {'name': 'Basmati Rice (10kg)', 'category': 'rice-grains', 'price': 2400.00, 'stock': 30, 'unit': 'pack', 'description': 'Fine Basmati Rice'},
            {'name': 'Sella Rice (5kg)', 'category': 'rice-grains', 'price': 1100.00, 'stock': 40, 'unit': 'pack', 'description': 'Parboiled Sella Rice'},
            
            # Flour & Atta
            {'name': 'Chakki Atta (5kg)', 'category': 'flour-atta', 'price': 450.00, 'stock': 60, 'unit': 'pack', 'description': 'Fresh Chakki Ground Wheat Flour'},
            {'name': 'Chakki Atta (10kg)', 'category': 'flour-atta', 'price': 850.00, 'sale_price': 799.00, 'stock': 40, 'unit': 'pack', 'description': 'Fresh Chakki Ground Wheat Flour'},
            {'name': 'Maida (1kg)', 'category': 'flour-atta', 'price': 120.00, 'stock': 80, 'unit': 'pack', 'description': 'All Purpose Flour'},
            
            # Daal & Pulses
            {'name': 'Moong Daal (1kg)', 'category': 'daal-pulses', 'price': 320.00, 'stock': 70, 'unit': 'kg', 'description': 'Yellow Moong Daal'},
            {'name': 'Masoor Daal (1kg)', 'category': 'daal-pulses', 'price': 280.00, 'stock': 65, 'unit': 'kg', 'description': 'Red Masoor Daal'},
            {'name': 'Chana Daal (1kg)', 'category': 'daal-pulses', 'price': 350.00, 'stock': 60, 'unit': 'kg', 'description': 'Split Chickpeas'},
            {'name': 'Arhar Daal (1kg)', 'category': 'daal-pulses', 'price': 380.00, 'stock': 55, 'unit': 'kg', 'description': 'Toor Daal'},
            {'name': 'Black Gram (1kg)', 'category': 'daal-pulses', 'price': 400.00, 'stock': 50, 'unit': 'kg', 'description': 'Urad Daal'},
            
            # Spices & Masala
            {'name': 'Red Chili Powder (200g)', 'category': 'spices-masala', 'price': 180.00, 'stock': 100, 'unit': 'pack', 'description': 'Lal Mirch Powder'},
            {'name': 'Turmeric Powder (200g)', 'category': 'spices-masala', 'price': 150.00, 'stock': 90, 'unit': 'pack', 'description': 'Haldi Powder'},
            {'name': 'Coriander Powder (200g)', 'category': 'spices-masala', 'price': 160.00, 'stock': 85, 'unit': 'pack', 'description': 'Dhania Powder'},
            {'name': 'Cumin Seeds (100g)', 'category': 'spices-masala', 'price': 120.00, 'stock': 95, 'unit': 'pack', 'description': 'Zeera'},
            {'name': 'Garam Masala (100g)', 'category': 'spices-masala', 'price': 200.00, 'stock': 80, 'unit': 'pack', 'description': 'Mixed Spice Blend'},
            {'name': 'Black Pepper (100g)', 'category': 'spices-masala', 'price': 250.00, 'stock': 75, 'unit': 'pack', 'description': 'Kali Mirch'},
            
            # Cooking Oil & Ghee
            {'name': 'Cooking Oil (5 liter)', 'category': 'cooking-oil-ghee', 'price': 1850.00, 'sale_price': 1799.00, 'stock': 45, 'unit': 'liter', 'description': 'Sunflower/Corn Oil'},
            {'name': 'Cooking Oil (1 liter)', 'category': 'cooking-oil-ghee', 'price': 420.00, 'stock': 100, 'unit': 'liter', 'description': 'Sunflower/Corn Oil'},
            {'name': 'Desi Ghee (1kg)', 'category': 'cooking-oil-ghee', 'price': 1200.00, 'stock': 35, 'unit': 'pack', 'description': 'Pure Desi Ghee'},
            {'name': 'Mustard Oil (1 liter)', 'category': 'cooking-oil-ghee', 'price': 450.00, 'stock': 40, 'unit': 'liter', 'description': 'Sarson Ka Tel'},
            
            # Sugar & Salt
            {'name': 'White Sugar (1kg)', 'category': 'sugar-salt', 'price': 180.00, 'stock': 120, 'unit': 'pack', 'description': 'Crystal White Sugar'},
            {'name': 'White Sugar (5kg)', 'category': 'sugar-salt', 'price': 850.00, 'stock': 50, 'unit': 'pack', 'description': 'Crystal White Sugar'},
            {'name': 'Iodized Salt (1kg)', 'category': 'sugar-salt', 'price': 60.00, 'stock': 150, 'unit': 'pack', 'description': 'Namak'},
            {'name': 'Rock Salt (500g)', 'category': 'sugar-salt', 'price': 80.00, 'stock': 70, 'unit': 'pack', 'description': 'Sendha Namak'},
            
            # Tea & Coffee
            {'name': 'Tea Leaves (250g)', 'category': 'tea-coffee', 'price': 350.00, 'stock': 100, 'unit': 'pack', 'description': 'Lipton/Red Label Tea'},
            {'name': 'Tea Leaves (500g)', 'category': 'tea-coffee', 'price': 650.00, 'sale_price': 599.00, 'stock': 60, 'unit': 'pack', 'description': 'Lipton/Red Label Tea'},
            {'name': 'Green Tea (100g)', 'category': 'tea-coffee', 'price': 250.00, 'stock': 50, 'unit': 'pack', 'description': 'Green Tea Bags'},
            {'name': 'Coffee (200g)', 'category': 'tea-coffee', 'price': 550.00, 'stock': 45, 'unit': 'pack', 'description': 'Nescafe/Instant Coffee'},
            
            # Dairy Products
            {'name': 'Fresh Milk (1 liter)', 'category': 'dairy-products', 'price': 200.00, 'stock': 80, 'unit': 'liter', 'description': 'Fresh Full Cream Milk'},
            {'name': 'Yogurt (500g)', 'category': 'dairy-products', 'price': 150.00, 'stock': 70, 'unit': 'pack', 'description': 'Fresh Dahi'},
            {'name': 'Paneer (250g)', 'category': 'dairy-products', 'price': 300.00, 'stock': 40, 'unit': 'pack', 'description': 'Fresh Cottage Cheese'},
            {'name': 'Butter (200g)', 'category': 'dairy-products', 'price': 380.00, 'stock': 50, 'unit': 'pack', 'description': 'Creamy Butter'},
            {'name': 'Eggs (1 dozen)', 'category': 'dairy-products', 'price': 280.00, 'sale_price': 260.00, 'stock': 100, 'unit': 'pack', 'description': 'Farm Fresh Eggs'},
            
            # Biscuits & Snacks
            {'name': 'Marie Biscuits (200g)', 'category': 'biscuits-snacks', 'price': 100.00, 'stock': 120, 'unit': 'pack', 'description': 'Sweet Marie Biscuits'},
            {'name': 'Cream Biscuits (200g)', 'category': 'biscuits-snacks', 'price': 120.00, 'stock': 100, 'unit': 'pack', 'description': 'Assorted Cream Biscuits'},
            {'name': 'Namkeen (200g)', 'category': 'biscuits-snacks', 'price': 80.00, 'stock': 90, 'unit': 'pack', 'description': 'Mixed Namkeen'},
            {'name': 'Chips (150g)', 'category': 'biscuits-snacks', 'price': 90.00, 'stock': 110, 'unit': 'pack', 'description': 'Potato Chips'},
            {'name': 'Rusks (200g)', 'category': 'biscuits-snacks', 'price': 110.00, 'stock': 85, 'unit': 'pack', 'description': 'Sweet Rusks'},
            
            # Beverages
            {'name': 'Soft Drink (1.5 liter)', 'category': 'beverages', 'price': 180.00, 'stock': 80, 'unit': 'liter', 'description': 'Pepsi/Coke'},
            {'name': 'Juice (1 liter)', 'category': 'beverages', 'price': 250.00, 'stock': 60, 'unit': 'liter', 'description': 'Mango/Orange Juice'},
            {'name': 'Mineral Water (1.5 liter)', 'category': 'beverages', 'price': 80.00, 'stock': 200, 'unit': 'liter', 'description': 'Pure Water'},
            {'name': 'Lassi (500ml)', 'category': 'beverages', 'price': 120.00, 'stock': 50, 'unit': 'pack', 'description': 'Sweet Lassi'},
            
            # Soap & Detergents
            {'name': 'Laundry Soap (250g)', 'category': 'soap-detergents', 'price': 60.00, 'stock': 100, 'unit': 'pack', 'description': 'Washing Soap'},
            {'name': 'Detergent Powder (1kg)', 'category': 'soap-detergents', 'price': 350.00, 'stock': 70, 'unit': 'pack', 'description': 'Washing Powder'},
            {'name': 'Dish Soap (500ml)', 'category': 'soap-detergents', 'price': 180.00, 'stock': 80, 'unit': 'pack', 'description': 'Dishwashing Liquid'},
            {'name': 'Bath Soap (4 pieces)', 'category': 'soap-detergents', 'price': 200.00, 'stock': 90, 'unit': 'pack', 'description': 'Body Soap'},
            
            # Personal Care
            {'name': 'Shampoo (400ml)', 'category': 'personal-care', 'price': 450.00, 'stock': 60, 'unit': 'pack', 'description': 'Hair Shampoo'},
            {'name': 'Toothpaste (100g)', 'category': 'personal-care', 'price': 180.00, 'stock': 85, 'unit': 'pack', 'description': 'Toothpaste'},
            {'name': 'Toothbrush', 'category': 'personal-care', 'price': 80.00, 'stock': 100, 'unit': 'pack', 'description': 'Soft Bristle Brush'},
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
            {'username': 'testuser1', 'email': 'testuser1@example.com', 'password': 'testpass123', 'first_name': 'Ahmed', 'last_name': 'Ali'},
            {'username': 'testuser2', 'email': 'testuser2@example.com', 'password': 'testpass123', 'first_name': 'Fatima', 'last_name': 'Khan'},
            {'username': 'customer1', 'email': 'customer1@example.com', 'password': 'customer123', 'first_name': 'Hassan', 'last_name': 'Raza'},
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
                # Create token for the user
                Token.objects.get_or_create(user=user)
                self.stdout.write(f'  Created user: {user.username} (password: {user_data["password"]})')
            else:
                # Ensure token exists even if user already exists
                Token.objects.get_or_create(user=user)
            users.append(user)
        
        # Create Addresses for users (Pakistani addresses)
        self.stdout.write('Creating addresses...')
        addresses_data = [
            {
                'user': 'testuser1',
                'full_name': 'Ahmed Ali',
                'phone': '+923001234567',
                'city': 'Karachi',
                'area': 'Clifton',
                'street': 'Main Street',
                'house_no': '123',
                'notes': 'Ring the bell twice'
            },
            {
                'user': 'testuser1',
                'full_name': 'Ahmed Ali',
                'phone': '+923001234567',
                'city': 'Karachi',
                'area': 'DHA Phase 5',
                'street': 'Street 5',
                'house_no': '45-A',
                'notes': 'Call before delivery'
            },
            {
                'user': 'customer1',
                'full_name': 'Hassan Raza',
                'phone': '+923009876543',
                'city': 'Lahore',
                'area': 'Gulberg',
                'street': 'MM Alam Road',
                'house_no': '789',
                'notes': ''
            },
            {
                'user': 'testuser2',
                'full_name': 'Fatima Khan',
                'phone': '+923005556677',
                'city': 'Islamabad',
                'area': 'F-7',
                'street': 'Jinnah Avenue',
                'house_no': '12-B',
                'notes': 'Gate 2'
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
        
        # Create some cart items for testuser1 (realistic Pakistani shopping cart)
        self.stdout.write('Creating cart items...')
        user1 = User.objects.get(username='testuser1')
        cart, created = Cart.objects.get_or_create(user=user1)
        
        # Add realistic products to cart
        cart_products = [
            {'product': 'Chakki Atta (5kg)', 'quantity': 1},
            {'product': 'Super Basmati Rice (5kg)', 'quantity': 1},
            {'product': 'Moong Daal (1kg)', 'quantity': 1},
            {'product': 'Cooking Oil (1 liter)', 'quantity': 2},
            {'product': 'Tea Leaves (250g)', 'quantity': 1},
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
        
        # Create a sample order for customer1 (realistic Pakistani order)
        self.stdout.write('Creating sample orders...')
        customer1 = User.objects.get(username='customer1')
        address1 = Address.objects.filter(user=customer1).first()
        
        if address1:
            # Create order with realistic Pakistani grocery items
            order_products = [
                {'product': 'Super Basmati Rice (5kg)', 'quantity': 2},
                {'product': 'Chakki Atta (10kg)', 'quantity': 1},
                {'product': 'Cooking Oil (5 liter)', 'quantity': 1},
                {'product': 'Masoor Daal (1kg)', 'quantity': 2},
                {'product': 'Red Chili Powder (200g)', 'quantity': 1},
                {'product': 'Turmeric Powder (200g)', 'quantity': 1},
                {'product': 'Garam Masala (100g)', 'quantity': 1},
                {'product': 'White Sugar (5kg)', 'quantity': 1},
                {'product': 'Iodized Salt (1kg)', 'quantity': 1},
                {'product': 'Tea Leaves (500g)', 'quantity': 1},
                {'product': 'Fresh Milk (1 liter)', 'quantity': 3},
                {'product': 'Eggs (1 dozen)', 'quantity': 2},
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
            
            self.stdout.write(f'  Created order #{order.id} for {customer1.username} (Status: {order.status}, Total: Rs. {total})')
        
        self.stdout.write(self.style.SUCCESS('\nPakistani General Store test data created successfully!'))
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('Test Users & Authentication Tokens:'))
        self.stdout.write('='*60)
        
        for user in users:
            token = Token.objects.get(user=user)
            self.stdout.write(f'\nUsername: {user.username}')
            self.stdout.write(f'Password: {self._get_password(user.username)}')
            self.stdout.write(f'Token: {token.key}')
            self.stdout.write(f'Email: {user.email}')
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('\nYou can use these tokens in API requests:')
        self.stdout.write('  Authorization: Token <token_key>')
        self.stdout.write('\nOr login via: POST /api/auth/login/')
        self.stdout.write('='*60)
    
    def _get_password(self, username):
        """Helper to return password for display"""
        passwords = {
            'testuser1': 'testpass123',
            'testuser2': 'testpass123',
            'customer1': 'customer123',
        }
        return passwords.get(username, 'N/A')
