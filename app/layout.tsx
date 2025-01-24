import React from 'react';
import { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import '../styles/globals.css';
import { Roboto } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode } from 'react';

// Initialize the Roboto font
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Brighton Rock Housing Co-operative',
  description:
    'Brighton Rock is a small housing co-operative in West Hove that provides affordable housing to its members. Please visit our website for more information and current vacancies.',
  openGraph: {
    title: 'Brighton Rock Housing Co-operative',
    description:
      'Brighton Rock is a small housing co-operative in West Hove that provides affordable housing to its members. Please visit our website for more information and current vacancies.',
    url: 'https://brighton-rock-coop-demo.vercel.app/',
    siteName: 'Brighton Rock Housing Co-operative',
    images: [
      {
        url: 'https://d33wubrfki0l68.cloudfront.net/45dc7e2de3f6be14d03156f17331b5b091c918ab/cfeab/images/co-op50.webp',
        width: 800,
        height: 600,
        alt: 'Brighton Rock Housing Co-operative',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brighton Rock Housing Co-operative',
    description:
      'Brighton Rock is a small housing co-operative in West Hove that provides affordable housing to its members. Please visit our website for more information and current vacancies.',
    images: [
      'https://d33wubrfki0l68.cloudfront.net/45dc7e2de3f6be14d03156f17331b5b091c918ab/cfeab/images/co-op50.webp',
    ],
  },
  metadataBase: new URL('https://brighton-rock-coop-demo.vercel.app'),
  icons: {
    icon: '/images/favicon.ico',
  },

  other: {
    'og:title': 'Brighton Rock Housing Co-operative',
    'og:description':
      'Brighton Rock is a small housing co-operative in West Hove that provides affordable housing to its members. Please visit our website for more information and current vacancies.',
    'og:image':
      'https://d33wubrfki0l68.cloudfront.net/45dc7e2de3f6be14d03156f17331b5b091c918ab/cfeab/images/co-op50.webp',
    'og:url': 'https://brighton-rock-coop-demo.vercel.app/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className} suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            {children}
            <Analytics />
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
