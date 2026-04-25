'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, logout, user, accountType, wholesaleApproved } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  const isWholesale = accountType === 'WHOLESALE' && wholesaleApproved;

  return (
    <nav className="bg-dark-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center group gap-2">
            <span className="text-2xl flex-shrink-0" aria-hidden="true">🛒</span>
            <span className="text-2xl font-bold transition-all duration-300 group-hover:scale-105">
              <span className="text-primary-500 drop-shadow-lg">Apni</span>{' '}
              <span className="text-accent-500 drop-shadow-lg">Dukan</span>
            </span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {isWholesale && (
                  <span className="hidden sm:inline-block px-2 py-1 bg-accent-500 text-white text-xs font-bold rounded-full">
                    Wholesale
                  </span>
                )}
                <Link
                  href="/cart"
                  className="relative p-2 text-white hover:text-primary-400 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </Link>
                <Link
                  href="/orders"
                  className="p-2 text-white hover:text-primary-400 transition-colors text-sm sm:text-base"
                >
                  Orders
                </Link>
                <div className="relative z-50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="p-2 text-white hover:text-primary-400 transition-colors relative z-50"
                    aria-label="User menu"
                    aria-expanded={showMenu}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </button>
                  {showMenu && (
                    <>
                      {/* Overlay to close menu when clicking outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenu(false)}
                        onTouchStart={() => setShowMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-56 bg-dark-800 rounded-lg shadow-xl py-2 z-[60] border border-dark-700">
                        <div className="px-4 py-3 text-sm text-white border-b border-dark-700">
                          <div className="font-semibold">
                            {user?.first_name || user?.username} {user?.last_name || ''}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{user?.email || 'No email'}</div>
                          {isWholesale && (
                            <span className="inline-block mt-2 px-2 py-1 bg-accent-500 text-white text-xs font-bold rounded-full">
                              ✓ Wholesale Account
                            </span>
                          )}
                          {accountType === 'WHOLESALE' && !wholesaleApproved && (
                            <span className="inline-block mt-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                              ⏳ Pending Approval
                            </span>
                          )}
                        </div>
                        {accountType === 'RETAIL' && (
                          <Link
                            href="/wholesale"
                            className="block px-4 py-2 text-sm text-white hover:bg-dark-700 transition-colors"
                            onClick={() => setShowMenu(false)}
                          >
                            <span className="flex items-center gap-2">
                              <span>🏪</span>
                              <span>Request Wholesale</span>
                            </span>
                          </Link>
                        )}
                        {accountType === 'WHOLESALE' && !wholesaleApproved && (
                          <Link
                            href="/wholesale"
                            className="block px-4 py-2 text-sm text-white hover:bg-dark-700 transition-colors"
                            onClick={() => setShowMenu(false)}
                          >
                            <span className="flex items-center gap-2">
                              <span>⏳</span>
                              <span>View Status</span>
                            </span>
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-dark-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>🚪</span>
                            <span>Logout</span>
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-300 font-semibold transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
