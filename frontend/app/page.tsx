'use client';

import { useState, useEffect } from 'react';
import { api, Category, Product } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import NewsletterSignup from '@/components/NewsletterSignup';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeType, setStoreType] = useState<'retail' | 'wholesale'>('retail');
  const router = useRouter();
  const { accountType, wholesaleApproved } = useAuth();

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;

  useEffect(() => {
    loadData();
  }, [storeType]);

  // Debounced search-as-you-type suggestions.
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const results = await api.getProducts({
          search: q,
          pricing: storeType === 'wholesale' ? 'wholesale' : undefined,
        });
        setSuggestions(results.slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [searchQuery, storeType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [catsData, prodsData] = await Promise.all([
        api.getCategories(),
        api.getProducts({ pricing: storeType === 'wholesale' ? 'wholesale' : undefined }),
      ]);
      setCategories(catsData);
      setProducts(prodsData.slice(0, 12));
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
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
        {/* Search Bar */}
        <div className="mb-6 animate-fadeIn">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-3 pl-12 pr-16 border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
            />
            <svg
              className="absolute left-4 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <button
              onClick={handleSearch}
              className="absolute right-2 p-2 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-110 active:scale-95 transition-all duration-300"
              title="Search"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/product/${s.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 transition-colors"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-9 h-9 rounded object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-lg">
                        📦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">{s.category_name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary-600">
                      Rs. {parseFloat(s.display_price).toFixed(0)}
                    </span>
                  </Link>
                ))}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSearch}
                  className="w-full px-4 py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  See all results for &quot;{searchQuery.trim()}&quot; →
                </button>
              </div>
            )}
          </div>
        </div>

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

        {/* Categories */}
        <div className="mb-8 animate-fadeIn">
          <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <span className="text-primary-500 text-2xl">📦</span> 
            <span>Categories</span>
          </h2>
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="category-card flex-shrink-0 snap-center min-w-[120px]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-2 shadow-lg mx-auto transform hover:rotate-12 hover:scale-110 transition-all duration-300 bg-gradient-primary flex items-center justify-center">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🛒</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 text-center whitespace-nowrap">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
            {/* Scroll indicator */}
            {categories.length > 4 && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-l from-white via-white to-transparent w-20 h-full pointer-events-none flex items-center justify-end pr-2">
                <span className="text-primary-500 animate-pulse">→</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Products */}
        <div className="animate-fadeIn">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-accent-500">⭐</span> Featured Products
            </h2>
            <Link
              href="/products"
              className="text-primary-500 hover:text-primary-600 font-medium transition-colors duration-300 transform hover:scale-105"
            >
              View All →
            </Link>
          </div>
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
                      className={`w-full h-32 object-cover transition-transform duration-300 hover:scale-110 ${
                        product.stock_quantity === 0 ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    {product.stock_quantity === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Out of Stock
                        </span>
                      </div>
                    )}
                    {product.stock_quantity > 0 && product.is_low_stock && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow animate-pulse">
                        Only {product.stock_quantity} left
                      </div>
                    )}
                    {product.sale_price && product.stock_quantity > 0 && (
                      <div className="absolute top-2 right-2 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                        Sale!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded mb-2 flex items-center justify-center transition-transform duration-300 hover:scale-110 relative">
                    <span className="text-4xl">📦</span>
                    {product.stock_quantity === 0 && (
                      <span className="absolute bottom-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    )}
                  </div>
                )}
                <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 hover:text-primary-500 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2">
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
                {product.review_count > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="text-accent-500">★</span>{' '}
                    <span className="font-semibold">{product.average_rating?.toFixed(1)}</span>{' '}
                    <span className="text-gray-400">({product.review_count})</span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <NewsletterSignup />
    </Layout>
  );
}
