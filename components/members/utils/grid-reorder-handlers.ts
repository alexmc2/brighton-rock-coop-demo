// grid-reorder-handlers.ts
import { Column } from '@silevis/reactgrid';

/**
 * Basic row reordering:
 *  - Remove rows at selectedRowIndexes
 *  - Insert them at destinationRowIdx
 *  - You might skip rowIndex=0 if it's a heading row, etc.
 */
export function handleRowReorder<T>(
  selectedRowIndexes: number[],
  destinationRowIdx: number,
  rowData: T[],
  setRowData: React.Dispatch<React.SetStateAction<T[]>>,
  pushHistory: (updated: T[]) => void
) {
  const updated = [...rowData];

  // Reorder from bottom up so splicing doesn't affect earlier indexes
  selectedRowIndexes.sort((a, b) => a - b);

  for (let i = selectedRowIndexes.length - 1; i >= 0; i--) {
    const fromIndex = selectedRowIndexes[i];
    // If you need to skip row 0 or clamp, do that here:
    if (fromIndex < 1) continue; // e.g. skip heading row
    const [row] = updated.splice(fromIndex, 1);

    // If we remove a row above destination, shift down by 1
    if (fromIndex < destinationRowIdx) {
      destinationRowIdx--;
    }
    updated.splice(destinationRowIdx, 0, row);
  }

  setRowData(updated);
  pushHistory(updated);
}

/**
 * Basic column reordering:
 *  - Remove columns at selectedColIndexes
 *  - Insert them at destinationColIdx
 *  - Then recalc colIndex in the returned array
 */
export function handleColumnReorder(
  selectedColIndexes: number[],
  destinationColIdx: number,
  columns: Column[],
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>
) {
  setColumns((prev) => {
    const updated = [...prev];
    selectedColIndexes.sort((a, b) => a - b);

    for (let i = selectedColIndexes.length - 1; i >= 0; i--) {
      const from = selectedColIndexes[i];
      const [col] = updated.splice(from, 1);
      if (from < destinationColIdx) {
        destinationColIdx--;
      }
      updated.splice(destinationColIdx, 0, col);
    }

    // Reassign colIndex to keep them consistent
    return updated.map((c, idx) => ({ ...c, colIndex: idx }));
  });
}
