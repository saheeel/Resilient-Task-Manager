import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Calendar } from 'lucide-react';
import { useTasks } from '../contexts/TaskContext';

const BottomNav: React.FC = () => {
  const { currentUser } = useTasks();

  if (!currentUser) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around z-50">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>
      
      <NavLink 
        to="/calendar"
        className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Calendar size={20} />
        <span>Schedule</span>
      </NavLink>

      {currentUser.role === 'manager' && (
        <NavLink 
          to="/settings"
          className={({ isActive }) => `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
            isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNav;
