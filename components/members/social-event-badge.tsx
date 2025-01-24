import { Badge } from '@/components/members/ui/badge';
import { cn } from '@/lib/utils';
import {
  Film,
  Music,
  UtensilsCrossed,
  Dice5,
  Tv,
  BookOpen,
  Gift,
  Bike,
  PartyPopper,
  Smile,
  Sun,
  PenTool,
} from 'lucide-react';
import { SocialEventCategory, SocialEventStatus } from '@/types/members/social';

const getCategoryIcon = (category: SocialEventCategory) => {
  const icons: Record<SocialEventCategory, JSX.Element> = {
    film_night: <Film className="w-5 h-5" />,
    album_night: <Music className="w-5 h-5" />,
    meal: <UtensilsCrossed className="w-5 h-5" />,
    fire: <Smile className="w-5 h-5" />,
    board_games: <Dice5 className="w-5 h-5" />,
    tv: <Tv className="w-5 h-5" />,
    book_club: <BookOpen className="w-5 h-5" />,
    christmas_dinner: <Gift className="w-5 h-5" />,
    bike_ride: <Bike className="w-5 h-5" />,
    party: <PartyPopper className="w-5 h-5" />,
    hang_out: <Smile className="w-5 h-5" />,
    beach: <Sun className="w-5 h-5" />,
    writing_club: <PenTool className="w-5 h-5" />,
  };
  return icons[category] || <PartyPopper className="w-5 h-5" />;
};

const categoryColors: Record<SocialEventCategory, string> = {
  film_night:
    'bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-300',
  album_night:
    'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300',
  meal: 'bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-300',
  fire: 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
  board_games:
    'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300',
  tv: 'bg-pink-100 text-pink-800 dark:bg-pink-800/30 dark:text-pink-300',
  book_club: 'bg-teal-100 text-teal-800 dark:bg-teal-800/30 dark:text-teal-300',
  christmas_dinner:
    'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300',
  bike_ride:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-300',
  party:
    'bg-orange-100 text-orange-800 dark:bg-orange-800/30 dark:text-orange-300',
  hang_out:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/30 dark:text-indigo-300',
  beach: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800/30 dark:text-cyan-300',
  writing_club:
    'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300',
};

const statusColors: Record<SocialEventStatus, string> = {
  upcoming:
    'bg-green-50 text-green-700 border-green-200/30 dark:bg-green-950 dark:text-green-300 dark:border-green-800/30',
  completed:
    'bg-blue-50 text-blue-700 border-blue-200/30 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/30',
  cancelled:
    'bg-red-50 text-red-700 border-red-200/30 dark:bg-red-950 dark:text-red-300 dark:border-red-800/30',
};

interface SocialEventBadgeProps {
  type: 'category' | 'status';
  value: SocialEventCategory | SocialEventStatus;
  className?: string;
}

export function SocialEventBadge({
  type,
  value,
  className,
}: SocialEventBadgeProps) {
  if (type === 'category') {
    const category = value as SocialEventCategory;
    return (
      <div
        className={cn(
          'flex items-center px-3 py-1.5 rounded-full',
          categoryColors[category],
          className
        )}
      >
        {getCategoryIcon(category)}
        <span className="ml-1.5 text-sm capitalize">
          {category.replace('_', ' ')}
        </span>
      </div>
    );
  }

  const status = value as SocialEventStatus;
  return (
    <span
      className={cn(
        'px-2.5 py-0.5 text-xs font-medium rounded-full',
        statusColors[status],
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
