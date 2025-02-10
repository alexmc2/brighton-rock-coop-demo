/**
 * Returns an array of years from 2023 to current year + 2
 * This ensures consistent year ranges across all dropdowns
 */
export function getYearRange(): number[] {
  const startYear = 2023;
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 2;
  const years: number[] = [];

  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  return years;
}
