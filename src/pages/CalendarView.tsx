import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { Calendar as CalendarIcon } from 'lucide-react';
import TaskCalendar from '../components/TaskCalendar';
import { useLanguage } from '../contexts/LanguageContext';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser, users } = useTasks();
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6 flex justify-between items-center border-b border-slate-150 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-sm">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('calendar.title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('calendar.subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
        <TaskCalendar
          tasks={tasks}
          users={users}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
          onTaskOpen={(taskId) => navigate(`/task/${taskId}`)}
          initialView="timeGridWeek"
          height="75vh"
        />
      </div>
    </div>
  );
};

export default CalendarView;
