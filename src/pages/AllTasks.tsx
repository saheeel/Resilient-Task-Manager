import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { Task } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/StatusBadge';
import { PackageCheck, UserRoundCog } from 'lucide-react';
import { materialStatusToneMap } from '../lib/taskOptions';

const AllTasks: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser, users } = useTasks();
  const {
    t,
    formatDate,
    priorityLabel,
    taskTypeLabel,
  } = useLanguage();
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'dueDate'>('default');

  if (!currentUser) return null;

  // We only show open and in-progress tasks
  const activeTasks = tasks.filter((task) => {
    if (task.isPaused) return false;
    if (task.status === 'completed' || task.status === 'blocked' || task.status === 'could_not_complete') {
      return false;
    }
    return true;
  });

  const getPriorityWeight = (priority: string) => {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  };

  const sortTasks = (taskList: Task[]) => {
    const listCopy = [...taskList];
    if (sortBy === 'priority') {
      return listCopy.sort((a, b) => {
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      });
    }
    if (sortBy === 'dueDate') {
      return listCopy.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return listCopy;
  };

  const sortedActiveTasks = sortTasks(activeTasks);

  const renderPriorityBadge = (priority: Task['priority']) => {
    const colorClasses = {
      high: 'text-red-700 bg-red-50 border-red-100',
      medium: 'text-amber-700 bg-amber-50 border-amber-100',
      low: 'text-slate-600 bg-slate-50 border-slate-200',
    };

    return (
      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colorClasses[priority]}`}>
        {priorityLabel(priority)}
      </span>
    );
  };

  const taskPreview = (task: Task) => {
    const description = task.description?.trim();
    if (description) return description;
    return t('employeeDashboard.taskDescriptionFallback');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 border-b border-slate-150 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('nav.allTasks')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          View all active tasks in the organization
        </p>
      </header>

      <div className="mb-6 flex items-center justify-end">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <label htmlFor="all-sort" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t('employeeDashboard.sortMyWork')}
          </label>
          <select
            id="all-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as 'default' | 'priority' | 'dueDate')}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-slate-400"
          >
            <option value="default">{t('employeeDashboard.originalOrder')}</option>
            <option value="priority">{t('employeeDashboard.priorityFirst')}</option>
            <option value="dueDate">{t('employeeDashboard.dueDateSoon')}</option>
          </select>
        </div>
      </div>

      <div className="mb-8">
        {sortedActiveTasks.length > 0 ? (
          <div className="grid gap-3">
            {sortedActiveTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-slate-900 flex items-center gap-2">
                      {task.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500">{taskPreview(task)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {renderPriorityBadge(task.priority)}
                  
                  {task.assignedTo.length > 0 ? (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('taskDetail.assignedTo')}: {task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-400">
                      {t('common.unassigned')}
                    </span>
                  )}

                  {task.dueDate && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('employeeDashboard.dueOn', {
                        date: formatDate(task.dueDate, { month: 'short', day: 'numeric' }),
                      })}
                    </span>
                  )}
                  {task.type !== 'one-time' ? (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                      {taskTypeLabel(task.type)}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                      {taskTypeLabel(task.type)}
                    </span>
                  )}
                  {task.inCharge && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium">
                      <UserRoundCog size={12} />
                      {t('taskDetail.inCharge')}: {task.inCharge}
                    </span>
                  )}
                  {task.materialStatus && (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${materialStatusToneMap[task.materialStatus].badge}`}>
                      <PackageCheck size={12} />
                      {t(`materials.${task.materialStatus}`)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="mb-1 font-semibold text-slate-700">{t('employeeDashboard.allCaughtUp')}</h3>
            <p className="text-sm text-slate-500">{t('employeeDashboard.noActiveTasks')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllTasks;
