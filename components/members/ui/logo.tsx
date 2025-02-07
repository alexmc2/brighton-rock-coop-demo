import Link from 'next/link';

export default function Logo() {
  return (
    <Link className="block" href="/members">
      <div className="bg-coop-500 dark:bg-sky-600 rounded-2xl p-2 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      </div>
    </Link>
  );
}
