'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function Logo() {
  const [showLogo, setShowLogo] = useState(false);

  useEffect(() => {
    // Check if logo exists on client side only
    const img = new Image();
    img.onload = () => setShowLogo(true);
    img.onerror = () => setShowLogo(false);
    img.src = '/logo.png';
  }, []);

  return (
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto relative">
      <span className={`text-3xl ${showLogo ? 'hidden' : 'block'}`}>🛒</span>
      <img
        src="/logo.png"
        alt="Apni Dukan Logo"
        className={`w-12 h-12 object-contain absolute inset-0 m-auto ${showLogo ? 'block' : 'hidden'}`}
        onError={() => setShowLogo(false)}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    router.push('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-primary-500">Apni</span>{' '}
            <span className="text-accent-500">Dukan</span>
          </h1>
          <h2 className="text-xl font-semibold text-gray-800">Welcome Back!</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Enter your password"
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
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary-500 hover:text-primary-600 font-semibold transition-colors">
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
