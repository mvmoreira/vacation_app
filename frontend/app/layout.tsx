import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Budget App',
  description: 'Manage your trips, savings, and expenses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
