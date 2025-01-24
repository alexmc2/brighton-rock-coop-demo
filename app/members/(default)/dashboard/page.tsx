export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Dashboard - Brighton Rock Housing Co-op',
  description: 'Dashboard for Brighton Rock Housing Co-op members',
};

const roles = [
  {
    name: 'Secretary',
    href: '/members/secretary',
    description: 'Manage meetings, minutes, and communications',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    name: 'Treasury',
    href: '/members/treasury',
    description: 'Handle co-op finances and budgeting',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-pound-sterling"
      >
        <path d="M18 7c0-5.333-8-5.333-8 0" />
        <path d="M10 7v14" />
        <path d="M6 21h12" />
        <path d="M6 13h10" />
      </svg>
    ),
  },
  {
    name: 'Rents',
    href: '/members/rents',
    description: 'Manage rent collection and payments',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    name: 'Garden',
    href: '/members/garden?tab=projects',
    description: 'Coordinate garden maintenance and projects',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-leaf"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    ),
  },
  {
    name: 'Development',
    href: '/members/development',
    description: 'Handle co-op development and outreach',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-rocket"
      >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
  {
    name: 'Shop',
    href: '/members/shop',
    description: 'Manage co-op shop and supplies',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    name: 'Maintenance',
    href: '/members/maintenance',
    description: 'Coordinate repairs and maintenance',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-hammer"
      >
        <path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9" />
        <path d="m18 15 4-4" />
        <path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5" />
      </svg>
    ),
  },
  {
    name: 'Allocations',
    href: '/members/allocations',
    description: 'Manage allocations ',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-house"
      >
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
];

const houses = [
  {
    name: '399',
    href: '/members/houses/399',
    residents: 4,
    status: 'All Good',
    statusColor: 'bg-green-500',
  },
  {
    name: '397',
    href: '/members/houses/397',
    residents: 4,
    status: 'Maintenance Required',
    statusColor: 'bg-yellow-500',
  },
  {
    name: '395',
    href: '/members/houses/395',
    residents: 4,
    status: 'All Good',
    statusColor: 'bg-green-500',
  },
];

export default async function Dashboard() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get user's full name from profiles table
  let name = 'Member';
  if (session?.user?.id) {
    const { data: profile } = await supabase
      .from('demo_profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    if (profile?.full_name) {
      name = profile.full_name;
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8 pt-4 w-full max-w-[96rem] mx-auto">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-tr  from-violet-500 to-violet-400 dark:from-sky-600/70 dark:to-sky-500/70 p-4 sm:p-6 rounded-lg overflow-hidden mb-8">
        {/* Background illustration */}
        <div
          className="absolute right-0 top-0 -mt-4 mr-16 pointer-events-none hidden xl:block"
          aria-hidden="true"
        ></div>

        {/* Content */}
        <div className="relative md:p-2 p-2">
          <h1 className="text-xl md:text-3xl text-slate-50 dark:text-slate-200 font-semibold pb-4 md:pb-4">
            Welcome to the Brighton Rock Co-op Management App, {name} 👋
          </h1>
          <p className="dark:text-slate-300 text-slate-100 text-md md:text-xl ">
            Here&apos;s what&apos;s happening in the co-op today:
          </p>
        </div>
      </div>

      {/* Roles Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-200 mb-6">
          Co-op Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ">
          {roles.map((role) => (
            <Link
              key={role.name}
              href={role.href}
              className="group flex flex-col p-5 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-300/50 dark:border-gray-700 hover:border-slate-100 dark:hover:border-sky-800 transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-sky-500/15 text-violet-600 dark:text-sky-400 group-hover:bg-violet-500 dark:group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300 ease-in-out">
                  {role.icon}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-xl lg:text-xl font-semibold text-gray-600 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-sky-400">
                  {role.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                {role.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Houses Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-200 mb-6">
          Houses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {houses.map((house) => (
            <Link
              key={house.name}
              href={house.href}
              className="group flex flex-col p-5 py-10 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-300/50 dark:border-gray-700 hover:border-slate-100 dark:hover:border-sky-800 transition-all duration-300 ease-in-out hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08)]"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl sm:text-2xl md:text-xl lg:text-xl font-semibold text-gray-600 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-sky-400">
                  {house.name} Kingsway
                </h3>
                <div
                  className={`w-2 h-2 rounded-full ${house.statusColor}`}
                ></div>
              </div>
              <div className="space-y-2"></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
