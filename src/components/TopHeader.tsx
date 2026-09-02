import React, { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { LogOut, MoreVertical } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationCenter from './NotificationCenter';

const TopHeader: React.FC = () => {
  const { currentUser, logout, updateUser } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLanguageChange = (nextLang: 'en' | 'de') => {
    setLanguage(nextLang);
    if (currentUser?.id) {
      updateUser(currentUser.id, { language: nextLang }).catch(console.error);
    }
  };

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
    }
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
          {/* Desktop Language Selector */}
          <div
            className="hidden sm:flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 shadow-xs"
            aria-label={t('common.selectLanguage')}
          >
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('de')}
              className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'de' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              DE
            </button>
          </div>

          <NotificationCenter userId={currentUser.id} />

          {/* Desktop Logout */}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            title={t('common.signOut')}
            className="hidden sm:flex items-center justify-center p-2 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            <LogOut size={22} />
          </button>

          {/* Mobile Menu Toggle */}
          <div className="relative sm:hidden">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <MoreVertical size={22} />
            </button>
            
            {showMobileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-scale-up origin-top-right">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('app.language')}</p>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg">
                      <button
                        onClick={() => { handleLanguageChange('en'); setShowMobileMenu(false); }}
                        className={`flex-1 rounded-md py-1 text-xs font-semibold transition-colors ${
                          language === 'en' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => { handleLanguageChange('de'); setShowMobileMenu(false); }}
                        className={`flex-1 rounded-md py-1 text-xs font-semibold transition-colors ${
                          language === 'de' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        DE
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowMobileMenu(false); setShowLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="font-semibold">{t('common.signOut')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
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
