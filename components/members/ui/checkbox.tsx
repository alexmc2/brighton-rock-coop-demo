// Custom Checkbox Component
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/members/ui/button';
import { Input } from '@/components/members/ui/input';
import { Label } from '@/components/members/ui/label';
import { Textarea } from '@/components/members/ui/textarea';
import { Plus, Check } from 'lucide-react';
import {
  DevelopmentCategory,
  DevelopmentPriority,
} from '@/types/members/development';

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`h-4 w-4 rounded border ${
          checked
            ? 'bg-coop-500 border-coop-500 dark:bg-sky-500 dark:border-sky-500'
            : 'bg-white border-slate-300 dark:bg-slate-700 dark:border-slate-600'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } flex items-center justify-center transition-colors`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </button>
      <Label htmlFor={id} className={`text-sm ${disabled ? 'opacity-50' : ''}`}>
        {label}
      </Label>
    </div>
  );
}
