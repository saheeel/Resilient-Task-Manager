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
        return { label: taskStatusLabel(status), colorClass: 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700/80 font-bold' };
      case 'completed':
        return { label: taskStatusLabel(status), colorClass: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700/80 font-bold' };
      case 'could_not_complete':
        return { label: taskStatusLabel(status), colorClass: 'bg-red-100/90 text-red-950 border-red-300 dark:bg-red-900/60 dark:text-red-100 dark:border-red-700/80 font-bold' };
      case 'blocked':
        return { label: taskStatusLabel(status), colorClass: 'bg-orange-100/90 text-orange-950 border-orange-300 dark:bg-orange-900/60 dark:text-orange-100 dark:border-orange-700/80 font-bold' };
      default:
        return { label: taskStatusLabel(status), colorClass: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600 font-semibold' };
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
