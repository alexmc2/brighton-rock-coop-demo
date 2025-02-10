// app/members/(default)/treasury/report/[month]/page.tsx

import {
  getMonthlyBalance,
  getMonthTransactions,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import type {
  MonthlyBalance,
  TreasuryTransaction,
} from '@/types/members/treasury';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/members/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/members/ui/table';
import { Badge } from '@/components/members/ui/badge';
import { ScrollArea } from '@/components/members/ui/scroll-area';
import { Separator } from '@/components/members/ui/separator';
import { ArrowDown, ArrowUp, Receipt, CreditCard } from 'lucide-react';
import { Button } from '@/components/members/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ReconciliationReportPage({
  params,
}: {
  params: { month: string };
}) {
  const { month } = params;

  try {
    const [year, monthNum] = month.split('-').map(Number);
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('Invalid month format');
    }

    const dateObj = new Date(year, monthNum - 1, 1, 12, 0, 0, 0);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const balRes = await getMonthlyBalance(dateObj);
    const txRes = await getMonthTransactions(dateObj);

    const balance: MonthlyBalance | null =
      balRes.success && balRes.data ? balRes.data : null;
    const transactions: TreasuryTransaction[] =
      txRes.success && txRes.data ? txRes.data : [];

    if (!balance) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              No reconciliation data found for {month}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    const monthDisplay = dateObj.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });

    return (
      <div className="space-y-6 ">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link
              href="/members/treasury/bookkeeping/bank-reconciliation"
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Bookkeeping
            </Link>
          </Button>
        </div>

        <Card className="">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  Bank Reconciliation Report
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  {monthDisplay}
                </CardDescription>
              </div>
              <Badge
                variant={balance.is_reconciled ? 'default' : 'secondary'}
                className="ml-auto"
              >
                {balance.is_reconciled ? 'Reconciled' : 'Pending'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 ">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-lg font-bold">
                  £
                  {balance.opening_balance.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(
                    balance.opening_date || dateObj
                  ).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Closing Balance</p>
                <p className="text-lg font-bold">
                  £
                  {balance.closing_balance.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(
                    balance.closing_date || dateObj
                  ).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-lg font-bold text-emerald-600">
                  £
                  {balance.total_income.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <div className="flex items-center text-xs text-emerald-600">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Receipts
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-lg font-bold text-red-600">
                  £
                  {balance.total_expenses.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <div className="flex items-center text-xs text-red-600">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  Payments
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transaction Details</h3>
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-slate-900 ">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions
                      .sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      )
                      .map((tx) => {
                        const isExpense = tx.splits.some(
                          (s) => s.category?.is_expense
                        );
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="font-medium">
                              {new Date(tx.date).toLocaleDateString('en-GB')}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{tx.paid_to}</div>
                              {tx.description && (
                                <div className="text-sm text-muted-foreground">
                                  {tx.description}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isExpense ? (
                                  <>
                                    <CreditCard className="h-4 w-4 text-red-600" />
                                    <span className="text-red-600">
                                      Payment
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                    <span className="text-emerald-600">
                                      Receipt
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {tx.splits.length === 1 ? (
                                <Badge variant="outline">
                                  {tx.splits[0].category?.name}
                                </Badge>
                              ) : (
                                <div className="space-y-1">
                                  {tx.splits.map((split) => (
                                    <div
                                      key={split.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <Badge variant="outline" className="mr-2">
                                        {split.category?.name}
                                      </Badge>
                                      <span>
                                        £
                                        {split.amount.toLocaleString('en-GB', {
                                          minimumFractionDigits: 2,
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              <span
                                className={
                                  isExpense
                                    ? 'text-red-600'
                                    : 'text-emerald-600'
                                }
                              >
                                {isExpense ? '-' : '+'}£
                                {tx.total_amount.toLocaleString('en-GB', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error in ReconciliationReportPage:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Invalid month format or date. Please use YYYY-MM format.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
}
