'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Product } from '@/lib/api';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const { accountType, wholesaleApproved } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeType, setStoreType] = useState<'retail' | 'wholesale'>('retail');

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;

  useEffect(() => {
    loadProducts();
  }, [category, search, storeType]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({ 
        category: category || undefined, 
        search: search || undefined,
        pricing: storeType === 'wholesale' ? 'wholesale' : undefined
      });
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          <span className="text-primary-500">🔍</span>
          {search ? `Search Results for "${search}"` : category ? `Category: ${category}` : 'All Products'}
        </h1>

        {/* Store Type Filter */}
        {isWholesale && (
          <div className="mb-6 animate-fadeIn">
            <div className="flex gap-3">
              <button
                onClick={() => setStoreType('retail')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  storeType === 'retail'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Retail Store
              </button>
              <button
                onClick={() => setStoreType('wholesale')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                  storeType === 'wholesale'
                    ? 'bg-accent-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Wholesale Store
              </button>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="product-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {product.image_url ? (
                  <div className="relative overflow-hidden rounded mb-2">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-32 object-cover transition-transform duration-300 hover:scale-110"
                    />
                    {product.sale_price && (
                      <div className="absolute top-2 right-2 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        Sale!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded mb-2 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 hover:text-primary-500 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-primary-600 font-bold text-lg">
                    Rs. {parseFloat(product.display_price).toFixed(2)}
                  </span>
                  {product.wholesale_price && isWholesale && product.is_wholesale_available && (
                    <span className="text-xs text-gray-400 line-through">
                      Rs. {parseFloat(product.retail_price).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
                {isWholesale && product.is_wholesale_available && product.wholesale_min_qty > 1 && (
                  <p className="text-xs text-accent-600 font-semibold mt-1">
                    MOQ: {product.wholesale_min_qty} {product.unit}
                  </p>
                )}
                {product.stock_quantity > 0 ? (
                  <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                    ✓ In Stock
                  </span>
                ) : (
                  <span className="inline-block mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-semibold">
                    Out of Stock
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
