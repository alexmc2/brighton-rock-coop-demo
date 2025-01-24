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
];

let allChanges = [];

async function findChangesInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let changes = [];

    const sortedTableNames = [...TABLE_NAMES].sort(
      (a, b) => b.length - a.length
    );

    for (const tableName of sortedTableNames) {
      const regex = new RegExp(
        `(?<![a-zA-Z0-9_])${tableName}(?![a-zA-Z0-9_])`,
        'g'
      );
      const demoTableName = `demo_${tableName}`;

      let match;
      let lineNumber = 0;
      let lineStart = 0;

      while ((match = regex.exec(content)) !== null) {
        lineNumber =
          (content.slice(0, match.index).match(/\n/g) || []).length + 1;
        lineStart = content.lastIndexOf('\n', match.index) + 1;
        const lineEnd = content.indexOf('\n', match.index);
        const line = content.slice(
          lineStart,
          lineEnd !== -1 ? lineEnd : undefined
        );

        changes.push({
          file: filePath,
          line: lineNumber,
          oldText: tableName,
          newText: demoTableName,
          fullLine: line.trim(),
        });
      }
    }

    if (changes.length > 0) {
      allChanges.push(...changes);
      console.log(`Found ${changes.length} changes in ${filePath}`);
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

    let report = 'Database Reference Changes Report\n';
    report += '================================\n\n';

    const fileGroups = {};
    allChanges.forEach((change) => {
      if (!fileGroups[change.file]) {
        fileGroups[change.file] = [];
      }
      fileGroups[change.file].push(change);
    });

    for (const [file, changes] of Object.entries(fileGroups)) {
      report += `File: ${file}\n`;
      report += '-'.repeat(file.length + 6) + '\n';

      changes.forEach((change) => {
        report += `Line ${change.line}: ${change.oldText} -> ${change.newText}\n`;
        report += `Context: ${change.fullLine}\n\n`;
      });
      report += '\n';
    }

    report += `\nTotal changes found: ${allChanges.length}\n`;
    report += `Files affected: ${Object.keys(fileGroups).length}\n`;

    await fs.writeFile('database-changes-report.txt', report);
    console.log('✨ Report generated: database-changes-report.txt');
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

main();
