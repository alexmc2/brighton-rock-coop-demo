import Link from 'next/link';
import { Facebook, Instagram, Mail, MapPin } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800/40 bg-background/95 backdrop-blur-sm">
      <div className="container py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground text-center md:text-left">
            Website designed and built by Alex McGarry
          </p>
          &copy; {new Date().getFullYear()} Brighton Rock Housing Co-operative.
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </Link>
  );
}
