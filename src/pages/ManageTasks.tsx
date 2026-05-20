import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { PlusCircle, CheckCircle, AlertCircle, Edit, Trash2 } from 'lucide-react';

const ManageTasks: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, users, currentUser, deleteTask } = useTasks();

  if (!currentUser) return null;

  const completedToday = tasks.filter(t => t.status === 'completed').length;
  const issues = tasks.filter(t => t.status === 'could_not_complete' || t.status === 'blocked');
  const activeTasks = tasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

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
      <header className="mb-8 flex justify-between items-center border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {currentUser.name.split(' ')[0]}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/create')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle size={18} />
            New Task
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{completedToday}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attention Required</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{issues.length}</p>
          </div>
        </div>
      </div>

      {/* Attention Required Section */}
      <div className="mb-8">
        <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">Attention Required</h2>
        {issues.length > 0 ? (
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
                      title="Edit Task"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Are you sure you want to delete this task?")) {
                          deleteTask(task.id);
                        }
                      }}
                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-red-800 mt-2 font-medium bg-white/60 inline-block px-2 py-1 rounded border border-red-100">
                  Reason: {task.blockReason || 'No reason provided'}
                </p>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-red-950/80">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">Assigned To:</span>
                    <span>
                      {task.assignedTo.length > 0 
                        ? task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')
                        : 'Unassigned'}
                    </span>
                  </div>
                  {task.createdAt && (
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">• Assigned At:</span>
                      <span>{new Date(task.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                  {task.markedIssueAt && (
                    <div className="flex items-center gap-1 text-red-700 font-semibold bg-red-100/80 px-1.5 py-0.5 rounded border border-red-200/50">
                      <span>• Marked Incomplete At:</span>
                      <span>{new Date(task.markedIssueAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 p-4 rounded-xl">No blocked tasks or issues.</p>
        )}
      </div>

      {/* Active Tasks Table */}
      <div>
        <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">Active Tasks</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {activeTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Task Title</th>
                    <th className="px-5 py-3">Assigned Team Members</th>
                    <th className="px-5 py-3 w-[130px] whitespace-nowrap">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTasks.map(task => (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50 cursor-pointer transition-colors" 
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900">{task.title}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {task.assignedTo.length > 0 
                          ? task.assignedTo.map(id => users.find(u => u.id === id)?.name.split(' ')[0]).join(', ')
                          : 'Unassigned'}
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
                            title="Edit Task"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Are you sure you want to delete this task?")) {
                                deleteTask(task.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Delete Task"
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
            <p className="p-6 text-center text-sm text-slate-500">No active tasks right now.</p>
          )}
        </div>
      </div>

      {/* Recently Completed Tasks */}
      <div className="mt-8">
        <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">Recently Completed</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {completedTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Task Title</th>
                    <th className="px-5 py-3">Completed By</th>
                    <th className="px-5 py-3">Completed At</th>
                    <th className="px-5 py-3">Duration</th>
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
                          : 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {task.completedAt ? new Date(task.completedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
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
            <p className="p-6 text-center text-sm text-slate-500">No completed tasks yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageTasks;
