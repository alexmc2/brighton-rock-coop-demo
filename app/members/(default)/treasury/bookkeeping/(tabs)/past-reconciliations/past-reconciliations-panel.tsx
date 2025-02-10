// app/members/(default)/treasury/bookkeeping/(tabs)/past-reconciliations/past-reconciliations-panel.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/members/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/members/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/members/ui/alert-dialog';
import { Eye, Download, FileText, FileIcon, Trash2 } from 'lucide-react';
import PaginationPages from '@/components/members/ui/pagination-pages';
import { toast } from '@/components/members/ui/sonner';

import {
  deleteMonthlyBalance,
  listPastReconciliations,
} from '@/app/members/actions/treasury/bookkeeping-actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PastReconciliation = {
  id: string;
  month: string;
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenses: number;
  is_reconciled: boolean;
  reconciled_by: string | null;
  reconciled_at?: string | null;
  opening_date: string | null;
  closing_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

interface PastReconciliationsPanelProps {
  reconciliations: PastReconciliation[];
}

const ITEMS_PER_PAGE = 8;

export default function PastReconciliationsPanel({
  reconciliations: initialData,
}: PastReconciliationsPanelProps) {
  const router = useRouter();
  // Use local state only for pagination and UI animations.
  const [reconciliations, setReconciliations] =
    React.useState<PastReconciliation[]>(initialData);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [recToDelete, setRecToDelete] =
    React.useState<PastReconciliation | null>(null);
  const [recToDownload, setRecToDownload] =
    React.useState<PastReconciliation | null>(null);

  const totalRecords = reconciliations.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = reconciliations.slice(startIndex, endIndex);

  function formatCurrency(val: number) {
    return val.toLocaleString('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  async function handleDeleteConfirmed() {
    if (!recToDelete) return;
    const { success, error, deletedCount } = await deleteMonthlyBalance(
      recToDelete.id
    );

    if (!success) {
      toast.error('Error deleting reconciliation', {
        description: String(error),
      });
      setRecToDelete(null);
      return;
    }
    if (deletedCount === 0) {
      toast.error(`No row found to delete for ID: ${recToDelete.id}`);
      setRecToDelete(null);
      return;
    }

    // Instead of manually re-fetching, force a full refresh of the page:
    router.refresh();

    toast.success('Reconciliation deleted.');
    setRecToDelete(null);
  }

  function handleView(rec: PastReconciliation) {
    router.push(`/members/treasury/bookkeeping/report/${rec.month}`);
  }

  function handleDownloadText(rec: PastReconciliation) {
    const textContent = `Bank Reconciliation - ${rec.month}
Opening Balance: £${formatCurrency(rec.opening_balance)}
Closing Balance: £${formatCurrency(rec.closing_balance)}
Total Income: £${formatCurrency(rec.total_income)}
Total Expenses: £${formatCurrency(rec.total_expenses)}
Period: ${rec.opening_date ?? ''} to ${rec.closing_date ?? ''}
Reconciled At: ${rec.reconciled_at ?? ''}`;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconciliation-${rec.month}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setRecToDownload(null);
  }

  async function handleDownloadPDF(rec: PastReconciliation) {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const filename = `reconciliation-${rec.month}.pdf`;
      const element = document.createElement('div');
      element.innerHTML = `
        <h1>Bank Reconciliation</h1>
        <p><strong>Month:</strong> ${rec.month}</p>
        <p><strong>Opening:</strong> £${formatCurrency(rec.opening_balance)}</p>
        <p><strong>Closing:</strong> £${formatCurrency(rec.closing_balance)}</p>
        <p><strong>Total Income:</strong> £${formatCurrency(
          rec.total_income
        )}</p>
        <p><strong>Total Expenses:</strong> £${formatCurrency(
          rec.total_expenses
        )}</p>
        <p><strong>Reconciled At:</strong> ${
          rec.reconciled_at ?? 'Not reconciled'
        }</p>
      `;
      const opt: any = {
        margin: 10,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Failed to generate PDF.');
    }
    setRecToDownload(null);
  }

  return (
    <CardTreasury>
      <CardHeader>
        <CardTitle className="text-md font-semibold">
          Completed Bank Reconciliations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead>Opening Bal</TableHead>
              <TableHead>Closing Bal</TableHead>
              <TableHead>Total Income</TableHead>
              <TableHead>Total Expenses</TableHead>
              <TableHead>Closing Date</TableHead>
              {/* <TableHead>Reconciled At</TableHead> */}
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-muted-foreground"
                >
                  No reconciliations found.
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.month}</TableCell>
                  <TableCell>£{formatCurrency(r.opening_balance)}</TableCell>
                  <TableCell>£{formatCurrency(r.closing_balance)}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400">
                    £{formatCurrency(r.total_income)}
                  </TableCell>
                  <TableCell className="text-red-600 dark:text-red-400">
                    £{formatCurrency(r.total_expenses)}
                  </TableCell>
                  <TableCell>
                    {r.closing_date
                      ? new Date(r.closing_date).toLocaleDateString('en-GB')
                      : '-'}
                  </TableCell>
                  {/* <TableCell>
                    {r.reconciled_at
                      ? new Date(r.reconciled_at).toLocaleString('en-GB')
                      : '-'}
                  </TableCell> */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2 min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => handleView(r)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => setRecToDownload(r)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="whitespace-nowrap"
                        onClick={() => setRecToDelete(r)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalRecords > 0 && (
          <div className="mt-3">
            <PaginationPages
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalRecords}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={!!recToDelete}
        onOpenChange={() => setRecToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reconciliation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will permanently delete this instance of the
              bank reconciliation. The reconciliation can be recreated in the
              bank reconciliation tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              onClick={handleDeleteConfirmed}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!recToDownload}
        onOpenChange={() => setRecToDownload(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24"
              onClick={() => recToDownload && handleDownloadText(recToDownload)}
            >
              <FileText className="h-8 w-8 text-sky-600" />
              <span>Text File</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center justify-center gap-2 h-24"
              onClick={() => recToDownload && handleDownloadPDF(recToDownload)}
            >
              <FileIcon className="h-8 w-8 text-sky-600" />
              <span>PDF File</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CardTreasury>
  );
}
