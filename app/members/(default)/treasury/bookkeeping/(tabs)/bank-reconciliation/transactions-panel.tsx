'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/members/ui/table';
import { Button } from '@/components/members/ui/button';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/members/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { TreasuryTransaction } from '@/types/members/treasury';
import PaginationNumeric from '@/components/members/ui/pagination-num';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/members/ui/alert-dialog';
import {
  deleteAllTransactionsInMonth,
  reconcileAllTransactionsInMonth,
} from '@/app/members/actions/treasury/bookkeeping-actions';

interface TransactionsPanelProps {
  transactions: TreasuryTransaction[];
  onReconcile: (txId: string, nextState: boolean) => void;
  onDelete: (txId: string) => void;
  selectedMonth: Date;
  onEdit?: (tx: TreasuryTransaction) => void;
  showCategories?: boolean;
  reconciledDifference?: number;
}

const ITEMS_PER_PAGE = 8;

export default function TransactionsPanel({
  transactions,
  onReconcile,
  onDelete,
  onEdit,
  showCategories = true,
  selectedMonth,
  reconciledDifference = 0,
}: TransactionsPanelProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'receipt'>(
    'all'
  );

  const formatCurrency = (num: number) =>
    num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const filtered = useMemo(() => {
    if (filterType === 'all') return transactions;
    return transactions.filter((tx) => {
      const isPayment = tx.splits.some((s) => s.category?.is_expense);
      return filterType === 'payment' ? isPayment : !isPayment;
    });
  }, [transactions, filterType]);

  // Calculate totals for both all and reconciled transactions
  const totals = useMemo(() => {
    let allReceipts = 0;
    let allPayments = 0;
    let reconciledReceipts = 0;
    let reconciledPayments = 0;

    transactions.forEach((tx) => {
      const isPayment = tx.splits.some((s) => s.category?.is_expense);
      if (isPayment) {
        allPayments += tx.total_amount;
        if (tx.is_reconciled) reconciledPayments += tx.total_amount;
      } else {
        allReceipts += tx.total_amount;
        if (tx.is_reconciled) reconciledReceipts += tx.total_amount;
      }
    });

    return {
      all: {
        receipts: allReceipts,
        payments: allPayments,
        net: allReceipts - allPayments,
      },
      reconciled: {
        receipts: reconciledReceipts,
        payments: reconciledPayments,
        net: reconciledReceipts - reconciledPayments,
      },
    };
  }, [transactions]);

  // Calculate how many unreconciled transactions we have
  const unreconciledCount = useMemo(() => {
    return transactions.filter((tx) => !tx.is_reconciled).length;
  }, [transactions]);

  // Pagination calculations based on filtered transactions
  const totalRecords = filtered.length;
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  // Clamp currentPage in an effect to avoid state update during render
  useEffect(() => {
    const safePage = Math.min(
      Math.max(1, currentPage),
      Math.max(1, totalPages)
    );
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRecords);
  const currentItems = filtered.slice(startIndex, endIndex);

  // Wrap the onDelete callback to add toast
  const handleDelete = (txId: string) => {
    onDelete(txId);
    toast.success('Transaction deleted successfully');
  };

  // Remove the toast from edit handler since it should be in the parent
  const handleEdit = (tx: TreasuryTransaction) => {
    if (onEdit) {
      onEdit(tx);
    }
  };

  return (
    <>
      {/* Filter + Actions (always visible) */}
      <div className="sm:flex sm:justify-between sm:items-center pb-6">
        <div className="flex items-center gap-2 sm:pb-2 pb-4">
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterType('all');
                setCurrentPage(1);
              }}
            >
              All
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
        </div>
        <div className="flex gap-2">
          {/* Reconcile All Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                disabled={unreconciledCount === 0}
              >
                Reconcile All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reconcile All Transactions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark all {unreconciledCount} unreconciled
                  transactions in{' '}
                  {selectedMonth.toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  })}{' '}
                  as reconciled. This action can be undone by manually
                  unreconciling transactions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const { success } = await reconcileAllTransactionsInMonth(
                      selectedMonth
                    );
                    if (success) {
                      // Update all transactions in local state
                      transactions
                        .filter((tx) => !tx.is_reconciled)
                        .forEach((tx) => onReconcile(tx.id, true));
                    }
                  }}
                >
                  Confirm Reconcile All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete All Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={transactions.length === 0}
              >
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all transactions in{' '}
                  {selectedMonth.toLocaleDateString('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  })}
                  . This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  onClick={async () => {
                    const { success } = await deleteAllTransactionsInMonth(
                      selectedMonth
                    );
                    if (success) {
                      // remove them from local state
                      transactions.forEach((tx) => onDelete(tx.id));
                      toast.success('All transactions deleted successfully');
                    } else {
                      toast.error('Failed to delete all transactions');
                    }
                  }}
                >
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Difference vs Statement section */}
      <div className="border-slate-200 dark:border-slate-700 -mx-6 px-6 py-3 mb-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Difference vs. Statement (Reconciled Only):
          <span
            className={`ml-2 ${
              Math.abs(reconciledDifference) < 0.01
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            }`}
          >
            £{formatCurrency(reconciledDifference)}
          </span>
        </span>
        {Math.abs(reconciledDifference) < 0.01 ? (
          <CheckCircle className="text-emerald-700 dark:text-emerald-400 w-5 h-5" />
        ) : (
          <XCircle className="text-red-500 dark:text-red-400 w-5 h-5" />
        )}
      </div>

      {/* Render the transaction table or an empty state if no results */}
      {totalRecords === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-500">No transactions found.</p>
        </div>
      ) : (
        <>
          {/* Transaction Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2 -mx-6">
            <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800 space-y-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                All Transactions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-sm text-slate-500">Receipts</div>
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm">
                    £{formatCurrency(totals.all.receipts)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Payments</div>
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    £{formatCurrency(totals.all.payments)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Net</div>
                  <div
                    className={
                      totals.all.net >= 0
                        ? 'text-emerald-600 dark:text-emerald-400 text-sm'
                        : 'text-red-600 dark:text-red-400 text-sm '
                    }
                  >
                    £{formatCurrency(totals.all.net)}
                  </div>
                </div>
              </div>
            </div>

            <div className="py-4 px-6  bg-slate-50 dark:bg-slate-800 space-y-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Reconciled Transactions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-sm text-slate-500">Receipts</div>
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm">
                    £{formatCurrency(totals.reconciled.receipts)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Payments</div>
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    £{formatCurrency(totals.reconciled.payments)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500">Net</div>
                  <div
                    className={
                      totals.reconciled.net >= 0
                        ? 'text-red-700 dark:text-red-400 text-sm'
                        : 'text-emerald-600 dark:text-emerald-400 text-sm'
                    }
                  >
                    £{formatCurrency(totals.reconciled.net)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Date</TableHead>
                  <TableHead className="px-6">Description</TableHead>
                  <TableHead className="px-6">Type</TableHead>
                  <TableHead className="px-6">Amount</TableHead>
                  {showCategories && (
                    <TableHead className="px-6">Category</TableHead>
                  )}
                  <TableHead className="px-6">Status</TableHead>
                  <TableHead className="px-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((tx) => {
                  const isPayment = tx.splits.some(
                    (s) => s.category?.is_expense
                  );
                  const hasSplits = tx.splits.length > 1;

                  return (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:bg-slate-900"
                    >
                      <TableCell className="px-6">
                        {new Date(tx.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </TableCell>
                      <TableCell className="px-6">{tx.paid_to}</TableCell>
                      <TableCell className="px-6">
                        {isPayment ? 'Payment' : 'Receipt'}
                      </TableCell>
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
                      {showCategories && (
                        <TableCell className="px-6">
                          {hasSplits ? (
                            <div className="space-y-1">
                              {tx.splits.map((split) => (
                                <div key={split.id} className="text-sm">
                                  {split.category?.name}: £
                                  {formatCurrency(split.amount)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            tx.splits[0]?.category?.name
                          )}
                        </TableCell>
                      )}
                      <TableCell className="px-6">
                        {tx.is_reconciled ? (
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-yellow-500 dark:text-amber-400" />
                        )}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <div className="flex items-center justify-end space-x-2 min-w-[200px]">
                          <Button
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                            onClick={() =>
                              onReconcile(tx.id, !tx.is_reconciled)
                            }
                          >
                            {tx.is_reconciled ? 'Unreconcile' : 'Reconcile'}
                          </Button>
                          {onEdit && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="whitespace-nowrap"
                              onClick={() => handleEdit(tx)}
                            >
                              Edit
                            </Button>
                          )}
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
                                    {tx.paid_to}
                                    &quot; for £
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sm:pt-6 pt-4">
              <PaginationNumeric
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalRecords}
                startIndex={startIndex + 1}
                endIndex={endIndex}
                onPageChange={(page) => {
                  const validPage = Math.min(Math.max(1, page), totalPages);
                  setCurrentPage(validPage);
                }}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
