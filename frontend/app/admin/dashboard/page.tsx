'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, DashboardStats } from '@/lib/api';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  PACKED: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span aria-hidden="true">📊</span> Admin Dashboard
            </h1>
            <Link
              href="/admin/"
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Open Django admin →
            </Link>
          </div>

          {loading && <p className="text-gray-500">Loading…</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
              {error.toLowerCase().includes('permission') && (
                <p className="text-xs text-red-600 mt-1">
                  Tip: this page is for staff users only.
                </p>
              )}
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Revenue (all time)"
                  value={`Rs. ${parseFloat(stats.totals.all_time_revenue).toFixed(0)}`}
                  hint={`${stats.totals.all_time_orders} orders`}
                />
                <StatCard
                  label="Last 7 days"
                  value={`Rs. ${parseFloat(stats.totals.revenue_last_7_days).toFixed(0)}`}
                  hint={`${stats.totals.orders_last_7_days} orders`}
                />
                <StatCard
                  label="Last 30 days"
                  value={`Rs. ${parseFloat(stats.totals.revenue_last_30_days).toFixed(0)}`}
                  hint={`${stats.totals.orders_last_30_days} orders`}
                />
                <StatCard
                  label="Pending"
                  value={String(stats.totals.pending_orders)}
                  hint="Not yet delivered"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <section className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Orders by status</h2>
                  <ul className="space-y-2">
                    {Object.entries(stats.orders_by_status).map(([key, count]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            STATUS_COLORS[key] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-gray-800">{count}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span aria-hidden="true">⚠️</span> Low stock
                  </h2>
                  {stats.low_stock.length === 0 ? (
                    <p className="text-sm text-gray-500">Everything looks well stocked.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {stats.low_stock.map((p) => (
                        <li key={p.id} className="py-2 flex items-center justify-between">
                          <Link
                            href={`/product/${p.id}`}
                            className="text-sm text-gray-800 hover:text-primary-600 truncate mr-2"
                          >
                            {p.name}
                          </Link>
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold whitespace-nowrap">
                            {p.stock_quantity} {p.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <section className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Top selling products</h2>
                {stats.top_products.length === 0 ? (
                  <p className="text-sm text-gray-500">No sales yet.</p>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-200">
                        <th className="py-2">Product</th>
                        <th className="py-2 text-right">Quantity sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_products.map((p) => (
                        <tr key={p.product__id} className="border-b border-gray-100 last:border-b-0">
                          <td className="py-2 text-gray-800">
                            <Link href={`/product/${p.product__id}`} className="hover:text-primary-600">
                              {p.product__name}
                            </Link>
                          </td>
                          <td className="py-2 text-right font-semibold text-gray-800">{p.qty_sold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
