// grid-resize-handlers.ts
import { Dispatch, SetStateAction } from 'react';
import { Column } from '@silevis/reactgrid';

/**
 * Called by onResizeColumn.
 * ReactGrid passes `newWidth` and `columnIndexes` (an array),
 * so if multiple columns are spanned, you can handle them in one go.
 */
export function handleResizeColumn(
  newWidth: number,
  columnIndexes: number[],
  setColumns: Dispatch<SetStateAction<Column[]>>
) {
  setColumns((prevColumns) => {
    // If multiple columns are spanned, we distribute the width among them
    const newWidthPerColumn =
      columnIndexes.length > 1 ? newWidth / columnIndexes.length : newWidth;

    return prevColumns.map((col, idx) => {
      if (columnIndexes.includes(idx)) {
        return { ...col, width: Math.max(50, newWidthPerColumn) };
      }
      return col;
    });
  });
}
