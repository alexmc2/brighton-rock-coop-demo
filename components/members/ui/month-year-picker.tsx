import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addYears, subYears, setMonth, setYear } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/members/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/members/ui/scroll-area';

interface MonthYearPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function MonthYearPicker({
  value,
  onChange,
  className,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempDate, setTempDate] = React.useState(value);

  // Sync tempDate with value prop changes.
  React.useEffect(() => {
    setTempDate(value);
  }, [value]);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const handlePreviousYear = () => {
    setTempDate((prevDate) => subYears(prevDate, 1));
  };

  const handleNextYear = () => {
    setTempDate((prevDate) => addYears(prevDate, 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(Date.UTC(tempDate.getFullYear(), monthIndex, 1));
    onChange(newDate);
    setIsOpen(false);
  };

  const handleYearSelect = (year: number) => {
    setTempDate(setYear(tempDate, year));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full h-10 px-3 py-2 justify-start text-left font-normal bg-white dark:bg-slate-700',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {format(value, 'MMMM yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="icon" onClick={handlePreviousYear}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold">{format(tempDate, 'yyyy')}</div>
            <Button variant="outline" size="icon" onClick={handleNextYear}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <Button
                  key={month}
                  variant={
                    tempDate.getMonth() === index ? 'default' : 'outline'
                  }
                  onClick={() => handleMonthSelect(index)}
                  className="w-full"
                >
                  {month}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
