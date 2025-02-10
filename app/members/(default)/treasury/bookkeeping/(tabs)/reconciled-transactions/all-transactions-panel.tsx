'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/members/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import PaginationPages from '@/components/members/ui/pagination-pages';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/members/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/members/ui/select';

import {
  reconcileTransaction,
  deleteTransaction,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import type {
  TreasuryTransaction,
  TreasuryCategory,
} from '@/types/members/treasury';

interface ReconciledTransactionsPanelProps {
  initialTransactions: TreasuryTransaction[];
  categories: TreasuryCategory[];
}

const ITEMS_PER_PAGE = 12;

export default function ReconciledTransactionsPanel({
  initialTransactions,
  categories,
}: ReconciledTransactionsPanelProps) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<TreasuryTransaction[]>(initialTransactions);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'receipt'>(
    'all'
  );
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [reconcileStatus, setReconcileStatus] = useState<
    'all' | 'reconciled' | 'unreconciled'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique years from transactions
  const years = useMemo(() => {
    const uniqueYears = new Set(
      transactions.map((tx) => new Date(tx.date).getFullYear())
    );
    return Array.from(uniqueYears).sort((a, b) => b - a); // Sort descending
  }, [transactions]);

  function formatCurrency(num: number) {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by type
      if (filterType !== 'all') {
        const isPayment = tx.splits.some((s) => s.category?.is_expense);
        if (filterType === 'payment' && !isPayment) return false;
        if (filterType === 'receipt' && isPayment) return false;
      }

      // Filter by year
      if (selectedYear !== 'all') {
        const txYear = new Date(tx.date).getFullYear().toString();
        if (txYear !== selectedYear) return false;
      }

      // Filter by reconciliation status
      if (reconcileStatus !== 'all') {
        if (reconcileStatus === 'reconciled' && !tx.is_reconciled) return false;
        if (reconcileStatus === 'unreconciled' && tx.is_reconciled)
          return false;
      }

      return true;
    });
  }, [transactions, filterType, selectedYear, reconcileStatus]);

  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, endIndex);

  async function handleReconcile(txId: string, next: boolean) {
    const res = await reconcileTransaction(txId, next);
    if (!res.success) {
      toast.error('Error updating transaction status');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_reconciled: next } : t))
    );
  }

  async function handleDelete(txId: string) {
    const res = await deleteTransaction(txId);
    if (!res.success) {
      toast.error('Error deleting transaction');
      return;
    }

    // Update local state
    setTransactions((prev) => prev.filter((t) => t.id !== txId));

    // Show success message
    toast.success('Transaction deleted successfully');

    // Force a revalidation of the data
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <CardTreasury>
        <CardHeader>
          <CardTitle className="text-lg">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No transactions found.</p>
        </CardContent>
      </CardTreasury>
    );
  }

  return (
    <CardTreasury>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          All Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('all');
                setCurrentPage(1);
              }}
            >
              All Types
            </Button>
            <Button
              variant={filterType === 'payment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('payment');
                setCurrentPage(1);
              }}
            >
              Payments
            </Button>
            <Button
              variant={filterType === 'receipt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('receipt');
                setCurrentPage(1);
              }}
            >
              Receipts
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedYear}
              onValueChange={(value) => {
                setSelectedYear(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={reconcileStatus}
              onValueChange={(value: 'all' | 'reconciled' | 'unreconciled') => {
                setReconcileStatus(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="">
                <SelectValue placeholder="Reconciliation Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
                <SelectItem value="unreconciled">Unreconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md overflow-x-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Paid To</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((tx) => {
                const isPayment = tx.splits.some((s) => s.category?.is_expense);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>{tx.paid_to}</TableCell>
                    <TableCell>{isPayment ? 'Payment' : 'Receipt'}</TableCell>
                    <TableCell
                      className={`px-6 ${
                        isPayment
                          ? tx.total_amount < 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      £{formatCurrency(tx.total_amount)}
                    </TableCell>
                    <TableCell>
                      {tx.is_reconciled ? (
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-yellow-500 dark:text-yellow-400 inline" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2 min-w-[200px]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={() =>
                            handleReconcile(tx.id, !tx.is_reconciled)
                          }
                        >
                          {tx.is_reconciled ? 'Unreconcile' : 'Reconcile'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="whitespace-nowrap"
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Transaction?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="space-y-2">
                                <p>
                                  Are you sure you want to delete &quot;
                                  {tx.paid_to}&quot; for £
                                  {formatCurrency(tx.total_amount)}?
                                </p>
                                {tx.is_reconciled && (
                                  <p className="font-medium text-red-600 dark:text-red-400">
                                    Warning: This transaction is reconciled.
                                    Deleting it will unbalance{' '}
                                    {new Date(tx.date).toLocaleDateString(
                                      'en-GB',
                                      {
                                        month: 'long',
                                        year: 'numeric',
                                      }
                                    )}
                                    &#39;s bank statement.
                                  </p>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                                onClick={() => handleDelete(tx.id)}
                              >
                                Delete Transaction
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="mt-3">
            <PaginationPages
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalRecords}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </CardContent>
    </CardTreasury>
  );
}
