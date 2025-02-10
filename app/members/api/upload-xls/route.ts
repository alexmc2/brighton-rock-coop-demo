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

// Helper function to identify transaction type from description
async function identifyTransactionType(
  desc: string,
  isExpense: boolean
): Promise<string> {
  // Get patterns from the database, ordered by confidence score (highest first)
  const { data: patterns } = await supabaseAdmin
    .from('demo_treasury_category_patterns')
    .select('*')
    .eq('is_expense', isExpense)
    .order('confidence_score', { ascending: false });

  if (!patterns || patterns.length === 0) {
    return isExpense ? 'Miscellaneous' : 'Other Income';
  }

  // Normalize the description for matching
  const normalizedDesc = desc.toUpperCase().trim();

  // Try to match each pattern
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(normalizedDesc)) {
        // Increment the match count for this pattern
        await supabaseAdmin
          .from('demo_treasury_category_patterns')
          .update({
            match_count: pattern.match_count + 1,
            last_matched_at: new Date().toISOString(),
          })
          .eq('id', pattern.id);

        return pattern.name;
      }
    } catch (err) {
      console.error(`Invalid pattern ${pattern.pattern}:`, err);
      continue;
    }
  }

  // If no patterns match, return default category
  return isExpense ? 'Miscellaneous' : 'Other Income';
}

// Helper function to ensure required categories exist
async function ensureRequiredCategories() {
  // Get all existing categories in one query
  const { data: existingCategories } = await supabaseAdmin
    .from('demo_treasury_categories')
    .select('name');

  const existingNames = new Set(existingCategories?.map((c) => c.name) || []);

  const requiredCategories = [
    // Income Categories
    {
      name: 'Bank Account',
      description: 'Cash at bank',
      is_expense: false,
    },
    {
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
      name: 'Rent',
      description: 'Rent payments',
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

  // Filter to only categories that don't exist
  const categoriesToCreate = requiredCategories.filter(
    (cat) => !existingNames.has(cat.name)
  );

  // Batch insert if any missing
  if (categoriesToCreate.length > 0) {
    await supabaseAdmin
      .from('demo_treasury_categories')
      .insert(categoriesToCreate);
  }
}

/** CHECK for existing transaction with identical date, paid_to, total_amount, single-split category/amount. */
async function checkDuplicateTransaction(
  date: Date,
  paid_to: string,
  amount: number,
  categoryId: string
) {
  const dateStr = date.toISOString().slice(0, 10);

  // Query with joins to get transactions and their splits in one go
  const { data, error } = await supabaseAdmin
    .from('demo_treasury_transactions')
    .select(
      `
      id,
      splits:demo_treasury_transaction_splits!inner(
        category_id,
        amount
      )
    `
    )
    .eq('date', dateStr)
    .eq('paid_to', paid_to)
    .eq('total_amount', amount)
    .eq('demo_treasury_transaction_splits.category_id', categoryId)
    .eq('demo_treasury_transaction_splits.amount', amount)
    .single();

  return !!data;
}

// Cache for categories to avoid repeated queries
let categoriesCache:
  | { id: string; name: string; is_expense: boolean }[]
  | null = null;

// Find an existing category that matches this transaction type
async function findMatchingCategory(
  desc: string,
  isExpense: boolean
): Promise<string> {
  // Load categories cache if needed
  if (!categoriesCache) {
    const { data } = await supabaseAdmin
      .from('demo_treasury_categories')
      .select('id, name, is_expense');
    categoriesCache = data || [];
  }

  const transactionType = await identifyTransactionType(desc, isExpense);

  // Filter categories by expense type
  const relevantCategories = categoriesCache.filter(
    (cat) => cat.is_expense === isExpense
  );

  // Try to find a category matching our identified type
  const match = relevantCategories.find(
    (cat) => cat.name.toLowerCase() === transactionType.toLowerCase()
  );

  if (match) {
    return match.id;
  }

  // If no match found, return the default category
  const defaultCategory = relevantCategories.find(
    (cat) => cat.name === (isExpense ? 'Miscellaneous' : 'Other Income')
  );

  if (!defaultCategory) {
    throw new Error('Default categories not found in demo database');
  }
  return defaultCategory.id;
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

    // DEBUG: Log the sheet range and content
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    console.log('...Sheet range =>', worksheet['!ref'], 'Decoded:', range);

    // Detect format by checking cell A1
    const a1Value = worksheet?.['A1']?.v;
    const isStatementFormat = a1Value === 'Date';
    console.log(
      '...Detected format:',
      isStatementFormat ? 'Statement' : 'Original',
      'A1 value =>',
      a1Value
    );

    // Find the actual last row with data
    let lastRow = 1;
    for (let r = 1; r <= range.e.r; r++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: r, c: 0 })];
      const descCell = worksheet[XLSX.utils.encode_cell({ r: r, c: 1 })];
      if (dateCell?.v || descCell?.v) {
        lastRow = r;
      }
    }
    console.log('...Last row with data =>', lastRow);

    // Explicitly set the range to only include rows with data
    worksheet['!ref'] = XLSX.utils.encode_range(
      { r: range.s.r, c: range.s.c },
      { r: lastRow, c: range.e.c }
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

    // Log the raw data before filtering
    console.log(
      '...Raw rows before filtering =>',
      rawRows.map((row) => ({
        date: row.Date,
        desc: row.Description?.slice(0, 30) + '...',
        wd: row.Withdrawals,
        dp: row.Deposits,
      }))
    );

    // Filter out invalid rows before processing
    rawRows = rawRows.filter((row) => {
      // Skip if it's a header row or empty
      const rawDate = (row.Date || '').trim();
      if (!rawDate || rawDate.toLowerCase() === 'date') {
        return false;
      }

      // Skip if date is invalid
      const dateObj = parseBankDate(rawDate);
      if (isNaN(dateObj.getTime())) {
        return false;
      }

      // Skip if both withdrawals and deposits are empty or invalid
      const wd = parseFloatCell(row.Withdrawals);
      const dp = parseFloatCell(row.Deposits);
      if (wd === 0 && dp === 0) {
        return false;
      }

      // Skip if description is empty or contains only whitespace
      const desc = (row.Description || '').trim();
      if (!desc) {
        return false;
      }

      return true;
    });

    console.log('...Valid rows to process =>', rawRows.length);

    let importedCount = 0;
    let duplicatesCount = 0;

    // Process each row
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      console.log(`----- Row #${i + 1}`, row);

      // B) Parse the date
      const dateObj = parseBankDate(row.Date.trim());
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
