'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 overflow-x-hidden">{children}</main>
    </>
  );
}
