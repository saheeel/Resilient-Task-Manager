import React, { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';

const TopHeader: React.FC = () => {
  const { currentUser, logout } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLogoutConfirm(false);
      }
    };
    if (showLogoutConfirm) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [showLogoutConfirm]);

  if (!currentUser) return null;

  const nameToUse = currentUser.name || 'User';
  const firstName = nameToUse.split(' ')[0];

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          height: 'calc(env(safe-area-inset-top, 0px) + 4rem)'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 sm:pr-3 sm:border-r border-slate-200 dark:border-slate-700">
            <img src="/resilientlogo.svg" alt="Resilient Logo" className="w-6 h-6 object-contain" />
            <span className="hidden text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:inline">
              Resilient Operations
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {firstName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div
            className="flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 shadow-xs"
            aria-label={t('common.selectLanguage')}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('de')}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'de' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              DE
            </button>
          </div>



          <NotificationCenter userId={currentUser.id} />

          <button 
            onClick={() => setShowLogoutConfirm(true)}
            title={t('common.signOut')}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-rose-950/40 hover:border-red-100 transition-all cursor-pointer animate-none"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setShowLogoutConfirm(false)}
          />
          
          {/* Modal Container */}
          <div 
            className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center z-10 animate-scale-up"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-rose-950/50 text-red-600 dark:text-rose-400 mb-4 ring-8 ring-red-50/50 dark:ring-rose-950/30">
              <LogOut size={22} className="stroke-[2.5]" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('common.signOut')}
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 px-2">
              {t('common.confirmSignOut')}
            </p>
            
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 shadow-md shadow-red-200/50 transition-all cursor-pointer"
              >
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopHeader;
