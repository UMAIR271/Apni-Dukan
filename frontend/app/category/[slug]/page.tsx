'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Product } from '@/lib/api';
import Layout from '@/components/Layout';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [slug]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts({ category: slug });
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
        <h1 className="text-2xl font-bold mb-6 text-gray-800 capitalize flex items-center gap-2">
          <span className="text-primary-500">📦</span>
          {slug.replace(/-/g, ' ')}
        </h1>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found in this category</p>
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
                  {product.sale_price ? (
                    <>
                      <span className="text-accent-500 font-bold text-lg">
                        Rs. {parseFloat(product.sale_price).toFixed(2)}
                      </span>
                      <span className="text-gray-400 line-through text-sm">
                        Rs. {parseFloat(product.price).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-800 font-bold text-lg">
                      Rs. {parseFloat(product.price).toFixed(2)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
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
