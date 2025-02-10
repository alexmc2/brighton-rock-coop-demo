import './css/style.css';

import { Inter } from 'next/font/google';
import Theme from '@/providers/members/theme-provider';
import AppProvider from '@/providers/members/app-provider';
import { Toaster } from '@/components/members/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable}`}>
      <Theme>
        <AppProvider>
          <div className="font-inter antialiased bg-slate-50 dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-base md:text-lg">
            {children}
          </div>
          <Toaster />
        </AppProvider>
      </Theme>
    </div>
  );
}
