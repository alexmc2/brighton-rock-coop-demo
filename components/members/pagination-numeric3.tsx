interface PaginationNumericProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationNumeric({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationNumericProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    if (currentPage > 3) pages.push('...');

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex justify-center">
      <nav className="flex" role="navigation" aria-label="Navigation">
        <div className="mr-2">
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`inline-flex items-center justify-center rounded-lg leading-5 px-2.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/60 ${
              currentPage === 1
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            <span className="sr-only">Previous</span>
            <wbr />
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path d="M9.4 13.4l1.4-1.4-4-4 4-4-1.4-1.4L4 8z" />
            </svg>
          </button>
        </div>
        <ul className="inline-flex text-sm font-medium -space-x-px rounded-lg shadow-sm">
          {getPageNumbers().map((pageNum, idx) => (
            <li key={idx}>
              {pageNum === '...' ? (
                <span className="inline-flex items-center justify-center leading-5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/60 text-gray-400 dark:text-gray-500">
                  …
                </span>
              ) : (
                <button
                  onClick={() =>
                    typeof pageNum === 'number' && onPageChange(pageNum)
                  }
                  className={`inline-flex items-center justify-center leading-5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/60 ${
                    currentPage === pageNum
                      ? 'text-violet-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  } ${idx === 0 ? 'rounded-l-lg' : ''} ${
                    idx === getPageNumbers().length - 1 ? 'rounded-r-lg' : ''
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="ml-2">
          <button
            onClick={() =>
              currentPage < totalPages && onPageChange(currentPage + 1)
            }
            disabled={currentPage === totalPages}
            className={`inline-flex items-center justify-center rounded-lg leading-5 px-2.5 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700/60 ${
              currentPage === totalPages
                ? 'text-gray-300 dark:text-gray-600'
                : 'text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
          >
            <span className="sr-only">Next</span>
            <wbr />
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 16 16"
            >
              <path d="M6.6 13.4L5.2 12l4-4-4-4 1.4-1.4L12 8z" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}
