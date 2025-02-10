
// app/members/(default)/treasury/layout.tsx
import { Metadata } from 'next'
import TreasuryLayoutClient from './treasury-layout-client'

export const metadata: Metadata = {
  title: 'Treasury',
}

export default function TreasuryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // SERVER layout for the top-level Treasury section.
  // This will show the big 4 tabs (Bookkeeping, Accounts, Budgeting, Expenses).

  return (
    <div className="px-2 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="mb-8 ">
        <h1 className="text-2xl  md:text-3xl text-slate-700 dark:text-slate-300 font-bold  items-center">
          Treasury 💷
        </h1>
        <p className="sm:text-sm text-xs text-slate-500 dark:text-slate-400 mt-2">
          Manage co-op finances, budgeting, and expense claims
        </p>
      </div>

      {/* 
        1) Delegate the actual tab highlighting to a small client component
        2) Then render {children} below 
      */}
      <TreasuryLayoutClient>
        {children}
      </TreasuryLayoutClient>
    </div>
  )
}
