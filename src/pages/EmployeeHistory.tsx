import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, BarChart2, CheckCircle2, AlertOctagon, RefreshCw, Calendar, Clock, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const EmployeeHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser } = useTasks();
  const dbTasksRaw = useQuery(api.tasks.list, {});
  const tasks = (dbTasksRaw as any[]) || [];
  const { t, formatDateTime, roleLabel, priorityLabel } = useLanguage();

  const employee = users.find(u => u.id === id);

  // Security Check: Only managers can view user history profiles
  if (!currentUser || !isAdminRole(currentUser.role)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-700 font-semibold bg-red-50 border border-red-200 rounded-lg p-4">
          {t('employeeHistory.accessDenied')}
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-slate-900 text-white rounded-lg px-4 py-2 mt-6 text-sm font-semibold transition-colors cursor-pointer"
        >
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 font-medium">{t('employeeHistory.employeeNotFound')}</p>
        <button 
          onClick={() => navigate('/settings')} 
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition-colors mt-6 cursor-pointer"
        >
          {t('editEmployee.backToSettings')}
        </button>
      </div>
    );
  }

  const getPriorityWeight = (priority: string) => {
    if (priority === 'high') return 3;
    if (priority === 'medium') return 2;
    return 1;
  };

  // Filter & sort tasks assigned to this employee (Due Date first, then Priority)
  const employeeTasks = tasks
    .filter(t => t.assignedTo.includes(employee.id))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (a.dueDate && b.dueDate) {
        const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (timeDiff !== 0) return timeDiff;
      } else if (a.dueDate) {
        return -1;
      } else if (b.dueDate) {
        return 1;
      }

      return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
    });

  const activeTasks = employeeTasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTasks = employeeTasks.filter(t => t.status === 'completed');
  const issueTasks = employeeTasks.filter(t => t.status === 'could_not_complete' || t.status === 'blocked');

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

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    return formatDateTime(isoString, {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back to Settings */}
      <button 
        onClick={() => navigate('/settings')} 
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={16} />
        {t('employeeHistory.backToTeamSettings')}
      </button>

      {/* Profile Info Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 border border-blue-150 flex items-center justify-center text-xl font-bold">
            {(employee.name || 'User').split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100 uppercase tracking-wider">
                {roleLabel('employee')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{employee.employeeRole || t('employeeHistory.generalStaff')}</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{t('employeeHistory.usernameLabel')}: {employee.username}</p>
          </div>
        </div>

        {/* Action button */}
        <button 
          onClick={() => navigate(`/settings/employee/${employee.id}/edit`)}
          className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer text-center"
        >
          {t('employeeHistory.modifyEmployeeDetails')}
        </button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('employeeHistory.totalTasks')}</span>
            <BarChart2 size={18} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{employeeTasks.length}</span>
        </div>

        <div className="bg-green-50/50 p-5 rounded-xl border border-green-150">
          <div className="flex justify-between items-center text-green-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('employeeHistory.completed')}</span>
            <CheckCircle2 size={18} />
          </div>
          <span className="text-2xl font-bold text-green-950">{completedTasks.length}</span>
        </div>

        <div className="bg-red-50/50 p-5 rounded-xl border border-red-150">
          <div className="flex justify-between items-center text-red-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('employeeHistory.incompleteIssues')}</span>
            <AlertOctagon size={18} />
          </div>
          <span className="text-2xl font-bold text-red-950">{issueTasks.length}</span>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-150">
          <div className="flex justify-between items-center text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('employeeHistory.active')}</span>
            <RefreshCw size={18} className="animate-spin-slow" />
          </div>
          <span className="text-2xl font-bold text-blue-950">{activeTasks.length}</span>
        </div>
      </div>

      {/* Detailed Work History Table */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-4 tracking-tight flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          {t('employeeHistory.workHistory')}
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {employeeTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">{t('employeeHistory.taskDetail')}</th>
                    <th className="px-5 py-3.5">{t('common.priority')}</th>
                    <th className="px-5 py-3.5">{t('common.status')}</th>
                    <th className="px-5 py-3.5">{t('employeeHistory.timelineDetails')}</th>
                    <th className="px-5 py-3.5">{t('employeeHistory.timeSpent')}</th>
                    <th className="px-5 py-3.5">{t('employeeHistory.commentsExplanations')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {employeeTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-900 block">{task.title}</span>
                        <span className="text-xs text-slate-400 mt-0.5 block capitalize">{task.type} {t('employeeHistory.scheduleSuffix')}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          task.priority === 'high' ? 'bg-red-50 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {priorityLabel(task.priority)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="px-5 py-4 text-xs space-y-1">
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-semibold text-indigo-700 min-w-[70px]">{t('createTask.dueDate') || 'Fälligkeit'}:</span>
                            <span className="font-semibold text-indigo-900">{formatDate(task.dueDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-slate-700 min-w-[70px]">{t('employeeHistory.assigned')}:</span>
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                        {task.startedAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-slate-700 min-w-[70px]">{t('employeeHistory.started')}:</span>
                            <span>{formatDate(task.startedAt)}</span>
                          </div>
                        )}
                        {task.status === 'completed' && task.completedAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-slate-750 min-w-[70px]">{t('employeeHistory.finished')}:</span>
                            <span>{formatDate(task.completedAt)}</span>
                          </div>
                        )}
                        {(task.status === 'could_not_complete' || task.status === 'blocked') && task.markedIssueAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-red-700 min-w-[70px]">{t('employeeHistory.reported')}:</span>
                            <span>{formatDate(task.markedIssueAt)}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {task.startedAt && task.completedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-150 px-2.5 py-1 rounded">
                            <Clock size={12} />
                            {formatTimeTaken(task.startedAt, task.completedAt)}
                          </span>
                        ) : task.startedAt ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded animate-pulse">
                            {t('employeeHistory.activeTimer')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">{t('common.notStarted')}</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs max-w-xs">
                        {task.status === 'completed' && task.completionComment && (
                          <div className="flex gap-1 items-start text-green-800 bg-green-50 border border-green-200/50 p-2 rounded-lg">
                            <MessageSquare size={12} className="shrink-0 mt-0.5" />
                            <span>"{task.completionComment}"</span>
                          </div>
                        )}
                        {(task.status === 'could_not_complete' || task.status === 'blocked') && task.blockReason && (
                          <div className="flex gap-1 items-start text-red-800 bg-red-50 border border-red-200/50 p-2 rounded-lg">
                            <MessageSquare size={12} className="shrink-0 mt-0.5" />
                            <span>{t('common.reason')}: "{task.blockReason}"</span>
                          </div>
                        )}
                        {!task.completionComment && !task.blockReason && (
                          <span className="text-slate-400 font-normal">{t('common.noCommentsRecorded')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">{t('employeeHistory.noAssignedTasks')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeHistory;
