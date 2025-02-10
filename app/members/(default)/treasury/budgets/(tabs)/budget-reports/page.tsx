'use client';

import { useState, useEffect } from 'react';
import {
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/members/ui/card';
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
import { Button } from '@/components/members/ui/button';
import { useSelectedYear } from '@/app/members/(default)/treasury/budgets/budgets-provider';
import {
  getDetailedTransactionReport,
  getAgreedBudgetForYear,
  type DetailedTransaction,
} from '@/app/members/actions/treasury/budget-actions';

interface CategoryData {
  id: string;
  name: string;
  is_expense: boolean;
  budget: number;
  actual: number;
  transactions: DetailedTransaction[];
}

export default function BudgetReportsPage() {
  const { selectedYear, setSelectedYear } = useSelectedYear();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Format currency consistently
  const formatCurrency = (num: number) =>
    num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Fetch data when year changes
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // Get transactions and budget data in parallel
        const [transactionRes, budgetRes] = await Promise.all([
          getDetailedTransactionReport(selectedYear),
          getAgreedBudgetForYear(selectedYear),
        ]);

        if (!transactionRes.success) throw new Error(transactionRes.error);
        if (!budgetRes.success) throw new Error(budgetRes.error);

        // Create a map of category ID to budget amount
        const budgetMap = new Map();
        budgetRes.data?.forEach((row) => {
          if (row.category) {
            budgetMap.set(row.category_id, {
              budget: Number(row.annual_budget) || 0,
              name: row.category.name,
              is_expense: row.category.is_expense,
            });
          }
        });

        // Group transactions by category
        const categoryMap = new Map<string, CategoryData>();

        transactionRes.data.transactions.forEach((tx) => {
          const budgetInfo = budgetMap.get(tx.category_id) || {
            budget: 0,
            name: tx.category_name,
            is_expense: tx.is_expense,
          };

          const existing: CategoryData = categoryMap.get(tx.category_id) || {
            id: tx.category_id,
            name: budgetInfo.name,
            is_expense: budgetInfo.is_expense,
            budget: budgetInfo.budget,
            actual: 0,
            transactions: [],
          };

          existing.actual += Math.abs(tx.amount);
          existing.transactions.push(tx);
          categoryMap.set(tx.category_id, existing);
        });

        // Add categories that have a budget but no transactions
        budgetMap.forEach((info, categoryId) => {
          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, {
              id: categoryId,
              name: info.name,
              is_expense: info.is_expense,
              budget: info.budget,
              actual: 0,
              transactions: [],
            });
          }
        });

        setCategories(Array.from(categoryMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [selectedYear]);

  // Calculate totals
  const incomeTotals = categories
    .filter((c) => !c.is_expense)
    .reduce(
      (acc, cat) => ({
        budget: acc.budget + cat.budget,
        actual: acc.actual + cat.actual,
      }),
      { budget: 0, actual: 0 }
    );

  const expenseTotals = categories
    .filter((c) => c.is_expense)
    .reduce(
      (acc, cat) => ({
        budget: acc.budget + cat.budget,
        actual: acc.actual + cat.actual,
      }),
      { budget: 0, actual: 0 }
    );

  return (
    <CardTreasury className="p-4">
      <CardHeader>
        <CardTitle className="text-lg">Budget Reports</CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-300">
          Detailed spending breakdown by category for {selectedYear}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Year Selection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Fiscal Year</label>
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="space-y-8">
            {/* Income Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Income</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories
                    .filter((cat) => !cat.is_expense)
                    .map((cat) => (
                      <>
                        <TableRow key={cat.id}>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell className="text-right">
                            £{formatCurrency(cat.budget)}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            £{formatCurrency(cat.actual)}
                          </TableCell>
                          <TableCell className="text-right">
                            £{formatCurrency(cat.actual - cat.budget)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategory(cat.id)}
                            >
                              {expandedCategories.has(cat.id) ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedCategories.has(cat.id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <div className="bg-muted/50 px-4 py-3">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">
                                        Amount
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cat.transactions
                                      .sort(
                                        (a, b) =>
                                          new Date(b.date).getTime() -
                                          new Date(a.date).getTime()
                                      )
                                      .map((tx) => (
                                        <TableRow key={tx.id}>
                                          <TableCell>
                                            {new Date(
                                              tx.date
                                            ).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>
                                            {tx.description}
                                          </TableCell>
                                          <TableCell className="text-right text-emerald-600">
                                            £
                                            {formatCurrency(
                                              Math.abs(tx.amount)
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    {cat.transactions.length === 0 && (
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-center text-muted-foreground"
                                        >
                                          No transactions
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Expenses Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Expenses</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories
                    .filter((cat) => cat.is_expense)
                    .map((cat) => (
                      <>
                        <TableRow key={cat.id}>
                          <TableCell>{cat.name}</TableCell>
                          <TableCell className="text-right">
                            £{formatCurrency(cat.budget)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            £{formatCurrency(cat.actual)}
                          </TableCell>
                          <TableCell className="text-right">
                            £{formatCurrency(cat.budget - cat.actual)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategory(cat.id)}
                            >
                              {expandedCategories.has(cat.id) ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedCategories.has(cat.id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="p-0">
                              <div className="bg-muted/50 px-4 py-3">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Description</TableHead>
                                      <TableHead className="text-right">
                                        Amount
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cat.transactions
                                      .sort(
                                        (a, b) =>
                                          new Date(b.date).getTime() -
                                          new Date(a.date).getTime()
                                      )
                                      .map((tx) => (
                                        <TableRow key={tx.id}>
                                          <TableCell>
                                            {new Date(
                                              tx.date
                                            ).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell>
                                            {tx.description}
                                          </TableCell>
                                          <TableCell className="text-right text-red-600">
                                            £
                                            {formatCurrency(
                                              Math.abs(tx.amount)
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    {cat.transactions.length === 0 && (
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="text-center text-muted-foreground"
                                        >
                                          No transactions
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </CardTreasury>
  );
}
