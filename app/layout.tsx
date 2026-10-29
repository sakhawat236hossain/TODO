import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClientNest — CRM & Task Tracker',
  description: 'Personal CRM and task tracker for client hunting and follow-ups.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <div className="md:pl-64">
            <MobileNav />
            <main className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
          </div>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
