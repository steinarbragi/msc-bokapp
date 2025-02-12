import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Bókavélin',
  description: 'Gervigreind sem hjálpar börnum að finna bækur',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className='min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 px-3 py-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
          {children}
        </div>
      </body>
    </html>
  );
}
