'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Address, Cart } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { accountType, wholesaleApproved } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;

  // New address form
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    city: '',
    area: '',
    street: '',
    house_no: '',
    notes: '',
  });

  useEffect(() => {
    loadAddresses();
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (err: any) {
      console.error('Failed to load cart:', err);
    }
  };

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await api.getAddresses();
      // Ensure data is an array
      const addressesArray = Array.isArray(data) ? data : [];
      setAddresses(addressesArray);
      if (addressesArray.length > 0) {
        setSelectedAddressId(addressesArray[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async () => {
    try {
      const address = await api.createAddress(newAddress);
      setAddresses([...addresses, address]);
      setSelectedAddressId(address.id);
      setShowNewAddress(false);
      setNewAddress({
        full_name: '',
        phone: '',
        city: '',
        area: '',
        street: '',
        house_no: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or create an address');
      return;
    }

    try {
      setPlacingOrder(true);
      setError(null);
      const order = await api.checkout(selectedAddressId, paymentMethod);
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <span className="text-primary-500">💳</span> Checkout
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Address Selection */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-500">📍</span> Delivery Address
            </h2>
            
            {Array.isArray(addresses) && addresses.length > 0 ? (
              addresses.map((address, index) => (
              <label
                key={address.id}
                className={`block border-2 rounded-xl p-4 mb-3 cursor-pointer transition-all duration-300 animate-fadeIn ${
                  selectedAddressId === address.id
                    ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-accent-50 shadow-lg transform scale-105'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-1 w-5 h-5 text-primary-500 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 mb-1">{address.full_name}</p>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <span>📞</span> {address.phone}
                    </p>
                    <p className="text-sm text-gray-600 mb-1 flex items-start gap-1">
                      <span>🏠</span> 
                      <span>{address.house_no}, {address.street}, {address.area}, {address.city}</span>
                    </p>
                    {address.notes && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-100 p-2 rounded">
                        <span className="font-semibold">Note:</span> {address.notes}
                      </p>
                    )}
                  </div>
                </div>
              </label>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No addresses found</p>
                <p className="text-sm text-gray-400">Please add an address below</p>
              </div>
            )}

            {!showNewAddress ? (
              <button
                onClick={() => setShowNewAddress(true)}
                className="w-full border-2 border-dashed border-primary-300 rounded-xl p-4 text-primary-600 hover:border-primary-500 hover:bg-primary-50 font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="text-xl">➕</span> Add New Address
                </span>
              </button>
            ) : (
              <div className="border-2 border-primary-500 rounded-xl p-6 mt-4 bg-gradient-to-br from-primary-50 to-white animate-fadeIn">
                <h3 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="text-primary-500">✏️</span> New Address
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.full_name}
                    onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Area"
                    value={newAddress.area}
                    onChange={(e) => setNewAddress({ ...newAddress, area: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Street"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="House No"
                    value={newAddress.house_no}
                    onChange={(e) => setNewAddress({ ...newAddress, house_no: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <textarea
                    placeholder="Notes (optional)"
                    value={newAddress.notes}
                    onChange={(e) => setNewAddress({ ...newAddress, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleCreateAddress}
                      className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Address
                    </button>
                    <button
                      onClick={() => {
                        setShowNewAddress(false);
                        setNewAddress({
                          full_name: '',
                          phone: '',
                          city: '',
                          area: '',
                          street: '',
                          house_no: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-semibold transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-500">💳</span> Payment Method
            </h2>
            <div className="space-y-3">
              {['COD', 'JAZZCASH', 'EASYPAISA'].map((method, index) => (
                <label
                  key={method}
                  className={`block border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 animate-fadeIn ${
                    paymentMethod === method
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-accent-50 shadow-lg transform scale-105'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">
                      {method === 'COD' && '💵 Cash on Delivery'}
                      {method === 'JAZZCASH' && '📱 JazzCash'}
                      {method === 'EASYPAISA' && '📱 EasyPaisa'}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          {cart && (
            <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-primary-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                <span>💰</span> Order Summary
                {isWholesale && (
                  <span className="ml-auto px-3 py-1 bg-accent-500 text-white text-xs font-bold rounded-full">
                    Wholesale Order
                  </span>
                )}
              </h2>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Subtotal</span>
                  <span className="font-semibold text-lg">Rs. {parseFloat(cart.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-gray-600 font-medium">Delivery Fee</span>
                  <span className="font-semibold text-lg">
                    {isWholesale ? (
                      <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">Free</span>
                    ) : parseFloat(cart.total) >= 800 ? (
                      <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">Free</span>
                    ) : (
                      `Rs. 50.00`
                    )}
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-primary-300 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    Rs. {(parseFloat(cart.total) + (isWholesale ? 0 : parseFloat(cart.total) >= 800 ? 0 : 50)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId}
            className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2"
          >
            {placingOrder ? (
              <>
                <div className="spinner w-5 h-5"></div>
                Placing Order...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Place Order
              </>
            )}
          </button>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
