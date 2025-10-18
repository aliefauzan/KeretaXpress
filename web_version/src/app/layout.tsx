'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import EnhancedNavbar from '@/components/EnhancedNavbar';
import BottomNavigation from '@/components/BottomNavigation';
import Footer from '@/components/Footer';
import SvgPatternBackground from '@/components/SvgPatternBackground';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <html lang="id">
      <head>
        {/* Midtrans Snap Script */}
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-VKxCeQMDEncbnWKA'}
          strategy="beforeInteractive"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            {isAdminRoute ? (
              // Admin routes: No navbar, footer, or SVG background
              <main className="min-h-screen">
                {children}
              </main>
            ) : (
              // Public routes: Full layout with navbar, footer, SVG background
              <SvgPatternBackground className="min-h-screen">
                <EnhancedNavbar />
                <main className="min-h-screen pb-20 pt-20 relative z-10">
                  {children}
                </main>
                <Footer />
                <BottomNavigation />
              </SvgPatternBackground>
            )}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
