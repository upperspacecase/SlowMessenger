import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/lib/context';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Slow Messenger',
  description: 'Letters, not messages. Your words arrive once a day.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F5F0E8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
