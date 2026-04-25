'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrderStatusTracker from '@/components/OrderStatusTracker';

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = parseInt(params.id as string);
  const router = useRouter();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderMsg, setReorderMsg] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await api.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PLACED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-yellow-100 text-yellow-800',
      PACKED: 'bg-purple-100 text-purple-800',
      OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleReorder = async () => {
    if (!order) return;
    try {
      setReordering(true);
      setReorderMsg(null);
      const res = await api.reorder(order.id);
      if (res.added.length === 0) {
        setReorderMsg('No items could be added to your cart (everything is unavailable or out of stock).');
        return;
      }
      const skippedNote = res.skipped.length > 0 ? ` Skipped ${res.skipped.length} item(s).` : '';
      setReorderMsg(`Added ${res.added.length} item(s) to your cart.${skippedNote}`);
      setTimeout(() => router.push('/cart'), 600);
    } catch (err: any) {
      setReorderMsg(err.message || 'Could not reorder right now.');
    } finally {
      setReordering(false);
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

  if (error || !order) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-600">Error: {error || 'Order not found'}</div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-primary-500 hover:text-primary-600"
          >
            ← Back to Orders
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 animate-fadeIn">
            <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Order #{order.id}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <span>📅</span> Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(
                  order.status
                )}`}
              >
                {formatStatus(order.status)}
              </span>
            </div>

            <div className="mb-4">
              <OrderStatusTracker status={order.status} />
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={handleReorder}
                disabled={reordering}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                {reordering ? 'Adding to cart...' : '🔁 Reorder these items'}
              </button>
            </div>
            {reorderMsg && (
              <div className="mb-4 bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg text-sm">
                {reorderMsg}
              </div>
            )}

            <div className="border-t-2 border-gray-200 pt-4">
              <h2 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
                <span className="text-primary-500">📍</span> Delivery Address
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-800 font-semibold mb-2">{order.address_details.full_name}</p>
                <p className="text-gray-600 mb-1 flex items-center gap-2">
                  <span>📞</span> {order.address_details.phone}
                </p>
                <p className="text-gray-600 mb-1 flex items-start gap-2">
                  <span>🏠</span> 
                  <span>{order.address_details.house_no}, {order.address_details.street}</span>
                </p>
                <p className="text-gray-600 flex items-start gap-2">
                  <span>📍</span> 
                  <span>{order.address_details.area}, {order.address_details.city}</span>
                </p>
                {order.address_details.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Note:</span> {order.address_details.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-500">🛍️</span> Order Items
            </h2>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="flex justify-between items-center border-b-2 border-gray-200 pb-4 last:border-b-0 animate-fadeIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: <span className="font-semibold">{item.quantity}</span> × Rs. {parseFloat(item.price_snapshot).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-primary-600 min-w-[100px] text-right">
                    Rs. {parseFloat(item.subtotal).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-lg p-6 border-2 border-primary-200 animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-primary-500">💰</span> Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-semibold text-lg">Rs. {parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {parseFloat(order.discount || '0') > 0 && (
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-green-700 font-medium flex items-center gap-1">
                    🏷️ Coupon{order.coupon_code ? ` (${order.coupon_code})` : ''}
                  </span>
                  <span className="font-semibold text-lg text-green-700">
                    -Rs. {parseFloat(order.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Delivery Fee</span>
                <span className="font-semibold text-lg">
                  {parseFloat(order.delivery_fee) === 0 ? (
                    <span className="text-green-600 bg-green-100 px-3 py-1 rounded-full">Free</span>
                  ) : (
                    `Rs. ${parseFloat(order.delivery_fee).toFixed(2)}`
                  )}
                </span>
              </div>
            </div>
            <div className="border-t-2 border-primary-300 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-primary-600">Rs. {parseFloat(order.total).toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t-2 border-gray-200">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-semibold">Payment Method:</span>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-bold">
                  {order.payment_method}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
