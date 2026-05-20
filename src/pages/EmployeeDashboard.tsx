import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { CheckCircle, Calendar, AlertCircle } from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser } = useTasks();

  if (!currentUser) return null;

  // Filter tasks strictly for the logged-in employee
  const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));
  
  const activeTasks = myTasks.filter(t => t.status === 'open' || t.status === 'in_progress');
  const issueTasks = myTasks.filter(t => t.status === 'blocked' || t.status === 'could_not_complete');
  const completedTasks = myTasks.filter(t => t.status === 'completed');

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
      <header className="mb-8 flex justify-between items-end border-b border-slate-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {currentUser.name.split(' ')[0]}. Here is your active work.
          </p>
        </div>
        <div className="text-right">
          <span className="block text-3xl font-bold text-slate-800">{activeTasks.length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active</span>
        </div>
      </header>

      {/* Issues Section */}
      {issueTasks.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight flex items-center gap-2">
            <AlertCircle size={18} className="text-red-500" />
            My Blocked Tasks
          </h2>
          <div className="flex flex-col gap-3">
            {issueTasks.map(task => (
              <div 
                key={task.id} 
                className="bg-red-50 hover:bg-red-100/60 border border-red-200 rounded-xl p-4 cursor-pointer transition-colors"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="font-semibold text-red-950 text-sm">{task.title}</span>
                  <StatusBadge status={task.status} />
                </div>
                {task.blockReason && (
                  <p className="text-xs text-red-800 mt-2 font-medium bg-white/60 inline-block px-2 py-1 rounded border border-red-100">
                    Reason: {task.blockReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Tasks */}
      <div className="mb-8">
        <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">Current Assignments</h2>
        {activeTasks.length > 0 ? (
          <div className="grid gap-3">
            {activeTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2 text-sm">{task.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    {task.priority === 'high' && (
                      <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">High Priority</span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <StatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <CheckCircle size={32} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-slate-700 font-semibold mb-1">All caught up!</h3>
            <p className="text-slate-500 text-sm">You have no active tasks assigned to you right now.</p>
          </div>
        )}
      </div>

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-900 text-lg mb-3 tracking-tight">Recently Completed</h2>
          <div className="grid gap-2 opacity-75">
            {completedTasks.slice(0, 5).map(task => (
              <div 
                key={task.id}
                onClick={() => navigate(`/task/${task.id}`)}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-slate-700 text-sm line-through decoration-slate-300">{task.title}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1.5 font-medium">
                    {task.completedAt && (
                      <span>Completed At: {new Date(task.completedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                    )}
                    {task.startedAt && task.completedAt && (
                      <span className="font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded border border-green-200">Took: {formatTimeTaken(task.startedAt, task.completedAt)}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                  <CheckCircle size={12} className="text-green-600" />
                  Done
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
