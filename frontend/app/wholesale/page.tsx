'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function WholesalePage() {
  const router = useRouter();
  const { accountType, wholesaleApproved, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_address: '',
    shop_phone: '',
  });

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;
  const isPending = accountType === 'WHOLESALE' && !wholesaleApproved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.requestWholesale(formData);
      setSuccess(true);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to submit wholesale request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <span className="text-accent-500">🏪</span> Wholesale Account
            </h1>

            {isWholesale ? (
              <div className="text-center py-8">
                <div className="inline-block px-4 py-2 bg-accent-500 text-white rounded-full mb-4 font-semibold">
                  ✓ Wholesale Account Approved
                </div>
                <p className="text-gray-600 mb-6">
                  You have access to wholesale pricing and benefits!
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-300"
                >
                  Start Shopping
                </button>
              </div>
            ) : isPending ? (
              <div className="text-center py-8">
                <div className="inline-block px-4 py-2 bg-yellow-500 text-white rounded-full mb-4 font-semibold">
                  ⏳ Pending Approval
                </div>
                <p className="text-gray-600 mb-6">
                  Your wholesale account request is pending admin approval. You'll be notified once approved.
                </p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-all duration-300"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-3 text-gray-800">Benefits of Wholesale Account</h2>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">✓</span>
                      <span>Access to wholesale pricing on eligible products</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">✓</span>
                      <span>Free delivery on all orders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">✓</span>
                      <span>Bulk ordering capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">✓</span>
                      <span>Dedicated support for business customers</span>
                    </li>
                  </ul>
                </div>

                {success ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800 font-semibold">
                      ✓ Your wholesale account request has been submitted successfully!
                    </p>
                    <p className="text-green-700 text-sm mt-2">
                      Our team will review your request and notify you once approved.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Shop Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.shop_name}
                        onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your shop name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Shop Address (Optional)
                      </label>
                      <textarea
                        value={formData.shop_address}
                        onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows={3}
                        placeholder="Enter your shop address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Shop Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.shop_phone}
                        onChange={(e) => setFormData({ ...formData, shop_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Enter your shop phone number"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-primary-600 hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Request Wholesale Account
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
