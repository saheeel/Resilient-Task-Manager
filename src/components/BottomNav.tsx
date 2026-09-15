import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, List, CheckSquare, Calendar } from 'lucide-react';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNav: React.FC = () => {
  const { currentUser } = useTasks();
  const { t } = useLanguage();

  if (!currentUser) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-50 px-2 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      style={{
        paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))'
      }}
    >
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`}
      >
        <LayoutDashboard size={20} />
        <span>{isAdminRole(currentUser.role) ? (t('nav.adminDashboard') || 'Dashboard') : t('nav.dashboard')}</span>
      </NavLink>

      {/* Calendar Tab */}
      <NavLink 
        id="bottom-nav-calendar-btn"
        to="/calendar" 
        className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`}
      >
        <Calendar size={20} />
        <span>{t('nav.calendar') || 'Calendar'}</span>
      </NavLink>

      {/* Employee: show All Tasks & History tabs */}
      {currentUser.role === 'employee' && (
        <>
          <NavLink 
            to="/all-tasks"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <List size={20} />
            <span>{t('nav.allTasks')}</span>
          </NavLink>
          <NavLink 
            to="/history"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History size={20} />
            <span>{t('nav.history')}</span>
          </NavLink>
        </>
      )}

      {isAdminRole(currentUser.role) && (
        <>
          <NavLink 
            to="/my-tasks"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <CheckSquare size={20} />
            <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink 
            to="/admin-history"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History size={20} />
            <span>{t('nav.history')}</span>
          </NavLink>
        </>
      )}
    </nav>
  );
};

export default BottomNav;
