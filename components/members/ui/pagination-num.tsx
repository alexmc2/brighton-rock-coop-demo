import { Button } from '@/components/members/ui/button';

interface PaginationNumericProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export default function PaginationNumeric({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex,
}: PaginationNumericProps) {
  return (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <nav
          className="sm:mb-0 sm:order-1"
          role="navigation"
          aria-label="Navigation"
        >
          <ul className="flex justify-center sm:py-0 py-4">
            <li className="ml-3 first:ml-0">
              <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                &lt;- Previous
              </Button>
            </li>
            <li className="ml-3 first:ml-0">
              <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                variant="outline"
                size="sm"
              >
                Next -&gt;
              </Button>
            </li>
          </ul>
        </nav>
        <div className="text-sm text-gray-500 text-center sm:text-left">
          {totalItems === 0 ? (
            <span>No transactions</span>
          ) : (
            <>
              Showing{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {startIndex}
              </span>{' '}
              to{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {endIndex}
              </span>{' '}
              of{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {totalItems}
              </span>{' '}
              transactions
            </>
          )}
        </div>
      </div>
    </div>
  );
}
