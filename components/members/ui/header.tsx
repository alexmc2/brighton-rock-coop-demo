'use client';

import { useState } from 'react';
import { useAppProvider } from '@/providers/members/app-provider';

import SearchModal from '@/components/members/search-modal';
import Notifications from '@/components/members/dropdown-notifications';
import DropdownHelp from '@/components/members/dropdown-help';
import ThemeToggle from '@/components/members/theme-toggle';
import DropdownProfile from '@/components/members/ui/dropdown-profile';

export default function Header({
  variant = 'default',
}: {
  variant?: 'default' | 'v2' | 'v3';
}) {
  const { sidebarOpen, setSidebarOpen } = useAppProvider();
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);

  return (
    <header
      className={`sticky top-0 before:absolute before:inset-0 before:backdrop-blur-md max-lg:before:bg-slate-50/90 dark:max-lg:before:bg-slate-900/90 before:-z-10 z-30 ${
        variant === 'v2' || variant === 'v3'
          ? 'before:bg-slate-50 dark:before:bg-slate-900 after:absolute after:h-px after:inset-x-0 after:top-full after:bg-slate-200 dark:after:bg-slate-700/60 after:-z-10'
          : 'max-lg:shadow-sm lg:before:bg-slate-50/90 dark:lg:before:bg-slate-900/90'
      } ${variant === 'v2' ? 'dark:before:bg-slate-900' : ''} ${
        variant === 'v3' ? 'dark:before:bg-slate-900' : ''
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between h-16 ${
            variant === 'v2' || variant === 'v3'
              ? ''
              : ''
          }`}
        >
          {/* Header: Left side */}
          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
              }}
            >
              <span className="sr-only">Open sidebar</span>
              <svg
                className="w-6 h-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            <div>
              <button
                className={`w-8 h-8 flex items-center justify-center hover:bg-slate-100 lg:hover:bg-slate-200 dark:hover:bg-slate-700/50 dark:lg:hover:bg-slate-800 rounded-full ml-3 ${
                  searchModalOpen && 'bg-slate-200 dark:bg-slate-800'
                }`}
                onClick={() => {
                  setSearchModalOpen(true);
                }}
              >
                <span className="sr-only">Search</span>
                <svg
                  className="fill-current text-slate-500/80 dark:text-slate-300/80"
                  width={16}
                  height={16}
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7ZM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5Z" />
                  <path d="m13.314 11.9 2.393 2.393a.999.999 0 1 1-1.414 1.414L11.9 13.314a8.019 8.019 0 0 0 1.414-1.414Z" />
                </svg>
              </button>
              <SearchModal
                isOpen={searchModalOpen}
                setIsOpen={setSearchModalOpen}
              />
            </div>
            {/* <Notifications align="right" />
            <DropdownHelp align="right" /> */}
            <ThemeToggle />
            {/*  Divider */}
            <hr className="w-px h-6 bg-slate-200 dark:bg-slate-700/60 border-none" />
            <DropdownProfile align="end" />
          </div>
        </div>
      </div>
    </header>
  );
}
