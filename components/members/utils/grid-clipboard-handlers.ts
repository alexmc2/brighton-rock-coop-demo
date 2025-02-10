import React from 'react';

/**
 * onCut: handle multi-cell cutting
 */
export function handleCut(
  event: React.ClipboardEvent<HTMLDivElement>,
  cellsRange: {
    startRowIdx: number;
    endRowIdx: number;
    startColIdx: number;
    endColIdx: number;
  },
  cellsLookup: Map<string, any>
) {
  const { startRowIdx, endRowIdx, startColIdx, endColIdx } = cellsRange;
  let cellValues: string[] = [];
  let htmlRows = '';

  for (let r = startRowIdx; r < endRowIdx; r++) {
    let rowCells = '';
    for (let c = startColIdx; c < endColIdx; c++) {
      const cellApi = cellsLookup.get(`${r} ${c}`);
      if (cellApi) {
        const value = cellApi.onStringValueRequested() || '';
        cellValues.push(value);
        rowCells += `<td>${value}</td>`;
        // Clear the cell after cutting
        cellApi.onStringValueReceived?.('');
      }
    }
    htmlRows += `<tr>${rowCells}</tr>`;
  }

  const htmlTable = `<table>${htmlRows}</table>`;

  // Put data into the clipboard
  event.clipboardData.setData('text/html', htmlTable);
  event.clipboardData.setData('text/plain', cellValues.join('\t'));

  // Returning true means "we handled cut; do not run default single-cell cut."
  return true;
}

/**
 * onCopy: handle multi-cell copying
 */
export function handleCopy(
  event: React.ClipboardEvent<HTMLDivElement>,
  cellsRange: {
    startRowIdx: number;
    endRowIdx: number;
    startColIdx: number;
    endColIdx: number;
  },
  cellsLookup: Map<string, any>
) {
  const { startRowIdx, endRowIdx, startColIdx, endColIdx } = cellsRange;
  let cellValues: string[] = [];
  let htmlRows = '';

  for (let r = startRowIdx; r < endRowIdx; r++) {
    let rowCells = '';
    for (let c = startColIdx; c < endColIdx; c++) {
      const cellApi = cellsLookup.get(`${r} ${c}`);
      if (cellApi) {
        const value = cellApi.onStringValueRequested() || '';
        cellValues.push(value);
        rowCells += `<td>${value}</td>`;
      }
    }
    htmlRows += `<tr>${rowCells}</tr>`;
  }

  const htmlTable = `<table>${htmlRows}</table>`;
  event.clipboardData.setData('text/html', htmlTable);
  event.clipboardData.setData('text/plain', cellValues.join('\t'));

  // Returning true means "we handled copy; do not run default single-cell copy."
  return true;
}

/**
 * onPaste: handle multi-cell pasting
 */
export function handlePaste(
  event: React.ClipboardEvent<HTMLDivElement>,
  cellsRange: {
    startRowIdx: number;
    endRowIdx: number;
    startColIdx: number;
    endColIdx: number;
  },
  cellsLookup: Map<string, any>
) {
  const html = event.clipboardData.getData('text/html');

  // Try to parse HTML if user copied from Excel, Google Sheets, or another table
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tableRows = doc.querySelectorAll('table tr');

  // If there's no HTML table, fallback to a single string from text/plain
  if (!tableRows.length) {
    const plainText = event.clipboardData.getData('text/plain');
    const topLeftCell = cellsLookup.get(`${cellsRange.startRowIdx} ${cellsRange.startColIdx}`);
    topLeftCell?.onStringValueReceived?.(plainText);
    return true; // we handled it
  }

  // Otherwise, we have a table to paste (typical for multi‐row/col from Excel, Sheets)
  let rowIndex = 0;
  tableRows.forEach((tr) => {
    let colIndex = 0;
    const tds = Array.from(tr.querySelectorAll('td'));

    tds.forEach((td) => {
      const value = td.textContent || '';
      const targetRow = cellsRange.startRowIdx + rowIndex;
      const targetCol = cellsRange.startColIdx + colIndex;
      const cellApi = cellsLookup.get(`${targetRow} ${targetCol}`);

      if (cellApi) {
        cellApi.onStringValueReceived?.(value);
      }
      colIndex++;
    });

    rowIndex++;
  });

  // Return true → custom multi-cell paste, so skip default single‐cell paste.
  return true;
}
