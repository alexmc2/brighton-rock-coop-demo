const fs = require('fs').promises;
const path = require('path');

const TABLE_NAMES = [
  'calendar_events',
  'comment_reactions',
  'development_comments',
  'development_initiatives',
  'doodle_poll_options',
  'doodle_poll_participants',
  'doodle_polls',
  'event_participants',
  'garden_areas',
  'garden_comments',
  'garden_images',
  'garden_plants',
  'garden_project_participants',
  'garden_project_reports',
  'garden_projects',
  'garden_task_participants',
  'garden_tasks',
  'houses',
  'maintenance_comments',
  'maintenance_requests',
  'maintenance_visits',
  'partner_organisations',
  'profiles',
  'social_event_comments',
  'social_event_participants',
  'social_events',
  'todo_comments',
  'todos',
  'treasury_transaction_history',
  'treasury_ledger_entries',
  'treasury_monthly_category_totals',
  'treasury_categories',
  'treasury_transactions',
  'treasury_transaction_splits',
  'treasury_annual_budgets',
  'treasury_monthly_balances',
  'treasury_monthly_drafts',
];

let allChanges = [];

async function findChangesInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let fileChanges = [];

    const sortedTableNames = [...TABLE_NAMES].sort(
      (a, b) => b.length - a.length
    );

    for (const tableName of sortedTableNames) {
      // Define the patterns we're looking for
      const patterns = [
        {
          regex: new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'g'),
          type: 'from clause',
        },
        {
          regex: new RegExp(`!${tableName}_[a-zA-Z0-9_]*_fkey`, 'g'),
          type: 'foreign key reference',
        },
        {
          regex: new RegExp(`:${tableName}\\(`, 'g'),
          type: 'table alias',
        },
        {
          regex: new RegExp(`to\\s+${tableName}\\s+`, 'gi'),
          type: 'RLS policy',
        },
      ];

      // Search the content line by line to get line numbers
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.regex.exec(line)) !== null) {
            fileChanges.push({
              file: filePath,
              line: i + 1,
              oldText: match[0],
              newText: match[0].replace(tableName, `demo_${tableName}`),
              fullLine: line.trim(),
              type: pattern.type,
            });
          }
        }
      }
    }

    if (fileChanges.length > 0) {
      allChanges.push(...fileChanges);
      console.log(`Found ${fileChanges.length} changes in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

async function processDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.next', 'dist'].includes(entry.name)) {
          await processDirectory(fullPath);
        }
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        await findChangesInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error);
  }
}

async function main() {
  const projectRoot = process.cwd();
  console.log('🔍 Starting to find database references...');

  try {
    await processDirectory(projectRoot);

    // Create a formatted report
    let report = 'Database Reference Changes Report\n';
    report += '================================\n\n';

    // Group changes by file
    const fileGroups = {};
    allChanges.forEach((change) => {
      if (!fileGroups[change.file]) {
        fileGroups[change.file] = [];
      }
      fileGroups[change.file].push(change);
    });

    // Generate report for each file
    for (const [file, changes] of Object.entries(fileGroups)) {
      report += `File: ${file}\n`;
      report += '-'.repeat(file.length + 6) + '\n';

      changes.forEach((change) => {
        report += `Line ${change.line} (${change.type}):\n`;
        report += `Old: ${change.oldText}\n`;
        report += `New: ${change.newText}\n`;
        report += `Context: ${change.fullLine}\n\n`;
      });
      report += '\n';
    }

    // Add summary
    report += `\nTotal changes found: ${allChanges.length}\n`;
    report += `Files affected: ${Object.keys(fileGroups).length}\n`;

    // Write report to file
    await fs.writeFile('database-changes-report.txt', report);
    console.log('✨ Report generated: database-changes-report.txt');
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

main();
