'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.subscribeNewsletter(email.trim());
      setMessage({ type: 'success', text: res.message });
      setEmail('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not subscribe right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-primary-500 to-accent-500 text-white py-8 px-4 mt-10">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-2">Get exclusive offers</h2>
        <p className="text-sm opacity-90 mb-5">
          Subscribe for fresh deals, new arrivals and free-delivery promos straight to your inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 px-4 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/40"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-white text-primary-600 rounded-full font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            {submitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <p
            className={`mt-3 text-sm font-medium ${
              message.type === 'success' ? 'text-white' : 'text-red-100'
            }`}
            aria-live="polite"
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
