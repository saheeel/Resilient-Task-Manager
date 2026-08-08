import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CheckCircle2, Clock, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskListSkeleton } from '../components/TaskSkeleton';

const CompletedHistory: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useTasks();
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, []);
  const dbTasksRaw = useQuery(api.tasks.list, { cutoffDate });
  const tasks = useMemo(() => ((dbTasksRaw as any[]) || []).map(t => ({ ...t, id: t.id || t._id })), [dbTasksRaw]);
  const { t, formatDate, formatTime, priorityLabel, taskTypeLabel, relativeDayLabel } = useLanguage();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  if (!currentUser) return null;

  const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));

  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Past completed tasks = completed BEFORE today
  const pastCompleted = myTasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.completedAt) return false;
    const completedDate = new Date(t.completedAt);
    return completedDate < today;
  });

  // Group by date (YYYY-MM-DD)
  const grouped: Record<string, typeof pastCompleted> = {};
  pastCompleted.forEach(task => {
    const dateKey = task.completedAt
      ? new Date(task.completedAt).toLocaleDateString('en-CA') // YYYY-MM-DD format
      : 'unknown';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  });

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const formatDateLabel = (dateKey: string) => {
    const date = new Date(dateKey + 'T00:00:00');
    const relativeLabel = relativeDayLabel(date, today);
    if (relativeLabel === t('common.yesterday')) {
      return relativeLabel;
    }
    return formatDate(date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTimeTaken = (start?: string, end?: string) => {
    if (!start || !end) return '';
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return '0 min';
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 border-b border-slate-150 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <CheckCircle2 size={22} className="text-green-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('app.completedHistory')}</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1 ml-0.5">
          {t('completedHistory.subtitle')}
        </p>
      </header>

      {dbTasksRaw === undefined ? (
        <TaskListSkeleton count={5} />
      ) : sortedDates.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
          <CheckCircle2 size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-slate-700 font-semibold mb-1">{t('completedHistory.emptyTitle')}</h3>
          <p className="text-slate-400 text-sm">
            {t('completedHistory.emptySubtitle')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map(dateKey => {
            const isExpanded = expandedDates.has(dateKey);
            const dayTasks = grouped[dateKey];

            return (
              <div key={dateKey} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Date Header - clickable to expand/collapse */}
                <button
                  onClick={() => toggleDate(dateKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left cursor-pointer bg-transparent border-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                      <Calendar size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-sm">{formatDateLabel(dateKey)}</span>
                      <span className="ml-2.5 inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                        {dayTasks.length === 1
                          ? t('completedHistory.tasksCount', { count: dayTasks.length })
                          : t('completedHistory.tasksCount_plural', { count: dayTasks.length })}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {/* Task list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/task/${task.id}`)}
                        className="px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-700 text-sm line-through decoration-slate-300">
                              {task.title}
                            </span>
                            {task.priority === 'high' && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                {priorityLabel('high')}
                              </span>
                            )}
                            {task.priority === 'medium' && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                {priorityLabel('medium')}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                            {task.completedAt && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 size={11} className="text-green-500" />
                                {formatTime(task.completedAt)}
                              </span>
                            )}
                            {task.startedAt && task.completedAt && (
                              <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100 font-semibold">
                                <Clock size={11} />
                                {formatTimeTaken(task.startedAt, task.completedAt)}
                              </span>
                            )}
                            {task.type !== 'one-time' ? (
                              <span className="capitalize text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 text-[10px] font-semibold">
                                {taskTypeLabel(task.type)} {t('completedHistory.taskTypeSuffix')}
                              </span>
                            ) : (
                              <span className="capitalize text-slate-400">
                                {taskTypeLabel(task.type)} {t('completedHistory.taskTypeSuffix')}
                              </span>
                            )}
                          </div>
                          {task.completionComment && (
                            <p className="text-xs text-slate-500 mt-1.5 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100">
                              "{task.completionComment}"
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
                            <CheckCircle2 size={12} />
                            {t('common.done')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary at bottom */}
      {sortedDates.length > 0 && (
        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">{t('completedHistory.totalCompletedBeforeToday')}</span>
          <span className="text-lg font-bold text-slate-800">{pastCompleted.length}</span>
        </div>
      )}
    </div>
  );
};

export default CompletedHistory;
