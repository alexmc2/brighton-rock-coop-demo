import React from 'react';
import { Button } from '@/components/members/ui/button';

interface PaginationPagesProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  startIndex?: number;
  endIndex?: number;
  onPageChange: (page: number) => void;
}

export default function PaginationPages({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}: PaginationPagesProps) {
  // Generates an array of page numbers including ellipsis if needed
  const generatePages = (): Array<number | 'ellipsis'> => {
    const pages: Array<number | 'ellipsis'> = [];
    const maxVisible = 5; // Desktop
    const maxVisibleMobile = 3; // Mobile

    // Use a media query to determine if we're on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    const visiblePages = isMobile ? maxVisibleMobile : maxVisible;

    if (totalPages <= visiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= Math.ceil(visiblePages / 2)) {
        for (let i = 1; i <= visiblePages; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - Math.floor(visiblePages / 2)) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - visiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = generatePages();

  return (
    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
      <nav
        className="flex justify-center sm:justify-start sm:order-1"
        role="navigation"
        aria-label="Pagination Navigation"
      >
        <ul className="flex items-center space-x-1 sm:space-x-2">
          <li className="hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(1)}
            >
              First
            </Button>
          </li>
          <li>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
          </li>
          {pages.map((page, index) => (
            <li key={index}>
              {page === 'ellipsis' ? (
                <span className="px-2 sm:px-3">…</span>
              ) : (
                <Button
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className="min-w-[32px] px-2 sm:min-w-[36px] sm:px-3"
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </Button>
              )}
            </li>
          ))}
          <li>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </li>
          <li className="hidden sm:block">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              Last
            </Button>
          </li>
        </ul>
      </nav>
      {typeof totalItems === 'number' &&
        typeof startIndex === 'number' &&
        typeof endIndex === 'number' && (
          <div className="text-sm text-gray-500 text-center">
            Showing{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {startIndex + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {Math.min(endIndex, totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {totalItems}
            </span>{' '}
            results
          </div>
        )}
    </div>
  );
}
