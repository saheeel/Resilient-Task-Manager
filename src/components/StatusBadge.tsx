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
        return { label: taskStatusLabel(status), colorClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-600 dark:text-white dark:border-amber-500 font-bold shadow-xs' };
      case 'completed':
        return { label: taskStatusLabel(status), colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-600 dark:text-white dark:border-emerald-500 font-bold shadow-xs' };
      case 'could_not_complete':
        return { label: taskStatusLabel(status), colorClass: 'bg-red-100 text-red-950 border-red-300 dark:bg-rose-600 dark:text-white dark:border-rose-500 font-bold shadow-xs' };
      case 'blocked':
        return { label: taskStatusLabel(status), colorClass: 'bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-600 dark:text-white dark:border-orange-500 font-bold shadow-xs' };
      default:
        return { label: taskStatusLabel(status), colorClass: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-white dark:border-slate-600 font-semibold shadow-xs' };
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
