'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Cart, CouponValidation } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { accountType, wholesaleApproved } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;
  // Business rules - keep in sync with backend settings
  const RETAIL_MIN_ORDER = 800;
  const RETAIL_FREE_DELIVERY_THRESHOLD = 5000;
  const RETAIL_DELIVERY_FEE = 100;
  const WHOLESALE_MIN_ORDER = 3000;

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const data = await api.getCart();
      setCart(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    try {
      setUpdating(itemId);
      const updatedCart = await api.updateCartItem(itemId, newQuantity);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err.message || 'Failed to update cart');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      setUpdating(itemId);
      const updatedCart = await api.removeCartItem(itemId);
      setCart(updatedCart);
    } catch (err: any) {
      setError(err.message || 'Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cart ? parseFloat(cart.total) : 0;
  const discount = appliedCoupon ? parseFloat(appliedCoupon.discount) : 0;
  // Re-evaluate the free-delivery threshold after the coupon discount.
  const subtotalAfterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = isWholesale
    ? 0
    : (subtotalAfterDiscount >= RETAIL_FREE_DELIVERY_THRESHOLD ? 0 : RETAIL_DELIVERY_FEE);
  const total = subtotalAfterDiscount + deliveryFee;
  const minOrderRequired = isWholesale ? WHOLESALE_MIN_ORDER : RETAIL_MIN_ORDER;
  const meetsMinimumOrder = subtotal >= minOrderRequired;
  const minOrderShortfall = meetsMinimumOrder ? 0 : minOrderRequired - subtotal;
  const amountForFreeDelivery = !isWholesale && subtotalAfterDiscount > 0 && subtotalAfterDiscount < RETAIL_FREE_DELIVERY_THRESHOLD
    ? RETAIL_FREE_DELIVERY_THRESHOLD - subtotalAfterDiscount
    : 0;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    try {
      setCouponLoading(true);
      setCouponError(null);
      const result = await api.validateCoupon(code);
      setAppliedCoupon(result);
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Could not apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('apni_coupon');
    }
  };

  // Persist the applied coupon code so the checkout page can read it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (appliedCoupon) {
      sessionStorage.setItem('apni_coupon', appliedCoupon.coupon.code);
    } else {
      sessionStorage.removeItem('apni_coupon');
    }
  }, [appliedCoupon]);

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-600">Error: {error}</div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center gap-2">
            <span className="text-primary-500">🛒</span> Shopping Cart
          </h1>

          {!cart || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 border border-gray-100 overflow-x-hidden">
                {cart.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="border-b border-gray-200 py-3 sm:py-4 last:border-b-0 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1 truncate">{item.product_name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Rs. {parseFloat(item.price_snapshot).toFixed(2)} per unit
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 w-full sm:w-auto justify-between sm:justify-start">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={updating === item.id}
                          className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary-300 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 text-primary-600 font-bold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          −
                        </button>
                        <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id}
                          className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary-300 rounded-lg flex items-center justify-center hover:bg-primary-50 hover:border-primary-500 text-primary-600 font-bold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto sm:text-right gap-4">
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-base sm:text-lg text-gray-800">
                            Rs. {parseFloat(item.subtotal).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updating === item.id}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium hover:underline disabled:opacity-50 transition-all duration-300 flex-shrink-0"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-lg p-4 sm:p-6 border-2 border-primary-200 overflow-x-hidden">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center gap-2">
                  <span>💰</span> Order Summary
                </h2>
                {/* Coupon */}
                <div className="mb-3 sm:mb-4 p-3 border-2 border-dashed border-primary-200 rounded-lg bg-white/60">
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <span aria-hidden="true">🏷️</span> Have a promo code?
                  </p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="text-sm text-green-800 min-w-0">
                        <span className="font-bold">{appliedCoupon.coupon.code}</span> applied — saved Rs.{' '}
                        {parseFloat(appliedCoupon.discount).toFixed(2)}
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-red-600 hover:text-red-700 underline font-semibold flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        placeholder="WELCOME200"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase tracking-wide"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
                      >
                        {couponLoading ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}
                </div>

                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Subtotal</span>
                    <span className="font-semibold text-base sm:text-lg">Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-200">
                      <span className="text-sm sm:text-base text-green-700 font-medium">
                        Discount ({appliedCoupon?.coupon.code})
                      </span>
                      <span className="font-semibold text-base sm:text-lg text-green-700">
                        -Rs. {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-sm sm:text-base text-gray-600 font-medium">Delivery Fee</span>
                    <span className="font-semibold text-base sm:text-lg">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 bg-green-100 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">Free</span>
                      ) : (
                        `Rs. ${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  {!meetsMinimumOrder && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm text-red-700 font-semibold text-center">
                        ⚠️ Minimum order is Rs. {minOrderRequired.toFixed(2)}. Add Rs. {minOrderShortfall.toFixed(2)} more to place this order.
                      </p>
                    </div>
                  )}
                  {meetsMinimumOrder && amountForFreeDelivery > 0 && (
                    <div className="bg-accent-50 border-2 border-accent-200 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm text-accent-700 font-semibold text-center">
                        🎁 Add Rs. {amountForFreeDelivery.toFixed(2)} more for free home delivery!
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-t-2 border-primary-300 pt-3 sm:pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-800">Total</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-600">Rs. {total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/checkout')}
                  disabled={!meetsMinimumOrder}
                  className="w-full mt-4 sm:mt-6 bg-primary-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {meetsMinimumOrder ? 'Proceed to Checkout' : `Add Rs. ${minOrderShortfall.toFixed(2)} More`}
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
