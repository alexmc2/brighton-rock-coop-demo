/**
 * Parses a date string in "DD/MM/YYYY" or "DD-MM-YYYY" format
 * into a Date object set in UTC.
 */
export function parseInputDate(dateStr: string): Date | null {
  const parts = dateStr.split(/[-\/]/);
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return new Date(
    Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
  );
}

/**
 * Formats a Date object (assumed UTC) into "DD/MM/YYYY".
 */
export function formatDateToDDMMYYYY(date: Date): string {
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
