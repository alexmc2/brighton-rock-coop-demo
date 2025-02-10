// app/members/(default)/treasury/budgets/(tabs)/budget-proposals/budget-spreadsheet.tsx

'use client';

import dynamic from 'next/dynamic';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useSelectedYear } from '@/app/members/(default)/treasury/budgets/budgets-provider';

const ReactGrid = dynamic(
  () =>
    import('@silevis/reactgrid')
      .then((mod) => mod.ReactGrid)
      .catch(() => {
        console.error('Failed to load ReactGrid');
        const FallbackComponent = () => <div>Spreadsheet failed to load</div>;
        return FallbackComponent;
      }),
  { ssr: false }
);

import {
  Row,
  Column,
  Cell,
  TextCell,
  NonEditableCell,
} from '@silevis/reactgrid';

import { toast } from 'sonner';
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/members/ui/select';
import ThemedBounceLoader from '@/components/members/ui/ThemedBounceLoader';

import {
  upsertBudgetLine,
  deleteBudgetForYear,
} from '@/app/members/actions/treasury/budget-actions';

// Multi-cell copy/cut/paste, resize, reorder
import {
  handleCopy,
  handleCut,
  handlePaste,
} from '@/components/members/utils/grid-clipboard-handlers';
import { handleResizeColumn } from '@/components/members/utils/grid-resize-handlers';
import {
  handleRowReorder,
  handleColumnReorder,
} from '@/components/members/utils/grid-reorder-handlers';
import {
  Card,
  CardTreasury,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/members/ui/card';
import { Button } from '@/components/members/ui/button';

////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////

interface Props {
  /** The "fiscalYear" from the server page param. */
  fiscalYear: number;

  /** The expense categories from DB (passed by the server page). */
  expenseCategories: {
    id: string;
    name: string;
    is_expense: boolean;
    description?: string | null;
  }[];

  /** The proposals from treasury_annual_budgets for this year. */
  existingProposals: {
    id: string;
    category_id: string;
    proposal_name: string;
    annual_budget: number;
    notes?: string | null;
  }[];
}

type RowKind =
  | 'headings'
  | 'income-header'
  | 'income-data'
  | 'exp-header'
  | 'exp-data'
  | 'separator'
  | 'income-total'
  | 'exp-total'
  | 'net-total'
  | 'break-even';

interface BudgetRow {
  kind: RowKind;
  label: string; // The text in the first column
  p1: number;
  p2: number;
  p3: number;
  agreed: number;
}

////////////////////////////////////////////////////////////////////////////////
// Main
////////////////////////////////////////////////////////////////////////////////

export default function BudgetProposalsClient({
  fiscalYear,
  expenseCategories,
  existingProposals,
}: Props) {
  const { theme } = useTheme();

  // Instead of storing our own "selectedYear" from `fiscalYear`, we rely on global context.
  const { selectedYear, setSelectedYear } = useSelectedYear();

  // (Removed the old `useEffect(() => { if (fiscalYear !== selectedYear) setSelectedYear(...) })`)
  // Because the provider is the single source of truth. If we want to sync them,
  // either let the provider handle it, or let the layout set initialYear.

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [isSaving, setIsSaving] = useState(false);

  // Build initial columns
  const [columns, setColumns] = useState<Column[]>([
    { colIndex: 0, width: 250 },
    { colIndex: 1, width: 160 },
    { colIndex: 2, width: 160 },
    { colIndex: 3, width: 160 },
    { colIndex: 4, width: 160 },
  ]);

  // Our main data array
  const [rowsData, setRowsData] = useState<BudgetRow[]>(() =>
    buildInitialRows(expenseCategories)
  );

  // Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Undo/redo
  const historyStack = useRef<BudgetRow[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newData: BudgetRow[]) => {
    const currentIndex = historyStack.current.length - 1;
    const truncated = historyStack.current.slice(0, currentIndex + 1);
    truncated.push(JSON.parse(JSON.stringify(newData)));
    historyStack.current = truncated;
    setHistoryIndex(truncated.length - 1);
  }, []);

  function handleUndo() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setRowsData(JSON.parse(JSON.stringify(historyStack.current[newIndex])));
      setHistoryIndex(newIndex);
    }
  }

  function handleRedo() {
    if (historyIndex + 1 < historyStack.current.length) {
      const newIndex = historyIndex + 1;
      setRowsData(JSON.parse(JSON.stringify(historyStack.current[newIndex])));
      setHistoryIndex(newIndex);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Load data from localStorage or from `existingProposals` whenever
  // "selectedYear" changes.
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!isClient) return;

    // 1) Start with a fresh skeleton
    let newRows = buildInitialRows(expenseCategories);

    // 2) Try localStorage for the user's data for this year
    const savedData = localStorage.getItem(`budget-data-${selectedYear}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData) as BudgetRow[];
        computeFormulas(parsed);
        newRows = parsed;
      } catch (err) {
        console.error('Failed to parse local budget data:', err);
      }
    }

    // 3) Overlay the DB proposals for this year
    const catMap: Record<string, string> = {};
    expenseCategories.forEach((c) => {
      catMap[c.id] = c.name;
    });

    function getColumnIndexForProposalName(name: string) {
      switch (name) {
        case 'Proposal 1':
          return 'p1';
        case 'Proposal 2':
          return 'p2';
        case 'Proposal 3':
          return 'p3';
        case 'This budget agreed':
          return 'agreed';
        default:
          return null;
      }
    }

    for (const proposal of existingProposals) {
      const catName = catMap[proposal.category_id];
      if (!catName) continue;
      // ensure row exists
      let row = newRows.find(
        (r) => r.kind === 'exp-data' && r.label.trim() === catName.trim()
      );
      if (!row) {
        row = {
          kind: 'exp-data',
          label: catName,
          p1: 0,
          p2: 0,
          p3: 0,
          agreed: 0,
        };
        newRows.push(row);
      }
      const colKey = getColumnIndexForProposalName(proposal.proposal_name);
      if (colKey) {
        (row as any)[colKey] = proposal.annual_budget ?? 0;
      }
    }

    // 4) Recompute
    computeFormulas(newRows);
    setRowsData([...newRows]);

    // 5) Record in undo/redo history
    pushHistory(newRows);
  }, [
    isClient,
    selectedYear,
    existingProposals,
    expenseCategories,
    pushHistory,
  ]);

  // Save to localStorage whenever rowsData changes
  useEffect(() => {
    if (isClient && rowsData) {
      localStorage.setItem(
        `budget-data-${selectedYear}`,
        JSON.stringify(rowsData)
      );
    }
  }, [rowsData, selectedYear, isClient]);

  /////////////////////////////////////////////////////////////////////////////
  // ReactGrid building
  /////////////////////////////////////////////////////////////////////////////
  const reactGridRows: Row[] = rowsData.map((_, idx) => ({
    rowIndex: idx,
    height: 40,
  }));

  const cells: Cell[] = [];
  for (let rowIndex = 0; rowIndex < rowsData.length; rowIndex++) {
    const row = rowsData[rowIndex];
    cells.push(buildLabelCell(row, rowIndex));
    cells.push(
      buildNumberCell(row, rowIndex, 1, 'p1'),
      buildNumberCell(row, rowIndex, 2, 'p2'),
      buildNumberCell(row, rowIndex, 3, 'p3'),
      buildNumberCell(row, rowIndex, 4, 'agreed')
    );
  }

  function buildLabelCell(row: BudgetRow, rowIndex: number): Cell {
    const isHeader = row.kind === 'headings';
    const isSpecial = ['income-header', 'exp-header'].includes(row.kind);
    const isTotal = [
      'income-total',
      'exp-total',
      'net-total',
      'break-even',
    ].includes(row.kind);

    const cellStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontWeight: isHeader || isSpecial || isTotal ? 'bold' : 'normal',
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    };

    return {
      rowIndex,
      colIndex: 0,
      Template:
        row.kind === 'exp-data' || row.kind === 'income-data'
          ? TextCell
          : NonEditableCell,
      props: {
        text: row.label,
        value: row.label,
        style: cellStyle,
        onTextChanged: (newText: string) => {
          if (row.kind === 'exp-data' || row.kind === 'income-data') {
            const updated = [...rowsData];
            updated[rowIndex].label = newText;
            setRowsData(updated);
            pushHistory(updated);
          }
        },
      },
    };
  }

  function buildNumberCell(
    row: BudgetRow,
    rowIndex: number,
    colIndex: number,
    field: 'p1' | 'p2' | 'p3' | 'agreed'
  ): Cell {
    const isHeader = row.kind === 'headings';
    const isTotal = [
      'income-total',
      'exp-total',
      'net-total',
      'break-even',
    ].includes(row.kind);
    const isData = row.kind.endsWith('-data');

    const cellStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isHeader ? 'center' : 'flex-end',
      fontWeight: isHeader || isTotal ? 'bold' : 'normal',
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
      color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
    };

    if (isHeader) {
      let heading = '';
      if (colIndex === 1) heading = 'Proposal 1';
      if (colIndex === 2) heading = 'Proposal 2';
      if (colIndex === 3) heading = 'Proposal 3';
      if (colIndex === 4) heading = 'Agreed';
      return {
        rowIndex,
        colIndex,
        Template: NonEditableCell,
        props: {
          value: heading,
          style: cellStyle,
        },
      };
    }

    const val = row[field];
    const formattedVal =
      typeof val === 'number' && val !== 0
        ? val.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '';

    return {
      rowIndex,
      colIndex,
      Template: isData ? TextCell : NonEditableCell,
      props: {
        value: formattedVal,
        text: formattedVal,
        style: cellStyle,
        onTextChanged: (newText: string) => {
          if (!isData) return;
          const parsed = parseFloat(newText.replace(/,/g, ''));
          if (!isNaN(parsed)) {
            const updated = [...rowsData];
            updated[rowIndex][field] = Math.round(parsed * 100) / 100;
            computeFormulas(updated);
            setRowsData(updated);
            pushHistory(updated);
          }
        },
      },
    };
  }

  /////////////////////////////////////////////////////////////////////////////
  // Render
  /////////////////////////////////////////////////////////////////////////////
  const gridTheme = {
    gap: {
      width: '1px',
      color: theme === 'dark' ? '#1b5c87' : '#e2e8f0',
    },
    line: {
      backgroundColor: theme === 'dark' ? '#1b5c87' : '#e2e8f0',
      size: '0px',
    },
    focusIndicator: {
      border: {
        color: theme === 'dark' ? '#fcc218' : '#2563eb',
        style: 'solid',
        width: '2px',
      },
    },
    selectionIndicator: {
      background:
        theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)',
      border: {
        color: theme === 'dark' ? '#fcc218' : '#2563eb',
        style: 'solid',
        width: '1px',
      },
    },
    fillHandle: {
      border: {
        color: theme === 'dark' ? '#3b82f6' : '#2563eb',
        style: 'solid',
        width: '1px',
      },
    },
    gridWrapper: {
      fontSize: 16,
      backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
    },
    // cellContainer: {
    //   background: theme === 'dark' ? '#0f172a' : '#ffffff',
    // },
    // area: {
    //   border: {
    //     color: theme === 'dark' ? '#020617' : '#e2e8f0',
    //     style: 'solid',
    //     width: '1px',
    //   },
    // },
    // paneContainer: {
    //   top: {
    //     background: theme === 'dark' ? '#0f172a' : '#ffffff',
    //     boxShadow: 'none',
    //   },
    //   right: {
    //     background: theme === 'dark' ? '#0f172a' : '#ffffff',
    //     boxShadow: 'none',
    //   },
    //   bottom: {
    //     background: theme === 'dark' ? '#0f172a' : '#ffffff',
    //     boxShadow: 'none',
    //   },
    //   left: {
    //     background: theme === 'dark' ? '#0f172a' : '#ffffff',
    //     boxShadow: 'none',
    //   },
    // },
  };

  /////////////////////////////////////////////////////////////////////////////
  // Event handlers
  /////////////////////////////////////////////////////////////////////////////
  function handleAddExpense() {
    // Insert a new row after the last exp-data
    const lastExpIndex = [...rowsData]
      .map((r, i) => ({ kind: r.kind, i }))
      .reverse()
      .findIndex((x) => x.kind === 'exp-data');
    if (lastExpIndex < 0) {
      toast.error('No expense rows found.');
      return;
    }
    const forwardIndex = rowsData.length - 1 - lastExpIndex;
    const newRow: BudgetRow = {
      kind: 'exp-data',
      label: 'New Expense',
      p1: 0,
      p2: 0,
      p3: 0,
      agreed: 0,
    };
    const updated = [...rowsData];
    updated.splice(forwardIndex + 1, 0, newRow);
    computeFormulas(updated);
    setRowsData(updated);
    pushHistory(updated);
  }

  function handleRemoveLastExpense() {
    const lastExpIndex = [...rowsData]
      .map((r, i) => ({ kind: r.kind, i }))
      .reverse()
      .findIndex((x) => x.kind === 'exp-data');
    if (lastExpIndex < 0) {
      toast.error('No expense rows found to remove.');
      return;
    }
    const forwardIndex = rowsData.length - 1 - lastExpIndex;
    const updated = [...rowsData];
    updated.splice(forwardIndex, 1);
    computeFormulas(updated);
    setRowsData(updated);
    pushHistory(updated);
  }

  function handleSaveClick() {
    setShowConfirmDialog(true);
  }

  async function handleConfirmSave() {
    setShowConfirmDialog(false);
    setIsSaving(true);
    try {
      // First save income data
      const incomeRow = rowsData.find((r) => r.kind === 'income-total');
      if (incomeRow) {
        const lines = [
          { name: 'Proposal 1', amount: incomeRow.p1 },
          { name: 'Proposal 2', amount: incomeRow.p2 },
          { name: 'Proposal 3', amount: incomeRow.p3 },
          { name: 'This budget agreed', amount: incomeRow.agreed },
        ];
        for (const line of lines) {
          if (line.amount !== 0) {
            await upsertBudgetLine({
              categoryName: 'Rent',
              proposalName: line.name,
              annualBudget: line.amount,
              fiscalYear: selectedYear,
              isExpense: false,
            });
          }
        }
      }

      // Then save expense data
      for (const row of rowsData) {
        if (row.kind !== 'exp-data') continue;
        const catName = row.label.trim();
        if (!catName) continue;

        const lines = [
          { name: 'Proposal 1', amount: row.p1 },
          { name: 'Proposal 2', amount: row.p2 },
          { name: 'Proposal 3', amount: row.p3 },
          { name: 'This budget agreed', amount: row.agreed },
        ];
        for (const line of lines) {
          if (line.amount !== 0) {
            await upsertBudgetLine({
              categoryName: catName,
              proposalName: line.name,
              annualBudget: line.amount,
              fiscalYear: selectedYear,
              isExpense: true,
            });
          }
        }
      }

      toast.success(`Saved all lines for year ${selectedYear}`);
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDeleteClick() {
    setShowDeleteDialog(true);
  }

  async function handleDeleteBudget() {
    setShowDeleteDialog(false);
    setIsSaving(true);
    try {
      await deleteBudgetForYear(selectedYear);
      localStorage.removeItem(`budget-data-${selectedYear}`);
      const fresh = buildInitialRows(expenseCategories);
      computeFormulas(fresh);
      setRowsData(fresh);
      toast.success(`Deleted all budget lines for year ${selectedYear}`);
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CardTreasury className="sm:p-4 p-0">
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <ThemedBounceLoader loading={true} />
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-lg">
          {' '}
          Budget Proposals for the {selectedYear} Financial Year
        </CardTitle>
        <div className="space-y-1">
          <CardDescription className="text-sm text-gray-500 dark:text-gray-300">
            (1 April {selectedYear - 1} to 31 March {selectedYear})
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Year Selection */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-semibold">Select Budget Year:</label>
          <Select
            value={String(selectedYear)}
            onValueChange={(val) => setSelectedYear(Number(val))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spreadsheet */}
        <div className="space-y-4">
          <div className="relative">
            <div className="overflow-x-auto -mx-6 px-6 pb-2 touch-pan-x overscroll-x-contain will-change-scroll">
              <div className="min-w-[900px] pointer-events-auto">
                <ReactGrid
                  rows={reactGridRows}
                  columns={columns}
                  cells={cells}
                  stickyTopRows={1}
                  enableRowSelectionOnFirstColumn={false}
                  enableColumnSelectionOnFirstRow={false}
                  onResizeColumn={(width, colIdx) =>
                    handleResizeColumn(width, colIdx, setColumns)
                  }
                  disableFillHandle={true}
                  onCopy={handleCopy}
                  onCut={handleCut}
                  onPaste={handlePaste}
                  initialFocusLocation={{ rowIndex: 1, colIndex: 1 }}
                  styles={gridTheme}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-none sm:flex sm:gap-2 gap-2 sm:w-auto w-full">
            <Button
              variant="outline"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="sm:w-auto w-full"
            >
              Undo
            </Button>
            <Button
              variant="outline"
              onClick={handleRedo}
              disabled={historyIndex + 1 >= historyStack.current.length}
              className="sm:w-auto w-full"
            >
              Redo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-none sm:flex sm:gap-2 gap-2 sm:w-auto w-full">
            <Button
              variant="secondary"
              onClick={handleAddExpense}
              className="sm:w-auto w-full"
            >
              Add Expense
            </Button>
            <Button
              variant="secondary"
              onClick={handleRemoveLastExpense}
              className="sm:w-auto w-full"
            >
              Remove Last Expense
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-none sm:flex sm:gap-2 gap-2 sm:w-auto w-full">
            <Button
              onClick={handleSaveClick}
              className="sm:w-auto w-full"
              variant="default"
            >
              Save Budget
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              className="sm:w-auto w-full"
            >
              Delete Budget
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Save Budget</AlertDialogTitle>
              <AlertDialogDescription>
                This will store your &quot;Agreed&quot; and &quot;Proposal&quot;
                amounts for {selectedYear} in the database. Proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSave}>
                Yes, Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all proposals for year{' '}
                {selectedYear}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBudget}
                className="bg-red-600 dark:bg-red-600"
              >
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </CardTreasury>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////

function buildInitialRows(expCats: Props['expenseCategories']): BudgetRow[] {
  const rows: BudgetRow[] = [];
  rows.push({
    kind: 'headings',
    label: '',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  rows.push({
    kind: 'income-header',
    label: 'Income',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });
  rows.push({
    kind: 'income-data',
    label: 'Per Person',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });
  rows.push({
    kind: 'income-data',
    label: 'x 12',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });
  rows.push({
    kind: 'income-data',
    label: 'x 52',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  rows.push({
    kind: 'income-total',
    label: 'Total Income',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  rows.push({
    kind: 'separator',
    label: '',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  rows.push({
    kind: 'exp-header',
    label: 'Expenditure',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  for (const cat of expCats) {
    rows.push({
      kind: 'exp-data',
      label: cat.name,
      p1: 0,
      p2: 0,
      p3: 0,
      agreed: 0,
    });
  }

  rows.push({
    kind: 'separator',
    label: '',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  rows.push({
    kind: 'exp-total',
    label: 'Expenditure total',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });
  rows.push({
    kind: 'net-total',
    label: 'Total income less expenditure',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });
  rows.push({
    kind: 'break-even',
    label: 'Break Even Rent Calculation',
    p1: 0,
    p2: 0,
    p3: 0,
    agreed: 0,
  });

  computeFormulas(rows);
  return rows;
}

function computeFormulas(rows: BudgetRow[]) {
  const perPerson = rows.find(
    (r) => r.kind === 'income-data' && r.label === 'Per Person'
  );
  const x12 = rows.find((r) => r.kind === 'income-data' && r.label === 'x 12');
  const x52 = rows.find((r) => r.kind === 'income-data' && r.label === 'x 52');
  const incomeTotal = rows.find((r) => r.kind === 'income-total');
  const expTotal = rows.find((r) => r.kind === 'exp-total');
  const netTotal = rows.find((r) => r.kind === 'net-total');
  const breakEven = rows.find((r) => r.kind === 'break-even');

  if (perPerson && x12 && x52 && incomeTotal) {
    x12.p1 = perPerson.p1 * 12;
    x12.p2 = perPerson.p2 * 12;
    x12.p3 = perPerson.p3 * 12;
    x12.agreed = perPerson.agreed * 12;

    x52.p1 = x12.p1 * 52;
    x52.p2 = x12.p2 * 52;
    x52.p3 = x12.p3 * 52;
    x52.agreed = x12.agreed * 52;

    incomeTotal.p1 = x52.p1;
    incomeTotal.p2 = x52.p2;
    incomeTotal.p3 = x52.p3;
    incomeTotal.agreed = x52.agreed;
  }

  if (expTotal) {
    let s1 = 0,
      s2 = 0,
      s3 = 0,
      sa = 0;
    for (const r of rows) {
      if (r.kind === 'exp-data') {
        s1 += r.p1;
        s2 += r.p2;
        s3 += r.p3;
        sa += r.agreed;
      }
    }
    expTotal.p1 = s1;
    expTotal.p2 = s2;
    expTotal.p3 = s3;
    expTotal.agreed = sa;
  }

  if (netTotal && incomeTotal && expTotal) {
    netTotal.p1 = incomeTotal.p1 - expTotal.p1;
    netTotal.p2 = incomeTotal.p2 - expTotal.p2;
    netTotal.p3 = incomeTotal.p3 - expTotal.p3;
    netTotal.agreed = incomeTotal.agreed - expTotal.agreed;
  }

  if (breakEven && expTotal) {
    breakEven.p1 = expTotal.p1 / 52 / 12;
    breakEven.p2 = expTotal.p2 / 52 / 12;
    breakEven.p3 = expTotal.p3 / 52 / 12;
    breakEven.agreed = expTotal.agreed / 52 / 12;
  }

  for (const r of rows) {
    r.p1 = round(r.p1);
    r.p2 = round(r.p2);
    r.p3 = round(r.p3);
    r.agreed = round(r.agreed);
  }
}

function round(num: number) {
  return Math.round(num * 100) / 100;
}
