// app/(default)/garden/[id]/task-header.tsx

import Link from 'next/link';
import { GardenTaskWithDetails } from '@/types/members/garden';
import TaskActions from './task-actions';

interface TaskHeaderProps {
  task: GardenTaskWithDetails;
}

export default function TaskHeader({ task }: TaskHeaderProps) {
  return (
    <div className="mb-4">
      <div>
        <TaskActions task={task} />
      </div>
    </div>
  );
}
