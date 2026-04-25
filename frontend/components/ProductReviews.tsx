'use client';

import { useEffect, useState } from 'react';
import { api, Review } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function StarDisplay({ value, max = 5, size = 'md' }: { value: number; max?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base';
  return (
    <span className={`inline-flex ${sizeClass}`} aria-label={`${value} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(value) ? 'text-accent-500' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
        >
          <span className={n <= (hover || value) ? 'text-accent-500' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: number }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.getReviews(productId);
      setReviews(data);
    } catch (err: any) {
      setError(err.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  };

  const myReview = user ? reviews.find((r) => r.user === user.id) : null;
  const avg =
    reviews.length === 0
      ? 0
      : reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please pick a star rating.');
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await api.createReview({ product: productId, rating, title, body });
      setRating(0);
      setTitle('');
      setBody('');
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete your review?')) return;
    try {
      await api.deleteReview(id);
      await load();
    } catch (err: any) {
      setError(err.message || 'Could not delete review.');
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-6 mt-6 border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-accent-500" aria-hidden="true">⭐</span> Customer Reviews
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <StarDisplay value={avg} />
            <span className="text-sm text-gray-600">
              <span className="font-semibold">{avg.toFixed(1)}</span> · {reviews.length} review
              {reviews.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {isAuthenticated && !showForm && !myReview && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-4 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-full shadow transform hover:scale-105 active:scale-95 transition-all"
        >
          ✍️ Write a review
        </button>
      )}

      {isAuthenticated && myReview && !showForm && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-primary-800">
            You&apos;ve reviewed this product. Thanks!
          </span>
          <button
            onClick={() => onDelete(myReview.id)}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            Remove my review
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <p className="mb-4 text-sm text-gray-500">
          <a href="/login" className="text-primary-600 underline">Log in</a> to leave a review.
        </p>
      )}

      {showForm && isAuthenticated && (
        <form
          onSubmit={submit}
          className="mb-6 p-4 border-2 border-primary-200 rounded-xl bg-primary-50/40 space-y-3"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your rating</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            maxLength={200}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Tell others what you thought..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 text-white rounded-lg font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="px-5 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800">{r.user_name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>
              <StarDisplay value={r.rating} size="sm" />
              {r.title && <p className="font-semibold mt-1 text-gray-800">{r.title}</p>}
              {r.body && <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
