'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Product } from '@/lib/api';
import Layout from '@/components/Layout';
import ProductReviews from '@/components/ProductReviews';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductPage() {
  const params = useParams();
  const productId = parseInt(params.id as string);
  const router = useRouter();
  const { isAuthenticated, accountType, wholesaleApproved } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;
  const minQty = product ? (isWholesale && product.is_wholesale_available ? product.wholesale_min_qty : 1) : 1;

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    // Enforce MOQ when product loads or user type changes
    if (product && quantity < minQty) {
      setQuantity(minQty);
    }
  }, [product, minQty]);

  // Per-product page metadata: search engines that execute JS will pick this up,
  // and it gives a much better browser tab title for users.
  useEffect(() => {
    if (!product) return;
    const titleText = `${product.name} - Apni Dukan`;
    document.title = titleText;
    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        const [_, key, value] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
        if (key && value) el.setAttribute(key, value);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };
    const desc = product.description
      ? product.description.slice(0, 160)
      : `${product.name} available on Apni Dukan. Order online with free home delivery on orders over Rs. 5000.`;
    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', titleText);
    setMeta('meta[property="og:description"]', 'content', desc);
    if (product.image_url) {
      setMeta('meta[property="og:image"]', 'content', product.image_url);
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await api.getProduct(productId);
      setProduct(data);
      // Set initial quantity to MOQ if wholesale
      if (isWholesale && data.is_wholesale_available && data.wholesale_min_qty > 1) {
        setQuantity(data.wholesale_min_qty);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    const finalQty = Math.max(minQty, Math.min(product!.stock_quantity, newQuantity));
    setQuantity(finalQty);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (quantity < minQty) {
      setError(`Minimum quantity required: ${minQty} ${product!.unit}`);
      return;
    }

    try {
      setAddingToCart(true);
      setError(null);
      await api.addToCart(productId, quantity);
      router.push('/cart');
    } catch (err: any) {
      setError(err.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
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

  if (error || !product) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-600">Error: {error || 'Product not found'}</div>
        </div>
      </Layout>
    );
  }

  const displayPrice = parseFloat(product.display_price);
  const retailPrice = parseFloat(product.retail_price);
  const wholesalePrice = product.wholesale_price ? parseFloat(product.wholesale_price) : null;
  const showWholesalePrice = isWholesale && product.is_wholesale_available && wholesalePrice;
  const showRetailPrice = !showWholesalePrice || (showWholesalePrice && retailPrice !== displayPrice);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 animate-fadeIn overflow-x-hidden">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 md:flex md:flex-row">
          <div className="md:w-1/2 bg-gradient-to-br from-primary-50 to-accent-50 p-2 sm:p-4">
            {product.image_url ? (
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 sm:h-64 md:h-96 object-cover transition-transform duration-300 hover:scale-105"
                />
                {product.sale_price && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-accent-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg animate-bounce">
                    Sale!
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-40 sm:h-64 md:h-96 bg-gradient-to-br from-primary-100 to-accent-100 rounded-lg flex items-center justify-center shadow-inner">
                <span className="text-4xl sm:text-6xl md:text-8xl">📦</span>
              </div>
            )}
          </div>
          <div className="md:w-1/2 p-3 sm:p-6 md:p-8 flex flex-col">
            <div className="flex-1">
              <div className="mb-2">
                <span className="inline-block px-2 py-1 sm:px-3 sm:py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                  {product.category_name}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 text-gray-800">{product.name}</h1>
              
              <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border-2 border-primary-200">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  {showWholesalePrice ? (
                    <>
                      <div className="flex flex-col">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent-500">
                          Rs. {displayPrice.toFixed(2)}
                        </span>
                        <span className="text-xs text-accent-600 font-semibold">Wholesale Price</span>
                      </div>
                      {showRetailPrice && (
                        <span className="text-sm sm:text-lg md:text-xl text-gray-400 line-through self-end">
                          Rs. {retailPrice.toFixed(2)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {product.sale_price && retailPrice !== displayPrice ? (
                        <>
                          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent-500">
                            Rs. {displayPrice.toFixed(2)}
                          </span>
                          <span className="text-sm sm:text-lg md:text-xl text-gray-400 line-through">
                            Rs. {retailPrice.toFixed(2)}
                          </span>
                          <span className="px-2 py-1 bg-accent-500 text-white text-xs font-bold rounded">
                            Save {((retailPrice - displayPrice) / retailPrice * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-600">
                          Rs. {displayPrice.toFixed(2)}
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">Per {product.unit}</p>
                {showWholesalePrice && product.wholesale_min_qty > 1 && (
                  <p className="text-xs text-accent-600 font-semibold mt-1">
                    MOQ: {product.wholesale_min_qty} {product.unit}
                  </p>
                )}
              </div>

              {product.description && (
                <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base text-gray-800 flex items-center gap-2">
                    <span>📝</span> Description
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{product.description.length > 50 ? `${product.description.substring(0, 50)}...` : product.description}</p>
                </div>
              )}

              <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-white border-2 border-gray-200 rounded-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Stock Status:</span>
                  {product.stock_quantity === 0 ? (
                    <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-red-100 text-red-800">
                      ✗ Out of Stock
                    </span>
                  ) : product.is_low_stock ? (
                    <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-orange-100 text-orange-800 animate-pulse">
                      ⚠️ Only {product.stock_quantity} left!
                    </span>
                  ) : (
                    <span className="px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold bg-green-100 text-green-800">
                      ✓ {product.stock_quantity} available
                    </span>
                  )}
                </div>
                {product.review_count > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-accent-500">
                      {'★'.repeat(Math.round(product.average_rating || 0))}
                      <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.average_rating || 0))}</span>
                    </span>
                    <span className="text-gray-600">
                      {product.average_rating?.toFixed(1)} · {product.review_count} review{product.review_count === 1 ? '' : 's'}
                    </span>
                  </div>
                )}
              </div>

              {product.stock_quantity > 0 && (
                <div className="mb-3 sm:mb-6">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                    Quantity
                    {minQty > 1 && (
                      <span className="ml-2 text-accent-600 text-xs">(Min: {minQty})</span>
                    )}
                  </label>
                  {error && (
                    <div className="mb-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      {error}
                    </div>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= minQty}
                      className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary-300 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 text-primary-600 font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={minQty}
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={(e) => handleQuantityChange(parseInt(e.target.value) || minQty)}
                      className="w-20 sm:w-24 text-center border-2 border-primary-300 rounded-lg py-2 sm:py-3 text-base sm:text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary-300 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 text-primary-600 font-bold text-base sm:text-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 sm:mt-2 text-center">
                    Max: {product.stock_quantity} {product.unit}
                    {minQty > 1 && (
                      <span className="block text-accent-600 font-semibold mt-1">
                        Minimum Order: {minQty} {product.unit}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 md:mt-0">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || addingToCart}
                className="w-full bg-primary-500 text-white py-3 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2 sticky bottom-4 md:static"
              >
                {addingToCart ? (
                  <>
                    <div className="spinner w-4 h-4"></div>
                    Adding...
                  </>
                ) : product.stock_quantity === 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />
      </div>
    </Layout>
  );
}
