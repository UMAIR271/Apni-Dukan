const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: {
    account_type: 'RETAIL' | 'WHOLESALE';
    wholesale_approved: boolean;
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
  };
}

export interface UserProfile {
  account_type: 'RETAIL' | 'WHOLESALE';
  wholesale_approved: boolean;
  shop_name?: string;
  shop_address?: string;
  shop_phone?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
}

export interface Product {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string | null;
  effective_price: string;
  display_price: string;
  retail_price: string;
  wholesale_price: string | null;
  wholesale_min_qty: number;
  is_wholesale_available: boolean;
  stock_quantity: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  city: string;
  area: string;
  street: string;
  house_no: string;
  notes: string;
  created_at: string;
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price_snapshot: string;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price_snapshot: string;
  subtotal: string;
}

export interface Order {
  id: number;
  user: number;
  address: number;
  address_details: Address;
  status: string;
  payment_method: string;
  order_type: 'RETAIL' | 'WHOLESALE';
  subtotal: string;
  delivery_fee: string;
  total: string;
  items: OrderItem[];
  created_at: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || error.detail || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async signup(data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ token: string; user: User }> {
    return this.request('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    return this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await this.request<any>('/categories/');
    // Handle paginated responses (Django REST Framework pagination)
    if (Array.isArray(response)) {
      return response;
    }
    // If paginated, return results array
    return response.results || [];
  }

  // Products
  async getProducts(params?: { category?: string; search?: string; pricing?: 'retail' | 'wholesale' }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.pricing) query.append('pricing', params.pricing);
    const queryString = query.toString();
    const response = await this.request<any>(`/products/${queryString ? `?${queryString}` : ''}`);
    // Handle paginated responses (Django REST Framework pagination)
    if (Array.isArray(response)) {
      return response;
    }
    // If paginated, return results array
    return response.results || [];
  }

  async getProduct(id: number): Promise<Product> {
    return this.request(`/products/${id}/`);
  }

  // Cart
  async getCart(): Promise<Cart> {
    return this.request('/cart/');
  }

  async addToCart(productId: number, quantity: number): Promise<Cart> {
    return this.request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(cartItemId: number, quantity: number): Promise<Cart> {
    return this.request(`/cart/update/${cartItemId}/`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeCartItem(cartItemId: number): Promise<Cart> {
    return this.request(`/cart/remove/${cartItemId}/`, {
      method: 'DELETE',
    });
  }

  // Addresses
  async getAddresses(): Promise<Address[]> {
    const response = await this.request<any>('/addresses/');
    // Handle paginated responses (Django REST Framework pagination)
    if (Array.isArray(response)) {
      return response;
    }
    // If paginated, return results array
    return response.results || [];
  }

  async createAddress(data: Omit<Address, 'id' | 'created_at'>): Promise<Address> {
    return this.request('/addresses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Checkout
  async checkout(addressId: number, paymentMethod: string): Promise<Order> {
    return this.request('/checkout/', {
      method: 'POST',
      body: JSON.stringify({ address_id: addressId, payment_method: paymentMethod }),
    });
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const response = await this.request<any>('/orders/');
    // Handle paginated responses (Django REST Framework pagination)
    if (Array.isArray(response)) {
      return response;
    }
    // If paginated, return results array
    return response.results || [];
  }

  async getOrder(id: number): Promise<Order> {
    return this.request(`/orders/${id}/`);
  }

  // User Profile
  async getUserProfile(): Promise<{
    user: User;
    account_type: 'RETAIL' | 'WHOLESALE';
    wholesale_approved: boolean;
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
  }> {
    return this.request('/me/');
  }

  // Wholesale
  async requestWholesale(data?: {
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
  }): Promise<{
    message: string;
    profile: UserProfile;
  }> {
    return this.request('/wholesale/request/', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }
}

export const api = new ApiClient();
