import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { Task } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from '../components/StatusBadge';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser } = useTasks();
  const {
    t,
    formatDate,
    formatTime,
    priorityLabel,
    taskTypeLabel,
    relativeDayLabel,
  } = useLanguage();
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'dueDate'>('default');
  const [showTodayCompleted, setShowTodayCompleted] = useState(true);

  if (!currentUser) return null;

  const myTasks = tasks.filter((task) => task.assignedTo.includes(currentUser.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const activeTasks = myTasks.filter((task) => {
    if (task.status === 'completed' || task.status === 'blocked' || task.status === 'could_not_complete') {
      return false;
    }
    if (task.status === 'in_progress') return true;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate.getTime() > today.getTime()) return false;
    }
    return true;
  });

  const upcomingTasks = myTasks.filter((task) => {
    if (task.status !== 'open' || !task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() > today.getTime();
  });

  const issueTasks = myTasks.filter((task) => task.status === 'blocked' || task.status === 'could_not_complete');

  const todayCompleted = myTasks.filter((task) => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completedDate = new Date(task.completedAt);
    return completedDate >= today && completedDate <= todayEnd;
  });

  const getPriorityWeight = (priority: string) => {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  };

  const sortTasks = (taskList: Task[]) => {
    const listCopy = [...taskList];
    if (sortBy === 'priority') {
      return listCopy.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
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
  const sortedUpcomingTasks = sortTasks(upcomingTasks);

  const formatTimeTaken = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return '0 min';
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

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

  const upcomingDueLabel = (task: Task) => {
    if (!task.dueDate) return '';
    const dueDate = new Date(task.dueDate);
    const relativeLabel = relativeDayLabel(dueDate, today);
    if (relativeLabel) {
      return `${relativeLabel} - ${formatDate(dueDate, { month: 'short', day: 'numeric' })}`;
    }

    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    return `${diffDays}d - ${formatDate(dueDate, { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex items-end justify-between border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('app.myWorkspace')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('employeeDashboard.welcome', { name: currentUser.name.split(' ')[0] })}
          </p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="block text-3xl font-bold text-slate-800">{activeTasks.length}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('common.active')}
            </span>
          </div>
          {upcomingTasks.length > 0 && (
            <div className="border-l border-slate-200 pl-4">
              <span className="block text-3xl font-bold text-indigo-600">{upcomingTasks.length}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                {t('common.upcoming')}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="mb-8 flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm sm:flex-row sm:items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('employeeDashboard.sortMyWork')}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            id="sort-default"
            onClick={() => setSortBy('default')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              sortBy === 'default'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('employeeDashboard.originalOrder')}
          </button>
          <button
            id="sort-priority"
            onClick={() => setSortBy('priority')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              sortBy === 'priority'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('employeeDashboard.priorityFirst')}
          </button>
          <button
            id="sort-duedate"
            onClick={() => setSortBy('dueDate')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              sortBy === 'dueDate'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('employeeDashboard.dueDateSoon')}
          </button>
        </div>
      </div>

      {issueTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900">{t('app.blockedTasks')}</h2>
          <div className="flex flex-col gap-3">
            {issueTasks.map((task) => (
              <div
                key={task.id}
                className="cursor-pointer rounded-xl border border-red-200 bg-red-50 p-4 transition-colors hover:bg-red-100/60"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm font-semibold text-red-950">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
                <p className="mt-2 text-sm leading-6 text-red-800">{taskPreview(task)}</p>
                {task.blockReason && (
                  <p className="mt-3 inline-block rounded border border-red-100 bg-white/60 px-2 py-1 text-xs font-medium text-red-800">
                    {t('common.reason')}: {task.blockReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900">{t('app.currentAssignments')}</h2>
        {sortedActiveTasks.length > 0 ? (
          <div className="grid gap-3">
            {sortedActiveTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">{task.title}</h3>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-500">{taskPreview(task)}</p>
                  </div>
                  {task.status === 'in_progress' && <StatusBadge status={task.status} />}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {renderPriorityBadge(task.priority)}
                  {task.dueDate && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {t('employeeDashboard.dueOn', {
                        date: formatDate(task.dueDate, { month: 'short', day: 'numeric' }),
                      })}
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {taskTypeLabel(task.type)}
                  </span>
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

      <div className="mb-8">
        <h2 className="mb-3 text-base font-bold tracking-tight text-slate-900">{t('app.upcomingWork')}</h2>
        {sortedUpcomingTasks.length > 0 ? (
          <div className="grid gap-3">
            {sortedUpcomingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 border-l-4 border-l-indigo-400 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow"
              >
                <div className="min-w-0">
                  <h3 className="mb-2 text-base font-semibold text-slate-900">{task.title}</h3>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-500">{taskPreview(task)}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {renderPriorityBadge(task.priority)}
                  {task.dueDate && (
                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {upcomingDueLabel(task)}
                    </span>
                  )}
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {taskTypeLabel(task.type)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-xs font-medium text-slate-400">{t('employeeDashboard.noUpcomingTasks')}</p>
          </div>
        )}
      </div>

      {todayCompleted.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowTodayCompleted((value) => !value)}
            className="mb-3 flex w-full items-center justify-between border-none bg-transparent p-0 text-left cursor-pointer"
          >
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
              {t('employeeDashboard.todayCompletedTitle')}
              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                {todayCompleted.length}
              </span>
            </h2>
            <span className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600">
              {showTodayCompleted ? t('common.hide') : t('common.show')}
            </span>
          </button>

          {showTodayCompleted && (
            <div className="grid gap-2">
              {todayCompleted.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate(`/task/${task.id}`)}
                  className="flex items-center justify-between gap-4 rounded-xl border border-green-200/60 bg-green-50/50 p-4 cursor-pointer transition-colors hover:bg-green-50"
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-600 line-through decoration-slate-300">
                      {task.title}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                      {task.completedAt && <span>{formatTime(task.completedAt)}</span>}
                      {task.startedAt && task.completedAt && (
                        <span className="rounded border border-green-200 bg-green-100 px-2 py-0.5 font-semibold text-green-700">
                          {t('common.timeTaken')}: {formatTimeTaken(task.startedAt, task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-green-600">{t('common.done')}</span>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-center text-xs text-slate-400">
            {t('common.historyTomorrowNote')}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
