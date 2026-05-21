import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, Edit, Trash2, PauseCircle, PlayCircle, RefreshCw, Square } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ManageTasks: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, users, currentUser, deleteTask, editTask } = useTasks();
  const { t, formatDateTime, formatTime, taskTypeLabel, weekdayLabel, monthDayOrdinalLabel } = useLanguage();

  if (!currentUser) return null;

  const issues = tasks.filter(t => t.status === 'could_not_complete' || t.status === 'blocked');
  const activeTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const recurringTasks = tasks.filter((task) => task.type !== 'one-time');
  const runningRecurringTasks = recurringTasks.filter((task) => !task.isPaused);

  const formatRecurringTime = (time?: string) => {
    if (!time) return '';
    return formatTime(`1970-01-01T${time}:00`);
  };

  const recurringScheduleLabel = (task: any) => {
    if (task.type === 'daily') {
      return task.recurringTime ? `${t('manageTasks.everyDayAt')} ${formatRecurringTime(task.recurringTime)}` : t('manageTasks.everyDay');
    }
    if (task.type === 'weekly') {
      const days = task.recurringDay
        ? task.recurringDay.split(',').map((day: string) => weekdayLabel(day.trim())).join(', ')
        : t('manageTasks.noScheduleSet');
      return task.recurringTime
        ? `${days} • ${formatRecurringTime(task.recurringTime)}`
        : days;
    }
    if (task.type === 'monthly') {
      const day = task.recurringDay ? monthDayOrdinalLabel(task.recurringDay) : t('manageTasks.noScheduleSet');
      return task.recurringTime
        ? `${day} • ${formatRecurringTime(task.recurringTime)}`
        : day;
    }
    return '';
  };

  const toggleRecurringPause = (task: any) => {
    editTask(task.id, {
      isPaused: !task.isPaused,
      pausedAt: task.isPaused ? undefined : new Date().toISOString(),
    });
  };

  const stopRecurring = (task: any) => {
    editTask(task.id, {
      type: 'one-time',
      recurringDay: undefined,
      recurringTime: undefined,
      isPaused: false,
      pausedAt: undefined,
    });
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
      {recurringTasks.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">{t('manageTasks.recurringSchedules')}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t('manageTasks.recurringSummary', {
                  running: runningRecurringTasks.length,
                  total: recurringTasks.length,
                })}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <RefreshCw size={14} />
              {runningRecurringTasks.length} {t('manageTasks.runningNow')}
            </div>
          </div>

          <div className="grid gap-3">
            {recurringTasks.map((task) => (
              <div
                key={task.id}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {taskTypeLabel(task.type)}
                      </span>
                      {task.isPaused ? (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          {t('manageTasks.paused')}
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {t('manageTasks.running')}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{recurringScheduleLabel(task)}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {task.assignedTo.length > 0
                        ? task.assignedTo.map((id: string) => users.find(u => u.id === id)?.name.split(' ')[0]).join(', ')
                        : t('common.unassigned')}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRecurringPause(task);
                      }}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        task.isPaused
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {task.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                      {task.isPaused ? t('manageTasks.resumeRecurring') : t('manageTasks.pauseRecurring')}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          stopRecurring(task);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
                      >
                        <Square size={12} />
                        {t('manageTasks.stopRecurring')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('common.confirmDeleteTask'))) {
                            deleteTask(task.id);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700 transition-colors hover:bg-red-100 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attention Required Section */}
      {issues.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">{t('manageTasks.attentionRequired')}</h2>
          <div className="flex flex-col gap-3">
            {issues.map(task => (
              <div 
                key={task.id} 
                className="bg-red-50 hover:bg-red-100/60 border border-red-200 rounded-xl p-4 cursor-pointer transition-colors"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-red-950 text-sm">{task.title}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/task/${task.id}/edit`);
                      }}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-red-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                      title={t('manageTasks.editTask')}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(t('common.confirmDeleteTask'))) {
                          deleteTask(task.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                      title={t('manageTasks.deleteTask')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-red-800 mt-2 font-medium bg-white/60 inline-block px-2 py-1 rounded border border-red-100">
                  {t('common.reason')}: {task.blockReason || t('manageTasks.noReasonProvided')}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-red-950/80">
                  {task.assignedByName && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{t('common.assignedBy')}:</span>
                      <span>{task.assignedByName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{t('taskDetail.assignedTo')}:</span>
                    <span>
                      {task.assignedTo.length > 0 
                        ? task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')
                        : t('common.unassigned')}
                    </span>
                  </div>
                  {task.createdAt && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">• {t('manageTasks.assignedAt')}:</span>
                      <span>{formatDateTime(task.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                  {task.markedIssueAt && (
                    <div className="flex items-center gap-1 text-red-700 font-semibold bg-red-100/80 px-1.5 py-0.5 rounded border border-red-200/50">
                      <span>• {t('manageTasks.markedIncompleteAt')}:</span>
                      <span>{formatDateTime(task.markedIssueAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tasks Table */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">{t('manageTasks.activeTasks')}</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {activeTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">{t('manageTasks.taskTitle')}</th>
                    <th className="px-5 py-3">{t('manageTasks.assignedTeamMembers')}</th>
                    <th className="px-5 py-3 w-[130px] whitespace-nowrap">{t('common.status')}</th>
                    <th className="px-5 py-3 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{task.title}</span>
                          {task.type !== 'one-time' ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {taskTypeLabel(task.type)}
                            </span>
                          ) : null}
                          {task.isPaused ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                              {t('manageTasks.paused')}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {task.assignedTo.length > 0 
                          ? task.assignedTo.map(id => users.find(u => u.id === id)?.name.split(' ')[0]).join(', ')
                          : t('common.unassigned')}
                      </td>
                      <td className="px-5 py-3.5 w-[130px] whitespace-nowrap">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/task/${task.id}/edit`);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('manageTasks.editTask')}
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(t('common.confirmDeleteTask'))) {
                                deleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('manageTasks.deleteTask')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">{t('manageTasks.noActiveTasks')}</p>
          )}
        </div>
      </div>

      {/* Recently Completed Tasks */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 text-lg tracking-tight">{t('manageTasks.recentlyCompleted')}</h2>
          <button
            type="button"
            onClick={() => navigate('/admin-history')}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer bg-transparent border-none p-0"
          >
            {t('nav.history')}
          </button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {completedTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">{t('manageTasks.taskTitle')}</th>
                    <th className="px-5 py-3">{t('manageTasks.completedBy')}</th>
                    <th className="px-5 py-3">{t('manageTasks.completedAt')}</th>
                    <th className="px-5 py-3">{t('manageTasks.duration')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedTasks.slice(0, 10).map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-700 line-through decoration-slate-350">{task.title}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {task.assignedTo.length > 0 
                          ? task.assignedTo.map(id => users.find(u => u.id === id)?.name.split(' ')[0]).join(', ')
                          : t('common.unassigned')}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {task.completedAt ? formatDateTime(task.completedAt, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5">
                        {task.startedAt && task.completedAt ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-150">
                            {formatTimeTaken(task.startedAt, task.completedAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">{t('manageTasks.noCompletedTasks')}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/create')}
        className="fixed bottom-20 right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-slate-800 cursor-pointer md:bottom-20 md:right-8"
      >
        <PlusCircle size={18} />
        {t('manageTasks.newTask')}
      </button>
    </div>
  );
};

export default ManageTasks;
