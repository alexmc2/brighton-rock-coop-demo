'use client';

import React, { useState, useCallback } from 'react';
import { useSelectedYear } from '@/app/members/(default)/treasury/budgets/budgets-provider';
import { getYearRange } from '@/app/members/(default)/treasury/budgets/utils';
import { Button } from '@/components/members/ui/button';
import { Progress } from '@/components/members/ui/progress';
import {
  Table,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/members/ui/table';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/members/ui/select';
import {
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/members/ui/card';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Exactly like in budget-reports/page.tsx
export interface DetailedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string;
  category_name: string;
  is_expense: boolean;
}

interface OverviewItem {
  categoryId: string;
  categoryName: string;
  isExpense: boolean;
  budget: number;
  spent: number;
  // NEW: an array of transactions
  transactions: DetailedTransaction[];
}

interface Props {
  items: OverviewItem[];
  initialYear: number;
  error?: string;
  warning?: string;
  selectedMonth: number | undefined;
}

export default function BudgetOverviewClient({
  items,
  initialYear,
  error,
  warning,
  selectedMonth: initialSelectedMonth,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pull from the shared context
  const { selectedYear, setSelectedYear } = useSelectedYear();
  const [viewMode, setViewMode] = useState<'bars' | 'table'>('table');
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    initialSelectedMonth
  );

  // Update URL when month changes
  const updateUrlWithFilters = useCallback(
    (year: number, month?: number) => {
      const params = new URLSearchParams(searchParams);
      params.set('year', year.toString());
      if (month) {
        params.set('month', month.toString());
      } else {
        params.delete('month');
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  // Handle month change
  const handleMonthChange = (val: string) => {
    const newMonth = val === 'all' ? undefined : Number(val);
    setSelectedMonth(newMonth);
    updateUrlWithFilters(selectedYear, newMonth);
  };

  // Handle year change
  const handleYearChange = (newVal: string) => {
    const newYear = Number(newVal);
    setSelectedYear(newYear);
    updateUrlWithFilters(newYear, selectedMonth);
  };

  // Summaries - ONLY FOR EXPENSES
  const expenseItems = items.filter((i) => i.isExpense);
  const totalBudget = expenseItems.reduce((acc, i) => acc + i.budget, 0);
  const totalSpent = expenseItems.reduce(
    (acc, i) => acc + Math.abs(i.spent),
    0
  );
  const remaining = totalBudget - totalSpent;

  const formatCurrency = (num: number) =>
    num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Our existing year range utility
  const yearRange = getYearRange();

  // Helper to get month name
  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('en-GB', { month: 'long' });
  };

  return (
    <CardTreasury className="sm:p-4 p-0">
      <CardHeader>
        <CardTitle className="text-lg">
          Budget Overview for {selectedYear}
          {selectedMonth && ` (up to ${getMonthName(selectedMonth)})`}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-300">
          (1 April {selectedYear - 1} to{' '}
          {selectedMonth
            ? `${selectedMonth <= 3 ? '31' : '30'} ${getMonthName(
                selectedMonth
              )} ${selectedMonth <= 3 ? selectedYear : selectedYear - 1}`
            : `31 March ${selectedYear}`}
          )
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Year and Month dropdowns */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Year:</label>
              <Select
                value={String(selectedYear)}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearRange.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Month:</label>
              <Select
                value={selectedMonth ? String(selectedMonth) : 'all'}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {getMonthName(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error or warning message */}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {warning && (
            <p className="text-sm dark:text-yellow-500 text-amber-600">
              {warning}
            </p>
          )}

          {/* Only show these sections if we have data and no error */}
          {!error && (
            <>
              {/* Toggle bars/table */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'bars' ? 'default' : 'outline'}
                    onClick={() => setViewMode('bars')}
                  >
                    Bars View
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    onClick={() => setViewMode('table')}
                  >
                    Table View
                  </Button>
                </div>
              </div>

              {/* Totals row - EXPENSES ONLY */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Total Expense Budget
                  </div>
                  <div className="text-xl font-bold">
                    £{formatCurrency(totalBudget)}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Expenses to Date
                  </div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    £{formatCurrency(totalSpent)}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-md">
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedYear < 2025
                      ? 'Budget Variance'
                      : 'Budget Remaining'}
                  </div>
                  <div className="text-xl font-bold text-red-700 dark:text-red-400 ">
                    £{formatCurrency(remaining)}
                  </div>
                </div>
              </div>

              {viewMode === 'bars' ? (
                <BarsView items={items} formatCurrency={formatCurrency} />
              ) : (
                // Updated TableView with expand/collapse
                <TableView items={items} formatCurrency={formatCurrency} />
              )}
            </>
          )}
        </div>
      </CardContent>
    </CardTreasury>
  );
}

// Renders each category as a horizontal bar
function BarsView({
  items,
  formatCurrency,
}: {
  items: OverviewItem[];
  formatCurrency: (num: number) => string;
}) {
  return (
    <div className="space-y-4 mt-4">
      {items.map((cat) => {
        const spentAmount = Math.abs(cat.spent);
        const percent =
          cat.budget > 0 ? Math.min((spentAmount / cat.budget) * 100, 100) : 0;
        return (
          <div key={cat.categoryId} className="space-y-1 ">
            <div className="flex justify-between text-sm ">
              <span className="font-semibold">{cat.categoryName}</span>
              <span>
                £{formatCurrency(spentAmount)} / £{formatCurrency(cat.budget)}
              </span>
            </div>
            <Progress value={percent} />
          </div>
        );
      })}
    </div>
  );
}

// NEW: Renders categories in a table with expandable transactions
function TableView({
  items,
  formatCurrency,
}: {
  items: OverviewItem[];
  formatCurrency: (num: number) => string;
}) {
  const { selectedYear } = useSelectedYear();
  const lastColumnHeader = selectedYear < 2025 ? 'Difference' : 'Remaining';
  const searchParams = useSearchParams();
  const selectedMonth = searchParams.get('month')
    ? Number(searchParams.get('month'))
    : undefined;

  // Track expansions in a Set of category IDs
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // NEW: Filter transactions by selected month
  const filterTransactionsByMonth = (transactions: DetailedTransaction[]) => {
    if (!selectedMonth) return transactions;

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth() + 1; // JavaScript months are 0-based
      return txMonth === selectedMonth;
    });
  };

  return (
    <div className="overflow-x-auto mt-4 border border-coop-600/20 dark:border-sky-500/20 ">
      <Table className=" bg-slate-50 dark:bg-slate-900 w-full">
        <TableHeader className="text-slate-800 dark:text-slate-200 font-semibold ">
          <TableRow className="">
            <TableHead>Category</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Spent/Received</TableHead>
            <TableHead>{lastColumnHeader}</TableHead>
            {/* NEW: extra column for the "View/Hide" button */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Income Section */}
          <TableRow>
            <TableCell
              colSpan={5}
              className="bg-white dark:bg-slate-800 font-semibold"
            >
              Income
            </TableCell>
          </TableRow>
          {items
            .filter((i) => !i.isExpense)
            .map((cat) => {
              const spentAmount = Math.abs(cat.spent);
              const remaining = cat.budget - spentAmount;
              const isOverBudget = remaining < 0;
              // NEW: Filter transactions for this category
              const filteredTransactions = filterTransactionsByMonth(
                cat.transactions
              );

              return (
                <React.Fragment key={cat.categoryId}>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 ">
                    <TableCell>{cat.categoryName}</TableCell>
                    <TableCell>£{formatCurrency(cat.budget)}</TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400  ">
                      £{formatCurrency(spentAmount)}
                    </TableCell>
                    <TableCell
                      className={
                        !isOverBudget
                          ? 'text-red-700 dark:text-red-400 '
                          : 'text-emerald-600 dark:text-emerald-400 '
                      }
                    >
                      £{formatCurrency(remaining)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(cat.categoryId)}
                        className="gap-2 w-[100px] justify-between"
                      >
                        {expandedCategories.has(cat.categoryId) ? (
                          <>
                            Hide
                            <EyeOff className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            View
                            <Eye className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* If expanded, show the transactions table */}
                  {expandedCategories.has(cat.categoryId) && (
                    <TableRow className="bg-white dark:bg-slate-800">
                      <TableCell colSpan={5} className="">
                        <div className="py-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="sm:min-w-[250px] min-w-[150px]">
                                  Date
                                </TableHead>
                                <TableHead className="min-w-[300px]">
                                  Description
                                </TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTransactions.length > 0 ? (
                                filteredTransactions
                                  .sort(
                                    (a, b) =>
                                      new Date(b.date).getTime() -
                                      new Date(a.date).getTime()
                                  )
                                  .map((tx) => (
                                    <TableRow
                                      key={tx.id}
                                      className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                    >
                                      <Link
                                        href={`/members/treasury/bookkeeping/bank-reconciliation?month=${new Date(
                                          tx.date
                                        ).getFullYear()}-${String(
                                          new Date(tx.date).getMonth() + 1
                                        ).padStart(2, '0')}&txId=${
                                          tx.id
                                        }&view=edit`}
                                        className="contents hover:bg-slate-100 dark:hover:bg-slate-900"
                                      >
                                        <TableCell className="w-[120px]">
                                          {new Date(tx.date).toLocaleDateString(
                                            'en-GB',
                                            {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell className="min-w-[300px]">
                                          {tx.description}
                                        </TableCell>
                                        <TableCell>
                                          £{tx.amount < 0 ? '-' : ''}
                                          {formatCurrency(Math.abs(tx.amount))}
                                        </TableCell>
                                      </Link>
                                    </TableRow>
                                  ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                  >
                                    {selectedMonth
                                      ? 'No transactions for this month'
                                      : 'No transactions'}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

          {/* Expenses Section */}
          <TableRow className="bg-white dark:bg-slate-800 ">
            <TableCell
              colSpan={5}
              className="bg-white dark:bg-slate-800 font-semibold"
            >
              Expenses
            </TableCell>
          </TableRow>
          {items
            .filter((i) => i.isExpense)
            .map((cat) => {
              const spentAmount = Math.abs(cat.spent);
              const remaining = cat.budget - spentAmount;
              const isOverBudget = remaining < 0;
              // NEW: Filter transactions for this category
              const filteredTransactions = filterTransactionsByMonth(
                cat.transactions
              );

              return (
                <React.Fragment key={cat.categoryId}>
                  <TableRow className="bg-slate-50 dark:bg-slate-900 ">
                    <TableCell>{cat.categoryName}</TableCell>
                    <TableCell>£{formatCurrency(cat.budget)}</TableCell>
                    <TableCell className="text-red-700 dark:text-red-400 ">
                      £{formatCurrency(spentAmount)}
                    </TableCell>
                    <TableCell
                      className={
                        isOverBudget
                          ? 'text-red-700 dark:text-red-400 '
                          : 'text-emerald-600 dark:text-emerald-400'
                      }
                    >
                      £{formatCurrency(remaining)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCategory(cat.categoryId)}
                        className="gap-2 w-[100px] justify-between"
                      >
                        {expandedCategories.has(cat.categoryId) ? (
                          <>
                            Hide
                            <EyeOff className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            View
                            <Eye className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* If expanded, show the transactions table */}
                  {expandedCategories.has(cat.categoryId) && (
                    <TableRow className="bg-white dark:bg-slate-800">
                      <TableCell colSpan={5} className="">
                        <div className="py-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="sm:min-w-[250px] min-w-[150px]">
                                  Date
                                </TableHead>
                                <TableHead className="min-w-[300px]">
                                  Description
                                </TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTransactions.length > 0 ? (
                                filteredTransactions
                                  .sort(
                                    (a, b) =>
                                      new Date(b.date).getTime() -
                                      new Date(a.date).getTime()
                                  )
                                  .map((tx) => (
                                    <TableRow
                                      key={tx.id}
                                      className="hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                    >
                                      <Link
                                        href={`/members/treasury/bookkeeping/bank-reconciliation?month=${new Date(
                                          tx.date
                                        ).getFullYear()}-${String(
                                          new Date(tx.date).getMonth() + 1
                                        ).padStart(2, '0')}&txId=${
                                          tx.id
                                        }&view=edit`}
                                        className="contents hover:bg-slate-100 dark:hover:bg-slate-800"
                                      >
                                        <TableCell className="w-[120px]">
                                          {new Date(tx.date).toLocaleDateString(
                                            'en-GB',
                                            {
                                              day: '2-digit',
                                              month: '2-digit',
                                              year: 'numeric',
                                            }
                                          )}
                                        </TableCell>
                                        <TableCell className="min-w-[300px]">
                                          {tx.description}
                                        </TableCell>
                                        <TableCell>
                                          £{tx.amount < 0 ? '-' : ''}
                                          {formatCurrency(Math.abs(tx.amount))}
                                        </TableCell>
                                      </Link>
                                    </TableRow>
                                  ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                  >
                                    {selectedMonth
                                      ? 'No transactions for this month'
                                      : 'No transactions'}
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
