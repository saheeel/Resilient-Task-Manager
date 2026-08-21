import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const notifications = useQuery(api.notifications.get, { userId }) || [];
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

  const handleNotificationClick = async (notification: any) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                >
                  <Check size={14} />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer border-none bg-transparent p-0"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              )}
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                You're all caught up!
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    notification.isRead 
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-75' 
                      : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 border border-blue-100/50 dark:border-blue-800/30 shadow-sm'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notification.body}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        {new Date(notification.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 shadow-sm" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
