import React from 'react';
import type { TaskStatus } from '../contexts/TaskContext';
import { clsx } from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBadgeProps {
  status: TaskStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { taskStatusLabel } = useLanguage();

  if (status === 'open') {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'in_progress':
        return { label: taskStatusLabel(status), colorClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30' };
      case 'completed':
        return { label: taskStatusLabel(status), colorClass: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' };
      case 'could_not_complete':
        return { label: taskStatusLabel(status), colorClass: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' };
      case 'blocked':
        return { label: taskStatusLabel(status), colorClass: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30' };
      default:
        return { label: taskStatusLabel(status), colorClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
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
