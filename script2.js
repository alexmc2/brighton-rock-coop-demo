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

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    let changes = 0;

    const sortedTableNames = [...TABLE_NAMES].sort(
      (a, b) => b.length - a.length
    );

    for (const tableName of sortedTableNames) {
      // Define patterns and their replacements
      const patterns = [
        {
          // .from('tablename') or .from("tablename")
          find: new RegExp(`\\.from\\(['"]${tableName}['"]\\)`, 'g'),
          replace: (match) => match.replace(tableName, `demo_${tableName}`),
        },
        {
          // !tablename_something_fkey
          find: new RegExp(`!${tableName}_([a-zA-Z0-9_]*)_fkey`, 'g'),
          replace: (match) =>
            match.replace(`!${tableName}_`, `!demo_${tableName}_`),
        },
        {
          // :tablename(
          find: new RegExp(`:${tableName}\\(`, 'g'),
          replace: (match) =>
            match.replace(`:${tableName}`, `:demo_${tableName}`),
        },
        {
          // to tablename (in RLS policies)
          find: new RegExp(`to\\s+${tableName}\\s+`, 'gi'),
          replace: (match) => match.replace(tableName, `demo_${tableName}`),
        },
      ];

      // Apply each pattern
      for (const pattern of patterns) {
        const matches = content.match(pattern.find);
        if (matches) {
          changes += matches.length;
          content = content.replace(pattern.find, pattern.replace);
        }
      }
    }

    if (changes > 0) {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✅ Updated ${filePath} (${changes} changes)`);
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
        await updateFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error);
  }
}

async function main() {
  const projectRoot = process.cwd();
  console.log('🔍 Starting database reference updates...');

  try {
    await processDirectory(projectRoot);
    console.log('✨ Database reference updates completed successfully!');
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

main();
