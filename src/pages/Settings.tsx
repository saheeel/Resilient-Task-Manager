import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { UserPlus, Users, Edit, Eye, ShieldPlus, Moon, Sun, Bell, BellOff, UserCheck, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

const HIDDEN_USER_EMAILS = new Set([
  'saheel62320@gmail.com',
]);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { users, currentUser, deviceNotificationsMuted, toggleDeviceNotifications } = useTasks();
  const { t, roleLabel } = useLanguage();
  const { themeMode, setThemeMode } = useTheme();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const visibleUsers = users.filter(
    (user) => !user.email || !HIDDEN_USER_EMAILS.has(user.email.trim().toLowerCase())
  );
  const employees = visibleUsers.filter(u => u.role === 'employee');
  const admins = visibleUsers.filter(u => isAdminRole(u.role));
  
  const themeOptions: Array<{ value: ThemeMode; label: string; icon: typeof Sun }> = [
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
  ];
  
  const activeTheme = themeOptions.find((option) => option.value === themeMode) ?? themeOptions[0];
  const ActiveThemeIcon = activeTheme.icon;

  const cycleThemeMode = () => {
    const currentIndex = themeOptions.findIndex((option) => option.value === themeMode);
    const nextOption = themeOptions[(currentIndex + 1) % themeOptions.length];
    setThemeMode(nextOption.value);
  };

  const notificationsActive = !deviceNotificationsMuted;
  const isEmployee = currentUser?.role === 'employee';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="px-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('app.systemSettings')}
        </h1>
      </header>

      {/* Profile Section */}
      {currentUser && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            My Profile
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg font-black border border-indigo-100 dark:border-indigo-500/20 shrink-0 shadow-inner">
                {(currentUser.name || 'User').split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {roleLabel(currentUser.role)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentUser.username || currentUser.email || 'user'}
                </p>
                {isEmployee && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-900/20 text-[10px] font-semibold text-cyan-700 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800/50">
                    <UserCheck size={12} />
                    <span>{t('settings.selfAssignmentEnabled')}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate(`/settings/employee/${currentUser.id}/history`)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Eye size={15} />
              <span>View History</span>
            </button>
          </div>
        </section>
      )}

      {/* Preferences Section */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
          Preferences
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          
          {/* Notifications */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                notificationsActive 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}>
                {notificationsActive ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {t('settings.devicePushTitle')} {currentUser?.name?.toLowerCase().includes('diana') ? t('settings.devicePushDiana') : ''}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDeviceNotifications}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                notificationsActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              <span className="sr-only">Toggle notifications</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  notificationsActive ? 'translate-x-2.5' : '-translate-x-2.5'
                }`}
              />
            </button>
          </div>

          {/* Theme */}
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/80 p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
            onClick={cycleThemeMode}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <ActiveThemeIcon size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {t('settings.themeTitle')}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Currently: <span className="font-medium text-slate-700 dark:text-slate-300">{activeTheme.label}</span>
                </p>
              </div>
            </div>
            <div className="text-slate-400 shrink-0">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </section>

      {/* Administration Section */}
      {isAdminRole(currentUser?.role) && (
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-1">
            Administration
          </h2>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {isSuperAdmin && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/add-admin')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                  <ShieldPlus size={18} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Add Admin</span>
              </div>
            )}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/add-employee')}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/50 transition-all cursor-pointer group ${!isSuperAdmin ? 'col-span-2' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <UserPlus size={18} />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('settings.addEmployee')}</span>
            </div>
          </div>

          <div className="mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t('settings.teamDirectory')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                  <tr>
                    <th className="px-5 py-3 font-medium">{t('common.name')}</th>
                    <th className="px-5 py-3 font-medium">{t('common.username')}</th>
                    {isSuperAdmin ? <th className="px-5 py-3 font-medium">Password</th> : null}
                    <th className="px-5 py-3 font-medium text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                  {/* Admins */}
                  {admins.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(user.name || 'U').split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">
                            {user.role === 'superadmin' ? 'Super Admin' : roleLabel('admin')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{user.email || '—'}</td>
                      {isSuperAdmin && <td className="px-5 py-3.5 text-slate-400 text-xs font-mono">{user.password || '—'}</td>}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => navigate(`/settings/employee/${user.id}/history`)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                            <Eye size={15} />
                          </button>
                          {(isSuperAdmin || currentUser?.id === user.id) && (
                            <button onClick={() => navigate(`/settings/admin/${user.id}/edit`)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                              <Edit size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Employees */}
                  {employees.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(user.name || 'U').split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                            {user.employeeRole || roleLabel('employee')}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        <div className="flex flex-col">
                          <span>{user.username || '—'}</span>
                          {user.email && <span className="text-[10px] text-slate-400">{user.email}</span>}
                        </div>
                      </td>
                      {isSuperAdmin && <td className="px-5 py-3.5 text-slate-400 text-xs">—</td>}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => navigate(`/settings/employee/${user.id}/history`)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => navigate(`/settings/employee/${user.id}/edit`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                            <Edit size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {employees.length === 0 && admins.length === 0 && (
                    <tr>
                      <td colSpan={isSuperAdmin ? 4 : 3} className="px-5 py-8 text-center text-slate-500 text-xs">
                        {t('settings.noTeamMembersFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Settings;
