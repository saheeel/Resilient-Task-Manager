import React from 'react';
import type { TaskStatus } from '../contexts/TaskContext';
import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return { label: 'Open', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'in_progress':
        return { label: 'In Progress', colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
      case 'completed':
        return { label: 'Completed', colorClass: 'bg-green-100 text-green-800 border-green-200' };
      case 'could_not_complete':
        return { label: 'Incomplete', colorClass: 'bg-red-100 text-red-800 border-red-200' };
      case 'blocked':
        return { label: 'Blocked', colorClass: 'bg-orange-100 text-orange-800 border-orange-200' };
      default:
        return { label: status, colorClass: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const config = getStatusConfig();

  // Note: we'll define these basic utility classes in our support.css
  return (
    <span className={clsx('px-2.5 py-1 text-xs font-semibold rounded-full border whitespace-nowrap inline-flex items-center justify-center', config.colorClass)}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
