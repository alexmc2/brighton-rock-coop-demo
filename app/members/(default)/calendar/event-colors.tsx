export type EventCategory =
  | 'General Meeting'
  | 'Sub Meeting'
  | 'Allocations'
  | 'Social'
  | 'P4P Visit'
  | 'Garden'
  | 'AGM'
  | 'EGM'
  | 'General Maintenance'
  | 'Training'
  | 'Treasury'
  | 'Development'
  | 'Co-op Social';

export function getEventColor(category: string): string {
  switch (category) {
    case 'General Meeting':
      return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200';
    case 'Sub Meeting':
      return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200';
    case 'Allocations':
      return 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200';
    case 'Social':
      return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
    case 'P4P Visit':
      return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
    case 'Garden':
      return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200';
    case 'AGM':
      return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200';
    case 'EGM':
      return 'bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-300';
    case 'General Maintenance':
      return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200';
    case 'Training':
      return 'bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-200';
    case 'Treasury':
      return 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200';
    case 'Development':
      return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200';
    case 'Co-op Social':
      return 'bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200';
    default:
      return 'bg-slate-100 dark:bg-slate-900 /50 text-slate-800 dark:text-slate-300';
  }
}
