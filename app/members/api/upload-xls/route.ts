import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx'; // MUST import as * to avoid "no default export" error
import {
  createTransaction,
  createCategory,
} from '@/app/members/actions/treasury/bookkeeping-actions';
import supabaseAdmin from '@/lib/members/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface StatementRow {
  Date: string;
  Description: string;
  Withdrawals: string | number;
  Deposits: string | number;
  Balance: string | number;
}

// Common keywords for different types of transactions
const EXPENSE_TYPES = {
  Maintenance: [
    'repair',
    'maintenance',
    'fix',
    'service',
    'cleaning',
    'paint',
    'plumbing',
    'electrical',
    'heating',
  ],
  Garden: [
    'garden',
    'plant',
    'seed',
    'compost',
    'allotment',
    'water',
    'irrigation',
  ],
  Utilities: ['water', 'gas', 'electric', 'energy', 'utility', 'utilities'],
  Insurance: ['insurance', 'insure', 'policy', 'cover'],
  'Secretary and PPS': [
    'secretary',
    'pps',
    'admin',
    'administration',
    'office',
    'computer',
    'software',
    'training',
  ],
  'Bank Charges': ['bank charge', 'fee', 'interest'],
  'Council Tax': ['council tax', 'ct payment'],
  Donations: ['donation', 'contribute', 'contribution'],
  'Rent to PFP': ['rent to', 'rent payment', 'pfp'],
  Shop: ['shop stock', 'shop supplies', 'retail expense'],
  Bees: ['bee', 'honey', 'hive'],
  Contingency: ['contingency', 'emergency', 'unexpected'],
  Investments: ['investment', 'shares', 'bond'],
  'House Expenses': ['house', 'property', 'void', 'vacant'],
  Miscellaneous: ['misc', 'other', 'general'],
} as const;

const INCOME_TYPES = {
  Rent: [
    'rent from',
    'tenant payment',
    'housing benefit',
    'hb payment',
    'rental income',
  ],
  Shop: ['shop sale', 'shop income', 'retail income'],
  'Bank Account': ['transfer', 'bank credit', 'interest earned'],
  'Other Income': [
    'donation received',
    'grant',
    'funding',
    'miscellaneous income',
  ],
} as const;

// Helper function to identify transaction type from description
function identifyTransactionType(desc: string, isExpense: boolean): string {
  const lower = desc.toLowerCase();

  if (isExpense) {
    // Special case for house numbers
    if (/house\s+\d+/i.test(desc)) {
      return 'House Expenses';
    }

    for (const [category, keywords] of Object.entries(EXPENSE_TYPES)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }
    return 'Miscellaneous';
  } else {
    for (const [category, keywords] of Object.entries(INCOME_TYPES)) {
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }
    return 'Other Income';
  }
}

// Helper function to ensure required categories exist
async function ensureRequiredCategories() {
  const requiredCategories = [
    // Income Categories
    {
      id: '3ac1a597-0e2c-4e5a-b4a3-0d5cb6374f6a',
      name: 'Bank Account',
      description: 'Cash at bank',
      is_expense: false,
    },
    {
      id: 'd9c937d9-c2a1-4399-9a84-9474d931ccfc',
      name: 'Other Income',
      description: 'Other income',
      is_expense: false,
    },
    {
      name: 'Rent',
      description: 'Rental income from tenants',
      is_expense: false,
    },
    {
      name: 'Shop',
      description: 'Income from shop sales',
      is_expense: false,
    },
    // Expense Categories
    {
      id: 'a4e15bd4-bc7d-4bfc-b635-6fd47d4a3494',
      name: 'Miscellaneous',
      description: 'Other expenses',
      is_expense: true,
    },
    {
      name: 'Maintenance',
      description: 'Building and property maintenance',
      is_expense: true,
    },
    {
      name: 'Garden',
      description: 'Garden and allotment expenses',
      is_expense: true,
    },
    {
      name: 'Utilities',
      description: 'Water, gas, electricity, and other utilities',
      is_expense: true,
    },
    {
      name: 'Insurance',
      description: 'Insurance policies and coverage',
      is_expense: true,
    },
    {
      name: 'Secretary and PPS',
      description: 'Administrative and secretarial expenses',
      is_expense: true,
    },
    {
      name: 'Bank Charges',
      description: 'Bank fees and charges',
      is_expense: true,
    },
    {
      name: 'Council Tax',
      description: 'Council tax payments',
      is_expense: true,
    },
    {
      name: 'Donations',
      description: 'Charitable donations and contributions',
      is_expense: true,
    },
    {
      name: 'Rent to PFP',
      description: 'Rent payments to PFP',
      is_expense: true,
    },
    {
      name: 'Shop',
      description: 'Shop expenses and supplies',
      is_expense: true,
    },
    {
      name: 'Bees',
      description: 'Beekeeping expenses',
      is_expense: true,
    },
    {
      name: 'Contingency',
      description: 'Emergency and unexpected expenses',
      is_expense: true,
    },
    {
      name: 'Investments',
      description: 'Investment-related expenses',
      is_expense: true,
    },
    {
      name: 'House Expenses',
      description: 'Individual house-related expenses',
      is_expense: true,
    },
  ];

  for (const category of requiredCategories) {
    const { data } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id')
      .eq('name', category.name)
      .single();

    if (!data) {
      await supabaseAdmin.from('demo_treasury_categories').insert(category);
    }
  }
}

// Find an existing category that matches this transaction type
async function findMatchingCategory(
  desc: string,
  isExpense: boolean
): Promise<string> {
  // Changed return type to always return a string
  const transactionType = identifyTransactionType(desc, isExpense);

  const { data: categories } = await supabaseAdmin
    .from('demo_treasury_categories')
    .select('id, name')
    .eq('is_expense', isExpense);

  if (!categories) {
    // Return default fallback categories
    return isExpense
      ? 'a4e15bd4-bc7d-4bfc-b635-6fd47d4a3494'
      : 'd9c937d9-c2a1-4399-9a84-9474d931ccfc';
  }

  // Try to find a category matching our identified type
  const match = categories.find(
    (cat) => cat.name.toLowerCase() === transactionType.toLowerCase()
  );

  return (
    match?.id ||
    (isExpense
      ? 'a4e15bd4-bc7d-4bfc-b635-6fd47d4a3494'
      : 'd9c937d9-c2a1-4399-9a84-9474d931ccfc')
  );
}

// Create a new category if needed
async function getOrCreateCategory(
  desc: string,
  isExpense: boolean
): Promise<string> {
  // First try to find a matching category
  const categoryId = await findMatchingCategory(desc, isExpense);
  return categoryId; // Always returns a valid category ID
}

export async function POST(req: NextRequest) {
  console.log('===== [UPLOAD-XLS] POST triggered (Next.js 14) =====');

  try {
    // Ensure required categories exist before processing
    await ensureRequiredCategories();

    console.log('...Parsing formData()');
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.error('No file => returning 400');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    console.log('...File found =>', file.name, 'size=', file.size);

    // Convert file => arrayBuffer => Node Buffer
    console.log('...Reading into buffer');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse with XLSX
    console.log('...Parsing XLSX from buffer');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    console.log('...SheetNames =>', sheetNames);

    if (!sheetNames.length) {
      console.error('No sheets => returning 400');
      return NextResponse.json(
        { error: 'No sheets in workbook' },
        { status: 400 }
      );
    }

    // We'll parse the first sheet
    const firstSheet = sheetNames[0];
    console.log('...Using first sheet =>', firstSheet);
    const worksheet = workbook.Sheets[firstSheet];

    // Detect format by checking cell A1
    const a1Value = worksheet?.['A1']?.v;
    const isStatementFormat = a1Value === 'Date';
    console.log(
      '...Detected format:',
      isStatementFormat ? 'Statement' : 'Original'
    );

    // Parse based on detected format
    let rawRows: StatementRow[];
    if (isStatementFormat) {
      console.log('...Parsing as statement format');
      rawRows = XLSX.utils.sheet_to_json<StatementRow>(worksheet, {
        header: ['Date', 'Description', 'Withdrawals', 'Deposits', 'Balance'],
        range: 1, // Skip header row
        defval: '',
        blankrows: false,
      });
    } else {
      console.log('...Parsing as original format (starting from row 5)');
      rawRows = XLSX.utils.sheet_to_json<StatementRow>(worksheet, {
        range: 4,
        header: [
          '', // skip blank col A
          'Date',
          'Description',
          'Withdrawals',
          'Deposits',
          'Balance',
        ],
        defval: '',
        blankrows: false,
      });
    }

    console.log('...rawRows =>', rawRows);

    let importedCount = 0;
    let duplicatesCount = 0;

    // Process each row
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      console.log(`----- Row #${i + 1}`, row);

      // Skip if it's a header row or empty
      const rawDate = (row.Date || '').trim();
      if (!rawDate || rawDate.toLowerCase() === 'date') {
        console.log('.....Skipping header/blank row =>', rawDate);
        continue;
      }

      // B) Parse the date. If invalid => skip
      const dateObj = parseBankDate(rawDate);
      if (isNaN(dateObj.getTime())) {
        console.log('.....Invalid date => skip row =>', rawDate);
        continue;
      }
      console.log('.....Parsed Date =>', dateObj.toISOString());

      // C) Parse withdrawals & deposits
      const wd = parseFloatCell(row.Withdrawals);
      const dp = parseFloatCell(row.Deposits);

      // D) Description
      const desc = (row.Description || '').trim();
      console.log('.....wd=', wd, 'dp=', dp, 'desc=', desc);

      // E) Decide payment vs. receipt
      let amount = 0;
      let txType: 'payment' | 'receipt';
      if (wd > 0) {
        amount = wd;
        txType = 'payment';
      } else {
        amount = dp;
        txType = 'receipt';
      }
      if (amount <= 0) {
        console.log('.....No money => skip row');
        continue;
      }

      // F) Classify
      const categoryId = await getOrCreateCategory(desc, txType === 'payment');
      console.log('.....Category ID =>', categoryId);

      // G) Check for duplicates
      const alreadyExists = await checkDuplicateTransaction(
        dateObj,
        desc,
        amount,
        categoryId
      );
      if (alreadyExists) {
        console.log('.....Duplicate found => skip row');
        duplicatesCount++;
        continue;
      }

      // H) Build & create transaction
      const txInput = {
        date: dateObj,
        paid_to: desc,
        description: desc,
        total_amount: amount,
        type: txType,
        splits: [
          {
            category_id: categoryId,
            amount,
          },
        ],
      };

      console.log('.....Creating transaction =>', txInput);
      const result = await createTransaction(txInput);
      if (result.success) {
        console.log('.....Success => inserted transaction');
        importedCount++;
      } else {
        console.error('.....Failure =>', result.error);
      }
    }

    console.log(
      '===== DONE. Imported =>',
      importedCount,
      'transactions, Duplicates =>',
      duplicatesCount,
      '====='
    );
    return NextResponse.json({ importedCount, duplicatesCount });
  } catch (err: any) {
    console.error('Error uploading XLS =>', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** CHECK for existing transaction with identical date, paid_to, total_amount, single-split category/amount. */
async function checkDuplicateTransaction(
  date: Date,
  paid_to: string,
  amount: number,
  categoryId: string
) {
  // Find all tx with same date, paid_to, total_amount
  const dateStr = date.toISOString().slice(0, 10); // compare as YYYY-MM-DD
  const { data, error } = await supabaseAdmin
    .from('demo_treasury_transactions')
    .select(
      `
       id,
       date,
       paid_to,
       total_amount,
       splits:demo_treasury_transaction_splits(*)
      `
    )
    .eq('date', dateStr)
    .eq('paid_to', paid_to)
    .eq('total_amount', amount);

  if (error || !data) return false;
  if (!data.length) return false;

  // For each matched, check if it has exactly 1 split with same category + amount
  for (const tx of data) {
    if (
      tx.splits?.length === 1 &&
      tx.splits[0].category_id === categoryId &&
      parseFloat(tx.splits[0].amount) === amount
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Parses strings like "20 NOV 24" => Date in 2024.
 * Returns an invalid Date (getTime()=NaN) if it can't parse.
 */
function parseBankDate(raw: string): Date {
  const trimmed = raw.trim();
  const parts = trimmed.split(' ');
  if (parts.length === 3) {
    let [day, month, yr] = parts;
    // 2-digit year => 20xx
    if (yr.length === 2) {
      yr = '20' + yr;
    }
    return new Date(`${day} ${month} ${yr} 12:00:00`);
  }
  // fallback => might become invalid
  return new Date(trimmed);
}

/** Convert numeric fields (like "234.0" or "826.40") => number. */
function parseFloatCell(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/,/g, ''));
}
