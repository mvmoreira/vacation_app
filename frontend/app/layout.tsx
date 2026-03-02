'use client';

import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <title>Travel Budget App</title>
        <meta name="description" content="Manage your trips, savings, and expenses." />
      </head>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
