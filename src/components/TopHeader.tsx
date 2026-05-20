import React, { useEffect, useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ensurePushSubscription } from '../lib/pushNotifications';

const TopHeader: React.FC = () => {
  const { currentUser, logout } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const savePushSubscription = useMutation(api.pushMutations.subscribe);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  useEffect(() => {
    if (typeof Notification === 'undefined') {
      setNotificationPermission('unsupported');
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  const handleEnableAlerts = async () => {
    if (!currentUser || typeof Notification === 'undefined') return;

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        await ensurePushSubscription(currentUser.id, savePushSubscription);
      }
    } catch (error) {
      console.error('Failed to enable alerts:', error);
    }
  };

  if (!currentUser) return null;

  const firstName = currentUser.name.split(' ')[0];
  const initials = currentUser.name
    .split(' ')
    .map((name) => name[0])
    .join('');

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-6"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(env(safe-area-inset-top, 0px) + 4rem)'
      }}
    >
      <div className="flex items-center gap-2">
        <img src="/resilientlogo.svg" alt="Resilient Logo" className="w-6 h-6 object-contain" />
        <span className="hidden text-sm font-bold tracking-tight text-slate-900 sm:inline">
          Resilient Operations
        </span>
      </div>

      <div className="flex items-center gap-2">
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <button
            type="button"
            onClick={handleEnableAlerts}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 cursor-pointer"
          >
            {t('common.enableAlerts')}
          </button>
        )}

        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm"
          aria-label={t('common.selectLanguage')}
        >
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'en' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('de')}
            className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              language === 'de' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            DE
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
            {initials}
          </div>
          <span className="text-xs font-semibold text-slate-700">
            {firstName}
          </span>
        </div>

        <button 
          onClick={logout}
          title={t('common.signOut')}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
