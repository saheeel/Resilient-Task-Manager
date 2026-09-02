import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Bell, Check, Trash2, Clock, Hourglass, Calendar, CheckCircle2, AlertTriangle, Sparkles, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationCenterProps {
  userId: string;
}

interface NotificationItem {
  _id: Id<"notifications">;
  userId: string;
  title: string;
  body: string;
  url?: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const notifications = (useQuery(api.notifications.get, { userId }) as NotificationItem[] | undefined) || [];
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const clearAll = useMutation(api.notifications.clearAll);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead({ notificationId: notification._id });
    }
    setIsOpen(false);
    if (notification.url && notification.url !== "/") {
      navigate(notification.url);
    } else if (notification.url === "/") {
      navigate("/");
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead({ userId });
  };

  const handleClearAll = async () => {
    await clearAll({ userId });
  };

  const getNotificationDetails = (notification: NotificationItem) => {
    const type = notification.type;
    const title = notification.title || '';

    if (type === 'start_reminder' || title.includes('⏰') || title.toLowerCase().includes('starting') || title.toLowerCase().includes('startet')) {
      return {
        icon: <Clock size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />,
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80',
        tagText: t('notifications.startReminder'),
        tagColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60',
      };
    }

    if (type === 'due_reminder' || title.includes('⏳') || title.toLowerCase().includes('due') || title.toLowerCase().includes('fällig')) {
      return {
        icon: <Hourglass size={16} className="text-orange-600 dark:text-orange-400 shrink-0" />,
        badgeBg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800/80',
        tagText: t('notifications.dueReminder'),
        tagColor: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60',
      };
    }

    if (type === 'same_day_reminder' || title.includes('📅') || title.toLowerCase().includes('today') || title.toLowerCase().includes('heute')) {
      return {
        icon: <Calendar size={16} className="text-sky-600 dark:text-sky-400 shrink-0" />,
        badgeBg: 'bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/80',
        tagText: t('notifications.sameDayReminder'),
        tagColor: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60',
      };
    }

    if (type === 'completion' || title.includes('✅') || title.toLowerCase().includes('completed') || title.toLowerCase().includes('erledigt')) {
      return {
        icon: <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />,
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80',
        tagText: t('notifications.taskCompleted'),
        tagColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60',
      };
    }

    if (type === 'issue' || title.includes('⚠️') || title.toLowerCase().includes('issue') || title.toLowerCase().includes('blocked') || title.toLowerCase().includes('problem')) {
      return {
        icon: <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />,
        badgeBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/80',
        tagText: t('notifications.taskIssue'),
        tagColor: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60',
      };
    }

    if (type === 'assignment' || title.includes('🚀') || title.toLowerCase().includes('assigned') || title.toLowerCase().includes('zugewiesen')) {
      return {
        icon: <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />,
        badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800/80',
        tagText: t('notifications.taskAssigned'),
        tagColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60',
      };
    }

    return {
      icon: <BellRing size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />,
      badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      tagText: null,
      tagColor: '',
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        title={t('notifications.title')}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                >
                  <Check size={14} />
                  {t('notifications.markAllRead')}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                >
                  <Trash2 size={14} />
                  {t('notifications.clearAll')}
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1.5 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                  <Bell size={22} />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300">{t('notifications.allCaughtUp')}</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { icon, badgeBg, tagText, tagColor } = getNotificationDetails(notification);

                return (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      notification.isRead 
                        ? 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-80' 
                        : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 border-blue-100 dark:border-blue-900/40 shadow-xs'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs shrink-0 ${badgeBg}`}>
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className={`text-xs font-bold truncate ${notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                            {notification.title}
                          </p>
                          {tagText && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${tagColor}`}>
                              {tagText}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {notification.body}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {new Date(notification.createdAt).toLocaleString(language === 'de' ? 'de-DE' : undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          {!notification.isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-600 shadow-xs" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

