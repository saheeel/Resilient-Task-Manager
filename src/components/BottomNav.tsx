import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, History, List, CheckSquare } from 'lucide-react';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';

const BottomNav: React.FC = () => {
  const { currentUser } = useTasks();
  const { t } = useLanguage();

  if (!currentUser) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around z-50 px-2"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)'
      }}
    >
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <LayoutDashboard size={20} />
        <span>{isAdminRole(currentUser.role) ? (t('nav.adminDashboard') || 'Dashboard') : t('nav.dashboard')}</span>
      </NavLink>

      {/* Employee: show History tab */}
      {currentUser.role === 'employee' && (
        <>
          <NavLink 
            to="/all-tasks"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List size={20} />
            <span>{t('nav.allTasks')}</span>
          </NavLink>
          <NavLink 
            to="/history"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
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
              isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CheckSquare size={20} />
            <span>{t('nav.dashboard')}</span>
          </NavLink>
          <NavLink 
            to="/admin-history"
            className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
              isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History size={20} />
            <span>{t('nav.history')}</span>
          </NavLink>
        </>
      )}

      {isAdminRole(currentUser.role) && (
        <NavLink 
          to="/settings"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
            isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings size={20} />
          <span>{t('nav.settings')}</span>
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
