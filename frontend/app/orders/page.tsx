'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);
  const [reorderMessage, setReorderMessage] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleReorder = async (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    try {
      setReorderingId(orderId);
      setReorderMessage(null);
      const res = await api.reorder(orderId);
      if (res.added.length === 0) {
        setReorderMessage('No items could be added (everything is unavailable or out of stock).');
        return;
      }
      const skippedNote = res.skipped.length > 0 ? ` Skipped ${res.skipped.length} item(s).` : '';
      setReorderMessage(`Added ${res.added.length} item(s) to your cart.${skippedNote}`);
      setTimeout(() => router.push('/cart'), 600);
    } catch (err: any) {
      setReorderMessage(err.message || 'Could not reorder right now.');
    } finally {
      setReorderingId(null);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <span className="text-primary-500">📦</span> My Orders
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No orders yet</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                🛒 Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 animate-fadeIn transform hover:scale-105"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-1">Order #{order.id}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span>📅</span> {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold shadow-md ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </div>

                  <div className="mb-4 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-semibold">{order.items.length}</span> item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <span>📍</span> {order.address_details.area}, {order.address_details.city}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
                    <div>
                      <p className="text-sm text-gray-600">
                        Payment: <span className="font-semibold">{order.payment_method}</span>
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary-600">
                      Rs. {parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => handleReorder(e, order.id)}
                      disabled={reorderingId === order.id}
                      className="px-4 py-2 text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 rounded-full font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {reorderingId === order.id ? 'Adding...' : '🔁 Reorder'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {reorderMessage && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-5 py-3 rounded-full shadow-2xl text-sm z-50">
              {reorderMessage}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
