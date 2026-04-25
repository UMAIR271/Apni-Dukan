'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 overflow-x-hidden">{children}</main>
      <WhatsAppButton />
    </>
  );
}
