import React from 'react';
import { useTasks } from '../contexts/TaskContext';
import { LogOut } from 'lucide-react';

const TopHeader: React.FC = () => {
  const { currentUser, logout } = useTasks();

  if (!currentUser) return null;

  const isManager = currentUser.role === 'manager';

  return (
    <header 
      className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(env(safe-area-inset-top, 0px) + 4rem)'
      }}
    >
      <div className="flex items-center gap-2">
        <img src="/resilientlogo.svg" alt="Resilient Logo" className="w-6 h-6 object-contain" />
        <span className="font-bold text-slate-900 text-sm tracking-tight">
          Resilient Operations
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isManager ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline-block">
            {currentUser.name.split(' ')[0]}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded hidden sm:inline-block ${
            isManager ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {currentUser.role}
          </span>
        </div>

        <button 
          onClick={logout}
          title="Sign Out"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
