// types/members/treasury.ts

export type TreasuryCategory = {
  id: string;
  name: string;
  description?: string;
  is_expense: boolean;
  created_at: string;
  updated_at: string;
  // Optionally is_bank?: boolean; if your DB has that
};

export type TransactionSplit = {
  id: string;
  transaction_id: string;
  category_id: string;
  amount: number;
  created_at: string;
  category: TreasuryCategory;
};

export type TreasuryTransaction = {
  id: string;
  date: Date;
  paid_to: string;
  description?: string;
  total_amount: number;
  is_reconciled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  reconciled_by?: string;
  reconciled_at?: string;
  splits: TransactionSplit[];
  created_by_user?: { email: string; full_name: string | null };
  reconciled_by_user?: { email: string; full_name: string | null };
  audit_log?: {
    created_by: string;
    created_at: string;
    last_modified_by?: string;
    last_modified_at?: string;
  };
};

export type MonthlyBalance = {
  id: string | null;
  month: string;
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenses: number;
  is_reconciled: boolean;
  reconciled_by?: string | null;
  reconciled_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
  reconciled_by_user?: { email: string; full_name: string | null } | null;
  opening_date: Date | null;
  closing_date: Date | null;
  has_prev_closing: boolean;
};

export type TransactionCreateInput = {
  date: Date;
  paid_to: string;
  description?: string;
  total_amount: number;
  type: 'payment' | 'receipt';
  splits: {
    category_id: string;
    amount: number;
  }[];
};

export type MonthlyBalanceCreateInput = {
  month: Date;
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expenses: number;
  is_reconciled?: boolean;
  opening_date?: Date | null;
  closing_date?: Date | null;
};

// Add to types/members/treasury.ts
export type TreasuryMonthlyDraft = {
  id: string;
  month: string;
  closing_balance: number | null;
  closing_date: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlyDraftInput = {
  month: string;
  closing_balance: number | null;
  closing_date: string | null;
};

export interface ActionSuccess<T> {
  success: true;
  data: T;
}

export interface ActionError {
  success: false;
  error: string;
}

export type ActionResponse<T> = ActionSuccess<T> | ActionError;

export interface ReconciliationPanelProps {
  initialMonth: Date;
  initialBalance: MonthlyBalance | null;
  initialTransactions: TreasuryTransaction[];
  categories: TreasuryCategory[];
}

export type FormState = {
  date: string;
  paid_to: string;
  description: string;
  total_amount: string;
  splits: {
    id: string;
    category_id: string;
    amount: string;
  }[];
};

export interface UpsertInput {
  categoryName: string;
  proposalName: string;
  annualBudget: number;
  fiscalYear: number;
}

export interface BudgetProposalsClientProps {
  fiscalYear: number;
  expenseCategories: TreasuryCategory[];
}

export interface OverviewItem {
  categoryId: string;
  categoryName: string;
  isExpense: boolean;
  budget: number;
  spent: number;
  transactions: IDBTransaction[];
}

export interface BudgetOverviewProps {
  items: OverviewItem[];
  initialYear: number;
  error?: string;
  warning?: string;
  selectedMonth?: number; // 1-12 representing Jan-Dec
}

/**
 * A single row from treasury_transaction_splits plus
 * the associated treasury_transactions and treasury_categories,
 * with ALL columns included.
 */
export interface TransactionSplitRow {
  // From treasury_transaction_splits
  id: string; // uuid, not null
  transaction_id: string; // fk => treasury_transactions.id
  category_id: string; // fk => treasury_categories.id
  amount: number; // numeric(10,2), not null
  created_at: string | null; // timestamp with time zone, default now

  // The one treasury_transactions row this split belongs to
  transaction: {
    id: string; // uuid
    date: string; // date (YYYY-MM-DD)
    paid_to: string; // text
    description: string | null; // text, nullable
    total_amount: number; // numeric(10,2)
    is_reconciled: boolean | null; // boolean, nullable, default false
    created_by: string; // uuid
    created_at: string | null; // timestamp with time zone, default now
    updated_at: string | null; // timestamp with time zone, default now
    reconciled_by: string | null; // uuid, nullable
    reconciled_at: string | null; // timestamp with time zone, nullable
  };

  // The one treasury_categories row this split belongs to
  category: {
    id: string; // uuid
    name: string; // text
    description: string | null; // text, nullable
    is_expense: boolean; // boolean, default true
    created_at: string | null; // timestamp with time zone, default now
    updated_at: string | null; // timestamp with time zone, default now
  };
}

export type CategoryPattern = {
  id: string;
  pattern: string;
  name: string;
  is_expense: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
  match_count: number;
  confidence_score: number;
};

export type CategoryPatternCreateInput = {
  pattern: string;
  name: string;
  is_expense: boolean;
  description?: string;
};
