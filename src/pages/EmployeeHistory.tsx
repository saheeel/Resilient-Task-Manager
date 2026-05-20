import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, BarChart2, CheckCircle2, AlertOctagon, RefreshCw, Calendar, Clock, MessageSquare } from 'lucide-react';

const EmployeeHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, users, currentUser } = useTasks();

  const employee = users.find(u => u.id === id);

  // Security Check: Only managers can view user history profiles
  if (!currentUser || currentUser.role !== 'manager') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-red-700 font-semibold bg-red-50 border border-red-200 rounded-lg p-4">
          Access Denied. Only Managers are authorized to view team history profiles.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="bg-slate-900 text-white rounded-lg px-4 py-2 mt-6 text-sm font-semibold transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 font-medium">Employee profile not found.</p>
        <button 
          onClick={() => navigate('/settings')} 
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition-colors mt-6 cursor-pointer"
        >
          Back to Settings
        </button>
      </div>
    );
  }

  // Filter tasks assigned to this employee
  const employeeTasks = tasks.filter(t => t.assignedTo.includes(employee.id));
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
    return new Date(isoString).toLocaleString(undefined, {
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
        Back to Team Settings
      </button>

      {/* Profile Info Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 border border-blue-150 flex items-center justify-center text-xl font-bold">
            {employee.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100 uppercase tracking-wider">
                Employee
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{employee.employeeRole || 'General Staff'}</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">Username: {employee.username}</p>
          </div>
        </div>

        {/* Action button */}
        <button 
          onClick={() => navigate(`/settings/employee/${employee.id}/edit`)}
          className="border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer text-center"
        >
          Modify Employee Details
        </button>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tasks</span>
            <BarChart2 size={18} />
          </div>
          <span className="text-2xl font-bold text-slate-800">{employeeTasks.length}</span>
        </div>

        <div className="bg-green-50/50 p-5 rounded-xl border border-green-150">
          <div className="flex justify-between items-center text-green-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 size={18} />
          </div>
          <span className="text-2xl font-bold text-green-950">{completedTasks.length}</span>
        </div>

        <div className="bg-red-50/50 p-5 rounded-xl border border-red-150">
          <div className="flex justify-between items-center text-red-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Incomplete / Issues</span>
            <AlertOctagon size={18} />
          </div>
          <span className="text-2xl font-bold text-red-950">{issueTasks.length}</span>
        </div>

        <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-150">
          <div className="flex justify-between items-center text-blue-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
            <RefreshCw size={18} className="animate-spin-slow" />
          </div>
          <span className="text-2xl font-bold text-blue-950">{activeTasks.length}</span>
        </div>
      </div>

      {/* Detailed Work History Table */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-4 tracking-tight flex items-center gap-2">
          <Calendar size={18} className="text-slate-500" />
          Work History & Activity Logs
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {employeeTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Task Detail</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Timeline Details</th>
                    <th className="px-5 py-3.5">Time Spent</th>
                    <th className="px-5 py-3.5">Comments & Explanations</th>
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
                        <span className="text-xs text-slate-400 mt-0.5 block capitalize">{task.type} schedule</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          task.priority === 'high' ? 'bg-red-50 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="px-5 py-4 text-xs space-y-1">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="font-medium text-slate-700 min-w-[70px]">Assigned:</span>
                          <span>{formatDate(task.createdAt)}</span>
                        </div>
                        {task.startedAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-slate-700 min-w-[70px]">Started:</span>
                            <span>{formatDate(task.startedAt)}</span>
                          </div>
                        )}
                        {task.status === 'completed' && task.completedAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-slate-750 min-w-[70px]">Finished:</span>
                            <span>{formatDate(task.completedAt)}</span>
                          </div>
                        )}
                        {(task.status === 'could_not_complete' || task.status === 'blocked') && task.markedIssueAt && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <span className="font-medium text-red-700 min-w-[70px]">Reported:</span>
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
                            Active Timer
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Not started</span>
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
                            <span>Reason: "{task.blockReason}"</span>
                          </div>
                        )}
                        {!task.completionComment && !task.blockReason && (
                          <span className="text-slate-400 font-normal">No comments recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-6 text-center text-sm text-slate-500">This employee has not been assigned any tasks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeHistory;
