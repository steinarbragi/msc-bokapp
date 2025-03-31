import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { BookProvider } from './context/BookContext';
import Image from 'next/image';

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
  metadataBase: new URL('https://bokai.vercel.app'),

  description: 'Gervigreind sem hjálpar börnum að finna bækur',
  openGraph: {
    images: '/bokavel-meta.jpg',
  },
  twitter: {
    card: 'summary_large_image',
    images: '/bokavel-meta.jpg',
  },
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
        <BookProvider>
          <div className='min-h-screen bg-gradient-to-b from-blue-100 via-purple-100 to-pink-100 px-3 py-10 font-[family-name:var(--font-geist-sans)] sm:p-20'>
            {children}
            <Image
              src='/hi/logo/Tákn blátt.svg'
              alt='Háskóli Íslands'
              width={100}
              height={100}
              className='mx-auto mt-6 sm:mt-10'
            />
          </div>
        </BookProvider>
      </body>
    </html>
  );
}
