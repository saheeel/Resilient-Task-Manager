import React, { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import StatusBadge from '../components/StatusBadge';
import { Calendar, X } from 'lucide-react';
import { TaskListSkeleton } from '../components/TaskSkeleton';

const AdminTaskHistory: React.FC = () => {
  const navigate = useNavigate();
  const { users, currentUser } = useTasks();
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);
  const dbTasksRaw = useQuery(api.tasks.list, { cutoffDate });
  const tasks = (dbTasksRaw as any[]) || [];
  const { t, formatDate, formatDateTime } = useLanguage();
  const [selectedDate, setSelectedDate] = useState('');

  if (!currentUser) return null;
  if (!isAdminRole(currentUser.role)) return <Navigate to="/" replace />;

  const eventTime = (task: (typeof tasks)[number]) =>
    task.completedAt || task.markedIssueAt || task.createdAt;

  const historyTasks = tasks
    .filter((task) => task.status === 'completed' || task.status === 'could_not_complete' || task.status === 'blocked')
    .filter((task) => {
      if (!selectedDate) return true;
      const time = eventTime(task);
      if (!time) return false;
      return new Date(time).toLocaleDateString('en-CA') === selectedDate;
    })
    .sort((a, b) => {
      const aTime = new Date(a.completedAt || a.markedIssueAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.completedAt || b.markedIssueAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  const groupedTasks = historyTasks.reduce<Record<string, typeof historyTasks>>((groups, task) => {
    const time = eventTime(task);
    if (!time) return groups;
    const dateKey = new Date(time).toLocaleDateString('en-CA');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(task);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 border-b border-slate-150 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('adminHistory.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('adminHistory.subtitle')}</p>
      </header>

      <div className="mb-5 flex justify-end">
        <div className="relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm hover:border-slate-350 transition-colors">
          <Calendar size={14} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            {selectedDate ? formatDate(new Date(`${selectedDate}T00:00:00`), { dateStyle: 'medium' }) : t('adminHistory.filterLabel')}
          </span>
          
          <input
            id="admin-history-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            onClick={(e) => {
              try {
                (e.target as HTMLInputElement).showPicker();
              } catch {}
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {selectedDate && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedDate('');
              }}
              className="relative z-20 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center transition-colors"
              title={t('adminHistory.clearFilter')}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      {/* Task List */}
      {dbTasksRaw === undefined ? (
        <TaskListSkeleton count={5} />
      ) : sortedDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center text-slate-500">
          {t('adminHistory.empty')}
        </div>
      ) : (
        <div className="space-y-6">
            {sortedDates.map((dateKey) => (
              <section key={dateKey}>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                  {formatDate(new Date(`${dateKey}T00:00:00`), { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <div className="space-y-3">
                  {groupedTasks[dateKey].map((task) => (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/task/${task.id}`)}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-350"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold text-slate-900">{task.title}</h2>
                            <StatusBadge status={task.status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            {task.assignedByName && <span>{t('common.assignedBy')}: {task.assignedByName}</span>}
                            <span>
                              {t('taskDetail.assignedTo')}: {task.assignedTo && task.assignedTo.length > 0
                                ? task.assignedTo.map((id: string) => users.find((user) => user.id === id)?.name).join(', ')
                                : t('common.unassigned')}
                            </span>
                            {eventTime(task) && (
                              <span>
                                {t('adminHistory.timeline')}: {formatDateTime(eventTime(task)!, { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                          {task.blockReason && (
                            <p className="mt-3 rounded-lg border border-red-200/90 dark:border-red-800/80 bg-red-50/90 dark:bg-red-950/40 px-3 py-2 text-sm text-red-950 dark:text-red-100 font-medium">
                              <span className="font-semibold">{t('common.reason')}:</span> {task.blockReason}
                            </p>
                          )}
                          {task.completionComment && (
                            <p className="mt-3 rounded-lg border border-emerald-200/90 dark:border-emerald-800/80 bg-emerald-50/90 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-950 dark:text-emerald-100 font-medium">
                              <span className="font-semibold">{t('common.note')}:</span> {task.completionComment}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      }
    </div>
  );
};

export default AdminTaskHistory;
