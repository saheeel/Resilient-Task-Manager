import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { Calendar as CalendarIcon, Users } from 'lucide-react';
import TaskCalendar from '../components/TaskCalendar';
import { useLanguage } from '../contexts/LanguageContext';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser, users, updateTaskStatus } = useTasks();
  const { t } = useLanguage();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');

  const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;

  const handleQuickComplete = (taskId: string) => {
    updateTaskStatus(taskId, 'completed', {
      completedAt: new Date().toISOString(),
      completionComment: 'Quick completion from calendar',
    });
  };

  const filteredTasks = tasks.filter((task) => {
    if (isAdmin && selectedEmployeeId !== 'all') {
      return task.assignedTo.includes(selectedEmployeeId);
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 pb-36">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {t('calendar.title') || 'Calendar Schedule'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t('calendar.subtitle') || 'See upcoming work in a daily, weekly, or monthly scheduling view.'}
            </p>
          </div>
        </div>

        {/* Manager/Admin Team Member Filter */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">{t('common.allEmployees') || 'All Team Members'}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.employeeRole || user.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Calendar Card */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <TaskCalendar
          tasks={filteredTasks}
          users={users}
          currentUserId={currentUser?.id}
          currentUserRole={isAdmin ? (selectedEmployeeId === 'all' ? 'admin' : 'employee') : currentUser?.role}
          onTaskOpen={(taskId) => navigate(`/task/${taskId}`)}
          onQuickComplete={handleQuickComplete}
          initialView="listMonth"
          height="auto"
        />
      </div>
    </div>
  );
};

export default CalendarView;
