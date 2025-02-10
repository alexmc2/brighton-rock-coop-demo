'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { NumericFormat } from 'react-number-format';
import {
  Card,
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';
import { Label } from '@/components/members/ui/label';
import { Input } from '@/components/members/ui/input';
import { Button } from '@/components/members/ui/button';
import { ScrollArea } from '@/components/members/ui/scroll-area';
import { PlusCircle, Trash2, Save, AlertTriangle } from 'lucide-react';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/members/ui/select';

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/members/ui/alert';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle as ADTitle,
  AlertDialogDescription as ADDesc,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/members/ui/alert-dialog';

import { toast } from 'sonner';

import {
  createTransaction,
  updateTransaction,
  getMonthTransactions,
  getMonthlyBalance,
  reconcileTransaction,
  deleteTransaction,
  upsertMonthlyBalance,
  createCategory,
  deleteCategory,
  getCategories,
} from '@/app/members/actions/treasury/bookkeeping-actions';

import type {
  TreasuryTransaction,
  TreasuryCategory,
  MonthlyBalance,
  TransactionCreateInput,
  ReconciliationPanelProps,
  FormState,
} from '@/types/members/treasury';

import { MonthYearPicker } from '@/components/members/ui/month-year-picker';
import { formatDateToDDMMYYYY } from '@/utils/date-utils';

import ReconciliationTransactionsList from '@/app/members/(default)/treasury/bookkeeping/(tabs)/bank-reconciliation/transactions-panel';

// Use the custom ThemedBounceLoader which handles dark mode internally
import ThemedBounceLoader from '@/components/members/ui/ThemedBounceLoader';

export default function ReconciliationPanel({
  initialMonth,
  initialBalance,
  initialTransactions,
  categories: initialCategories,
}: ReconciliationPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth);
  const [monthlyBalance, setMonthlyBalance] = useState<MonthlyBalance | null>(
    initialBalance
  );
  const [transactions, setTransactions] =
    useState<TreasuryTransaction[]>(initialTransactions);
  const [categories, setCategories] =
    useState<TreasuryCategory[]>(initialCategories);
  const [editingTx, setEditingTx] = useState<TreasuryTransaction | null>(null);
  const [transactionType, setTransactionType] = useState<'payment' | 'receipt'>(
    'payment'
  );

  // Create a ref for the form container
  const formRef = useRef<HTMLDivElement>(null);

  // Define the onEdit handler that sets editing state and scrolls the form into view
  const handleEditTransaction = useCallback((tx: TreasuryTransaction) => {
    setEditingTx(tx);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const createEmptyForm = useCallback((): FormState => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const mo = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return {
      date: `${day}/${mo}/${year}`,
      paid_to: '',
      description: '',
      total_amount: '',
      splits: [
        {
          id: crypto.randomUUID(),
          category_id: '',
          amount: '',
        },
      ],
    };
  }, []);

  const [formState, setFormState] = useState<FormState>(createEmptyForm());
  const [closingDate, setClosingDate] = useState<string>('');
  const [closingBalance, setClosingBalance] = useState<number>(0);
  const [rawClosingBalance, setRawClosingBalance] = useState('');

  const [xlsFile, setXlsFile] = useState<File | null>(null);
  const [importMsg, setImportMsg] = useState<string>('');
  const [importLoading, setImportLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [reconciledDifference, setReconciledDifference] = useState(0);

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>(
    'expense'
  );
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Category management handlers
  const handleAddCategory = async () => {
    const res = await createCategory({
      name: newCategoryName,
      description: newCategoryDesc || undefined,
      is_expense: newCategoryType === 'expense',
    });

    if (res.success) {
      toast.success('Category added successfully');
      // Refresh categories
      const catRes = await getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
      }
      // Reset form
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryType('expense');
    } else {
      toast.error(res.error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const res = await deleteCategory(categoryId);
    if (res.success) {
      toast.success('Category deleted successfully');
      // Refresh categories
      const catRes = await getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
      }
    } else {
      // Show a more user-friendly error message
      const errorMessage =
        res.error === 'Cannot delete category that is used in transactions' ||
        res.error === 'Cannot delete category that is used in budgets'
          ? 'This category is in use and cannot be deleted'
          : res.error;
      toast.error(errorMessage);
    }
  };

  // If monthlyBalance?.has_prev_closing === true, user cannot edit opening bal
  const disableOpeningBal = monthlyBalance?.has_prev_closing ?? false;

  const isMonthReconciled = monthlyBalance?.is_reconciled === true;
  const openingBalance = monthlyBalance?.opening_balance ?? 0;
  const EPSILON = 0.009; // Allow for small floating point differences
  const computedClosing = openingBalance + totalReceipts - totalPayments;
  const rawDifference = computedClosing - (closingBalance ?? 0);
  const difference = Math.abs(rawDifference);
  const isDifferenceZero = difference < EPSILON;
  const isReconciledDifferenceZero = Math.abs(reconciledDifference) < EPSILON;

  /**
   * Re-fetch transactions and monthlyBalance if the user changes the selected month
   */
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      const results = await Promise.all([
        getMonthTransactions(selectedMonth),
        getMonthlyBalance(selectedMonth),
      ]);

      if (!isMounted) return;

      // Handle transactions
      setTransactions(
        results[0]?.success && results[0].data ? results[0].data : []
      );

      // Handle monthly balance
      setMonthlyBalance(
        results[1]?.success && results[1].data ? results[1].data : null
      );
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [selectedMonth]);

  /**
   * Populate local state for closing date + closing balance
   */
  useEffect(() => {
    if (!monthlyBalance) {
      // Compute a default last day of the month (using UTC)
      const lastDay = new Date(
        Date.UTC(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0)
      );
      setClosingDate(formatDateToDDMMYYYY(lastDay));
      setClosingBalance(0);
      setRawClosingBalance('');
      return;
    }

    // If monthlyBalance exists, use its closing_date (if any) and format it
    const cDateStr = monthlyBalance.closing_date
      ? formatDateToDDMMYYYY(new Date(monthlyBalance.closing_date))
      : formatDateToDDMMYYYY(
          new Date(
            Date.UTC(
              selectedMonth.getFullYear(),
              selectedMonth.getMonth() + 1,
              0
            )
          )
        );
    setClosingDate(cDateStr);

    if (monthlyBalance.is_reconciled) {
      const storedBalance = monthlyBalance.closing_balance ?? 0;
      setClosingBalance(storedBalance);
      setRawClosingBalance(String(storedBalance));
      return;
    }

    // If not reconciled, load from localStorage or fallback to the DB value
    const monthKey = selectedMonth.toISOString().slice(0, 7);
    const savedVal = window.localStorage.getItem(`closingBalance-${monthKey}`);
    if (savedVal !== null) {
      const parsed = parseFloat(savedVal);
      if (!isNaN(parsed)) {
        setClosingBalance(parsed);
        setRawClosingBalance(String(parsed));
      } else {
        setClosingBalance(0);
        setRawClosingBalance('');
      }
    } else {
      setClosingBalance(monthlyBalance.closing_balance ?? 0);
      setRawClosingBalance(String(monthlyBalance.closing_balance ?? ''));
    }
  }, [monthlyBalance, selectedMonth]);

  /**
   * Compute difference for ALL transactions (for main overview)
   */
  useEffect(() => {
    if (!monthlyBalance) {
      setTotalReceipts(0);
      setTotalPayments(0);
      // Just set reconciled difference, we don't need to set difference anymore
      setReconciledDifference(-(closingBalance ?? 0));
      return;
    }
    // sum up receipts vs. payments
    let sumReceipts = 0;
    let sumPayments = 0;
    transactions.forEach((tx) => {
      const isPayment = tx.splits.some((s) => s.category?.is_expense);
      if (isPayment) sumPayments += tx.total_amount;
      else sumReceipts += tx.total_amount;
    });
    setTotalReceipts(sumReceipts);
    setTotalPayments(sumPayments);

    const computed = monthlyBalance.opening_balance + sumReceipts - sumPayments;
    const currentClosingBalance =
      rawClosingBalance === '' ? 0 : closingBalance ?? 0;

    // Also compute reconciled difference for the transactions panel
    let reconciledReceipts = 0;
    let reconciledPayments = 0;
    transactions.forEach((tx) => {
      if (!tx.is_reconciled) return;
      const isPayment = tx.splits.some((s) => s.category?.is_expense);
      if (isPayment) reconciledPayments += tx.total_amount;
      else reconciledReceipts += tx.total_amount;
    });
    const reconciledComputed =
      monthlyBalance.opening_balance + reconciledReceipts - reconciledPayments;
    setReconciledDifference(reconciledComputed - currentClosingBalance);
  }, [transactions, monthlyBalance, closingBalance, rawClosingBalance]);

  const convertTxToForm = useCallback((tx: TreasuryTransaction): FormState => {
    const sortedSplits = [...tx.splits].sort((a, b) => {
      return Number(a.category?.is_expense) - Number(b.category?.is_expense);
    });
    const txDate = new Date(tx.date);
    const day = String(txDate.getDate()).padStart(2, '0');
    const mo = String(txDate.getMonth() + 1).padStart(2, '0');
    const year = txDate.getFullYear();

    return {
      date: `${day}/${mo}/${year}`,
      paid_to: tx.paid_to,
      description: tx.description ?? '',
      total_amount: String(tx.total_amount),
      splits: sortedSplits.map((s) => ({
        id: crypto.randomUUID(),
        category_id: s.category_id,
        amount: String(s.amount),
      })),
    };
  }, []);

  useEffect(() => {
    if (editingTx) {
      const isPayment = editingTx.splits.some((s) => s.category?.is_expense);
      setTransactionType(isPayment ? 'payment' : 'receipt');
      setFormState(convertTxToForm(editingTx));
    } else {
      setFormState(createEmptyForm());
    }
  }, [editingTx, createEmptyForm, convertTxToForm]);

  function updateFormField(
    field: keyof Omit<FormState, 'splits'>,
    value: string
  ) {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function addSplit() {
    setFormState((prev) => ({
      ...prev,
      splits: [
        ...prev.splits,
        { id: crypto.randomUUID(), category_id: '', amount: '' },
      ],
    }));
  }

  function removeSplit(splitId: string) {
    setFormState((prev) => ({
      ...prev,
      splits: prev.splits.filter((s) => s.id !== splitId),
    }));
  }

  function updateSplit(
    splitId: string,
    field: 'category_id' | 'amount',
    val: string
  ) {
    setFormState((prev) => ({
      ...prev,
      splits: prev.splits.map((split) =>
        split.id === splitId ? { ...split, [field]: val } : split
      ),
    }));
    setErrors((prev) => ({ ...prev, [`${splitId}-${field}`]: '' }));
  }

  function calcRemaining() {
    const total = parseFloat(formState.total_amount) || 0;
    const allocated = formState.splits.reduce(
      (acc, s) => acc + parseFloat(s.amount || '0'),
      0
    );
    return total - allocated;
  }

  function validateForm() {
    const formErrors: Record<string, string> = {};
    if (!formState.date) {
      formErrors['date'] = 'Date is required.';
    } else {
      const datePattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = formState.date.match(datePattern);
      if (!match) {
        formErrors['date'] = 'Date must be in DD/MM/YYYY format.';
      } else {
        const [_, dd, mm, yyyy] = match;
        const d = parseInt(dd, 10);
        const m = parseInt(mm, 10);
        const y = parseInt(yyyy, 10);
        const testDate = new Date(y, m - 1, d);
        if (m < 1 || m > 12 || d < 1 || d > 31 || testDate.getDate() !== d) {
          formErrors['date'] = 'Invalid date.';
        }
      }
    }
    if (!formState.paid_to) {
      formErrors['paid_to'] = 'Payee is required.';
    }
    if (!formState.total_amount) {
      formErrors['total_amount'] = 'Total amount is required.';
    }

    let sumSplits = 0;
    formState.splits.forEach((split) => {
      if (!split.category_id) {
        formErrors[`${split.id}-category_id`] = 'Please select a category.';
      }
      if (!split.amount) {
        formErrors[`${split.id}-amount`] = 'Amount is required.';
      } else {
        sumSplits += parseFloat(split.amount);
      }
    });
    const total = parseFloat(formState.total_amount) || 0;
    if (Math.abs(total - sumSplits) > 0.01) {
      formErrors['total'] = 'Split amounts must match the total exactly.';
    }
    return formErrors;
  }

  async function handleSave() {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    const txInput: TransactionCreateInput = {
      date: new Date(convertDateToISO(formState.date)),
      paid_to: formState.paid_to,
      description: formState.description || undefined,
      total_amount: parseFloat(formState.total_amount),
      type: transactionType,
      splits: formState.splits.map((s) => ({
        category_id: s.category_id,
        amount: parseFloat(s.amount),
      })),
    };

    let res;
    if (editingTx) {
      res = await updateTransaction(editingTx.id, txInput);
    } else {
      res = await createTransaction(txInput);
    }
    if (!res.success) {
      toast.error(
        editingTx ? 'Error updating transaction' : 'Error saving transaction'
      );
      return;
    }

    // Show success toast
    toast.success(
      editingTx
        ? 'Transaction updated successfully'
        : 'Transaction saved successfully'
    );

    // Clear form and editing state
    setFormState(createEmptyForm());
    setEditingTx(null);
    setErrors({});

    // Refresh transactions
    const refreshed = await getMonthTransactions(selectedMonth);
    if (refreshed.success && refreshed.data) {
      setTransactions(refreshed.data);
    }
  }

  function convertDateToISO(dateStr: string): string {
    const [day, mo, year] = dateStr.split('/');
    return `${year}-${mo}-${day}`;
  }

  async function handleReconcile(txId: string, nextState: boolean) {
    const res = await reconcileTransaction(txId, nextState);
    if (!res.success) {
      toast.error('Error reconciling transaction');
      return;
    }
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, is_reconciled: nextState } : t))
    );
  }

  async function handleDeleteTransaction(txId: string) {
    const res = await deleteTransaction(txId);
    if (!res.success) {
      toast.error('Error deleting transaction');
      return;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
  }

  function formatCurrency(num: number) {
    return num.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * FILE IMPORT
   */
  async function handleXlsImport() {
    if (!xlsFile) return;
    setImportMsg('');
    setImportLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', xlsFile);

      const res = await fetch('/members/api/upload-xls', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      const data = await res.json();
      toast.success(`Imported ${data.importedCount} transactions`, {
        description:
          data.duplicatesCount > 0
            ? `${data.duplicatesCount} duplicates skipped`
            : undefined,
      });

      const txRes = await getMonthTransactions(selectedMonth);
      if (txRes.success && txRes.data) {
        setTransactions(txRes.data);
      }
    } catch (err: any) {
      toast.error('Import failed', {
        description: err.message,
      });
      setImportMsg(`Error: ${err.message}`);
    } finally {
      setImportLoading(false);
    }
  }

  /**
   * Let user change the closing balance, store in localStorage
   */
  const handleClosingBalanceChange = (values: { value: string }) => {
    const numericValue = values.value === '' ? 0 : parseFloat(values.value);
    setRawClosingBalance(values.value);
    setClosingBalance(numericValue);

    if (!isMonthReconciled) {
      const monthKey = selectedMonth.toISOString().slice(0, 7);
      window.localStorage.setItem(
        `closingBalance-${monthKey}`,
        String(numericValue)
      );
    }
  };

  /**
   * Let user change the opening balance if there's no previous-month close
   * Then immediately upsert to DB so it persists on refresh
   */
  async function handleOpeningBalanceChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (!monthlyBalance) return;
    if (disableOpeningBal) return; // do nothing if we have a prev closing

    const rawValue = e.target.value.replace(/[^\d.-]/g, '');
    const val = parseFloat(rawValue) || 0;

    // Update local state
    const updatedBal = {
      ...monthlyBalance,
      opening_balance: val,
      // do not finalize or do anything else
    } as MonthlyBalance;
    setMonthlyBalance(updatedBal);

    // Save to DB so it survives page refresh
    const upsertRes = await upsertMonthlyBalance({
      month: selectedMonth,
      opening_balance: val,
      closing_balance: updatedBal.closing_balance || 0,
      total_income: updatedBal.total_income || 0,
      total_expenses: updatedBal.total_expenses || 0,
      is_reconciled: false,
      opening_date: updatedBal.opening_date ?? null,
      closing_date: updatedBal.closing_date ?? null,
    });
    if (!upsertRes.success) {
      toast.error('Error saving opening balance');
    }
  }

  /**
   * Finalize the entire reconciliation
   */
  async function handleFinalize() {
    if (!monthlyBalance || closingBalance === null) return;

    // Parse the user-entered closingDate (assumed to be in DD/MM/YYYY format)
    const [day, month, year] = closingDate.split('/').map(Number);
    const parsedClosingDate = new Date(Date.UTC(year, month - 1, day));

    // Get opening date from monthlyBalance and ensure it's a Date object
    const openingDate = monthlyBalance.opening_date
      ? new Date(monthlyBalance.opening_date)
      : new Date(
          Date.UTC(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
        );

    const updated = {
      month: selectedMonth,
      opening_balance: monthlyBalance.opening_balance,
      closing_balance: closingBalance,
      total_income: totalReceipts,
      total_expenses: totalPayments,
      is_reconciled: isDifferenceZero,
      opening_date: openingDate,
      closing_date: parsedClosingDate,
    };

    const res = await upsertMonthlyBalance(updated);
    if (!res.success) {
      toast.error('Failed to finalise reconciliation');
      return;
    }

    toast.success('Reconciliation finalised successfully');
    const balRes = await getMonthlyBalance(selectedMonth);
    if (balRes.success && balRes.data) {
      setMonthlyBalance(balRes.data);
    }

    // Clear localStorage if difference is zero
    if (isDifferenceZero) {
      const monthKey = selectedMonth.toISOString().slice(0, 7);
      window.localStorage.removeItem(`closingBalance-${monthKey}`);
    }
  }

  return (
    <>
      {importLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <ThemedBounceLoader
            loading={true}
            size={60}
            ariaLabel="Loading Spinner"
            dataTestid="loader"
          />
        </div>
      )}
      <CardTreasury>
        <CardHeader>
          <CardTitle className="text-lg">Bank Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isMonthReconciled && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <div>
                <AlertTitle>This month is already reconciled.</AlertTitle>
                <AlertDescription>
                  Editing transactions may unbalance the statement.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Upload XLS */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default">Upload Bank Statement</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <ADTitle>Upload Bank Statement</ADTitle>
                <ADDesc>
                  {isMonthReconciled && (
                    <div className="text-red-500 mb-2">
                      Warning: This month is already reconciled. New
                      transactions may unbalance the statement.
                    </div>
                  )}
                  Select a .xls/.xlsx file to import
                </ADDesc>
              </AlertDialogHeader>
              <div className="space-y-3 my-4">
                <Label>Excel File (.xls or .xlsx)</Label>
                <Input
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setXlsFile(f);
                  }}
                />
                {importMsg && (
                  <p className="text-sm text-slate-500 mt-2">{importMsg}</p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={!xlsFile || importLoading}
                  onClick={handleXlsImport}
                >
                  {importLoading ? 'Importing...' : 'Import'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Month picker and other fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Month picker */}
            <div className="space-y-2">
              <Label>Reconciliation Month</Label>
              <MonthYearPicker
                value={selectedMonth}
                onChange={(newDate) => {
                  setSelectedMonth(newDate);
                  document.cookie = `treasury-selected-month=${newDate.toISOString()}; path=/; max-age=2592000`;
                }}
              />
            </div>

            {/* Opening Balance */}
            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <NumericFormat
                customInput={Input}
                thousandSeparator=","
                decimalScale={2}
                fixedDecimalScale={true}
                value={openingBalance}
                onChange={handleOpeningBalanceChange}
                disabled={disableOpeningBal || isMonthReconciled}
                className="bg-white dark:bg-slate-700"
              />
            </div>

            {/* Statement Closing Date */}
            <div className="space-y-2">
              <Label>Statement Closing Date</Label>
              <DateInput
                value={closingDate}
                onChange={(value) => setClosingDate(value)}
                disabled={isMonthReconciled}
              />
            </div>

            {/* Statement Closing Balance */}
            <div className="space-y-2">
              <Label>Statement Closing Balance</Label>
              <NumericFormat
                customInput={Input}
                thousandSeparator=","
                decimalScale={2}
                fixedDecimalScale={true}
                value={rawClosingBalance}
                onValueChange={handleClosingBalanceChange}
                disabled={isMonthReconciled}
                className="bg-white dark:bg-slate-700"
              />
            </div>
          </div>

          {/* Overview box */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-md">
            <div>
              <Label>Total Receipts</Label>
              <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                £{formatCurrency(totalReceipts)}
              </div>
            </div>
            <div>
              <Label>Total Payments</Label>
              <div
                className={`text-lg font-semibold ${
                  totalPayments < 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                £{formatCurrency(totalPayments)}
              </div>
            </div>
            <div>
              <Label>Computed Closing</Label>
              <div className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                £{formatCurrency(computedClosing)}
              </div>
            </div>
            <div>
              <Label>Difference vs. Statement</Label>
              <div
                className={`text-lg font-semibold ${
                  isDifferenceZero
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                £{formatCurrency(difference)}
              </div>
            </div>
          </div>

          {/* Add Payment/Receipt Form */}
          <div ref={formRef}>
            {(!isMonthReconciled || editingTx) && (
              <Card className="dark:bg-slate-900">
                <CardHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <CardTitle className="text-md font-semibold">
                        {editingTx
                          ? 'Edit Transaction'
                          : transactionType === 'payment'
                          ? 'Add Payment'
                          : 'Add Receipt'}
                      </CardTitle>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {editingTx
                          ? 'Edit the selected transaction below. Click "Update" to save.'
                          : `Enter a ${transactionType} for the selected month, then click "Save."`}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant={
                          transactionType === 'payment' ? 'default' : 'outline'
                        }
                        onClick={() => setTransactionType('payment')}
                        className="flex-1 sm:flex-none"
                      >
                        Payment
                      </Button>
                      <Button
                        variant={
                          transactionType === 'receipt' ? 'default' : 'outline'
                        }
                        onClick={() => setTransactionType('receipt')}
                        className="flex-1 sm:flex-none"
                      >
                        Receipt
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Form's main fields */}
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <div className="space-y-1">
                        <Label>Date</Label>
                        <Input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={formState.date}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9/]/g, '');
                            if (val.length === 8 && !val.includes('/')) {
                              val = `${val.slice(0, 2)}/${val.slice(
                                2,
                                4
                              )}/${val.slice(4)}`;
                            }
                            updateFormField('date', val);
                          }}
                        />
                        {errors['date'] && (
                          <p className="text-sm text-red-500">
                            {errors['date']}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>
                          {transactionType === 'payment'
                            ? 'Paid To'
                            : 'Received From'}
                        </Label>
                        <Input
                          placeholder={
                            transactionType === 'payment'
                              ? 'Enter payee name...'
                              : 'Enter payer name...'
                          }
                          value={formState.paid_to}
                          onChange={(e) =>
                            updateFormField('paid_to', e.target.value)
                          }
                        />
                        {errors['paid_to'] && (
                          <p className="text-sm text-red-500">
                            {errors['paid_to']}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Total Amount</Label>
                        <NumericFormat
                          customInput={Input}
                          thousandSeparator=","
                          decimalScale={2}
                          value={formState.total_amount}
                          onValueChange={({ value }) => {
                            updateFormField('total_amount', value);
                          }}
                        />
                        {errors['total_amount'] && (
                          <p className="text-sm text-red-500">
                            {errors['total_amount']}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Description (optional)</Label>
                        <Input
                          placeholder="Notes..."
                          value={formState.description}
                          onChange={(e) =>
                            updateFormField('description', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Splits */}
                    <div className="space-y-2 pt-4">
                      <div className="flex items-center justify-between pb-2">
                        <Label>Category Splits</Label>
                        <span className="text-sm text-slate-500">
                          Remaining: £{formatCurrency(calcRemaining())}
                        </span>
                      </div>
                      {errors['total'] && (
                        <p className="text-sm text-red-500">
                          {errors['total']}
                        </p>
                      )}

                      {formState.splits.map((split) => (
                        <div
                          key={split.id}
                          className="flex items-center gap-4 mb-2"
                        >
                          <div className="flex-1">
                            <SelectCategory
                              value={split.category_id}
                              onChange={(v) =>
                                updateSplit(split.id, 'category_id', v)
                              }
                              categories={categories}
                              transactionType={transactionType}
                            />
                            {errors[`${split.id}-category_id`] && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors[`${split.id}-category_id`]}
                              </p>
                            )}
                          </div>
                          <div className="w-28">
                            <NumericFormat
                              customInput={Input}
                              thousandSeparator=","
                              decimalScale={2}
                              value={split.amount}
                              onValueChange={({ value }) => {
                                updateSplit(split.id, 'amount', value);
                              }}
                            />
                            {errors[`${split.id}-amount`] && (
                              <p className="text-sm text-red-500 mt-1">
                                {errors[`${split.id}-amount`]}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSplit(split.id)}
                            disabled={formState.splits.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}

                      <Button variant="ghost" size="sm" onClick={addSplit}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Split
                      </Button>

                      <div className="mt-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Add / Delete Category
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-2xl">
                            <AlertDialogHeader>
                              <ADTitle>Manage Categories</ADTitle>
                              <ADDesc>
                                Add or delete categories for transactions. Note:
                                You cannot delete categories that are in use.
                              </ADDesc>
                            </AlertDialogHeader>

                            <div className="space-y-4">
                              {/* Add Category Form */}
                              <div className="space-y-4 border border-slate-300 dark:border-slate-700 rounded-lg p-4">
                                <h3 className="font-semibold">
                                  Add New Category
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                      placeholder="Enter category name..."
                                      value={newCategoryName}
                                      onChange={(e) =>
                                        setNewCategoryName(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                      value={newCategoryType}
                                      onValueChange={(v) =>
                                        setNewCategoryType(
                                          v as 'expense' | 'income'
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="expense">
                                          Expense
                                        </SelectItem>
                                        <SelectItem value="income">
                                          Income
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Description (Optional)</Label>
                                    <Input
                                      placeholder="Enter description..."
                                      value={newCategoryDesc}
                                      onChange={(e) =>
                                        setNewCategoryDesc(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                                <Button
                                  className="w-full mt-4"
                                  onClick={handleAddCategory}
                                  disabled={
                                    !newCategoryName || !newCategoryType
                                  }
                                >
                                  Add Category
                                </Button>
                              </div>

                              {/* List Categories */}
                              <div className=" border border-slate-300 dark:border-slate-700 rounded-lg">
                                <div className="flex items-center justify-between ">
                                  <h3 className="font-semibold px-4 py-6">
                                    {newCategoryType === 'expense'
                                      ? 'Expense'
                                      : 'Income'}{' '}
                                    Categories
                                  </h3>
                                </div>
                                <ScrollArea className="h-[300px]">
                                  <div className="space-y-2 ">
                                    {categories
                                      .filter((cat) => {
                                        // Filter out the bank category
                                        if (cat.name === 'Bank Account')
                                          return false;
                                        // Show only categories matching the selected type
                                        return newCategoryType === 'expense'
                                          ? cat.is_expense
                                          : !cat.is_expense;
                                      })
                                      .map((cat) => (
                                        <div
                                          key={cat.id}
                                          className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 "
                                        >
                                          <div>
                                            <p className="font-medium">
                                              {cat.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                              {cat.is_expense
                                                ? 'Expense'
                                                : 'Income'}
                                              {cat.description &&
                                                ` • ${cat.description}`}
                                            </p>
                                          </div>
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button variant="ghost" size="sm">
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <ADTitle>
                                                  Delete Category
                                                </ADTitle>
                                                <ADDesc>
                                                  Are you sure you want to
                                                  delete "{cat.name}"? This
                                                  action cannot be undone.
                                                </ADDesc>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  variant="delete"
                                                  onClick={() =>
                                                    handleDeleteCategory(cat.id)
                                                  }
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            </div>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Close</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingTx(null);
                          setFormState(createEmptyForm());
                          setErrors({});
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {editingTx ? 'Cancel Edit' : 'Clear'}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleSave}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {editingTx ? 'Update' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Table of existing transactions */}
          <Card className="dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-md font-semibold">
                Reconciliation Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReconciliationTransactionsList
                transactions={transactions}
                onReconcile={handleReconcile}
                onDelete={handleDeleteTransaction}
                onEdit={handleEditTransaction}
                selectedMonth={selectedMonth}
                reconciledDifference={reconciledDifference}
              />
            </CardContent>
          </Card>

          {/* Finalize button */}
          <div className="text-right">
            <Button
              onClick={handleFinalize}
              disabled={
                !isDifferenceZero ||
                closingBalance === null ||
                isMonthReconciled
              }
            >
              Finalise Reconciliation
            </Button>
            {difference !== 0 && !isMonthReconciled && (
              <p className="text-sm text-slate-500 mt-2">
                The difference must be zero before finalising.
              </p>
            )}
            {closingBalance === null && !isMonthReconciled && (
              <p className="text-sm text-slate-500 mt-2">
                Please enter a closing balance.
              </p>
            )}
          </div>
        </CardContent>
      </CardTreasury>
    </>
  );
}

/** Category select remains the same **/
function SelectCategory({
  value,
  onChange,
  categories,
  transactionType,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: TreasuryCategory[];
  transactionType: 'payment' | 'receipt';
}) {
  const relevant = categories.filter(
    (cat) =>
      cat.name !== 'Bank Account' &&
      (transactionType === 'payment' ? cat.is_expense : !cat.is_expense)
  );

  const selectValue = value === '' ? undefined : value;

  return (
    <Select value={selectValue} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent className="max-h-[300px] overflow-y-auto">
        {relevant.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DateInput({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Allow backspace and deletion
    if (value.length < e.target.value.length) {
      onChange(value);
      return;
    }

    // Format as user types
    value = value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 2) {
      const day = value.slice(0, 2);
      if (value.length >= 4) {
        const month = value.slice(2, 4);
        if (value.length >= 8) {
          const year = value.slice(4, 8);
          value = `${day}/${month}/${year}`;
        } else {
          value = `${day}/${month}${value.slice(4)}`;
        }
      } else {
        value = `${day}${value.slice(2)}`;
      }
    }

    onChange(value);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder="DD/MM/YYYY"
      disabled={disabled}
      className="bg-white dark:bg-slate-700"
    />
  );
}
