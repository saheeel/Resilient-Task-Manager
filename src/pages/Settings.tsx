import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { Settings as SettingsIcon, UserPlus, Users, Edit, Eye, ShieldPlus, Moon, Sun, Bell, BellOff, UserCheck } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm">
              <SettingsIcon size={20} />
            </div>
            <div className="max-w-sm">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 tracking-tight sm:text-3xl">
                {t('app.systemSettings')}
              </h1>
              <p className="mt-2 text-base leading-7 text-slate-500 dark:text-slate-400">
                Manage your profile, device notification preferences, and application theme.
              </p>
            </div>
          </div>

          {isAdminRole(currentUser?.role) ? (
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-end">
              {isSuperAdmin && (
                <button
                  onClick={() => navigate('/add-admin')}
                  className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 text-center text-slate-800 dark:text-slate-200 shadow-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer md:min-h-0 md:flex-row md:rounded-lg md:px-4 md:py-2.5 md:text-left"
                >
                  <ShieldPlus size={18} />
                  <span className="text-sm font-semibold">Add Admin</span>
                </button>
              )}
              <button 
                onClick={() => navigate('/add-employee')}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-4 text-center text-slate-800 dark:text-slate-200 shadow-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer md:min-h-0 md:flex-row md:rounded-lg md:px-4 md:py-2.5 md:text-left"
              >
                <UserPlus size={18} />
                <span className="text-sm font-semibold">{t('settings.addEmployee')}</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {/* User Profile Overview Card */}
      {currentUser && (
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 flex items-center justify-center text-lg font-black border border-indigo-200 dark:border-indigo-800 shrink-0">
                {(currentUser.name || 'User').split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                    {roleLabel(currentUser.role)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Username: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.username || currentUser.email || 'user'}</span>
                </p>
                {isEmployee && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 text-[11px] font-semibold text-cyan-800 dark:text-cyan-200">
                    <UserCheck size={13} className="text-cyan-600 dark:text-cyan-400" />
                    <span>Self-Assignment Enabled (You can assign tasks to yourself)</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate(`/settings/employee/${currentUser.id}/history`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Eye size={15} />
              <span>View My Work History</span>
            </button>
          </div>
        </div>
      )}

      {/* Device Notification Control Switch - Visible for ALL Users */}
      <div className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/70 dark:bg-slate-900 px-5 py-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationsActive ? 'bg-indigo-600 text-white' : 'bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {notificationsActive ? <Bell size={18} /> : <BellOff size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Device Push Notifications {currentUser?.name?.toLowerCase().includes('diana') ? "(Diana's Device Mute)" : ''}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Turn ON or mute task alerts on <strong>this specific device</strong> without affecting other team members.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDeviceNotifications}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer border ${
              notificationsActive
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm hover:bg-emerald-700'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {notificationsActive ? 'Device Alerts: ON' : 'Device Alerts: MUTED'}
          </button>
        </div>
      </div>

      {/* Theme Preference Switch */}
      <div className="mb-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[140px] items-center gap-2">
            <Moon size={18} className="text-slate-700 dark:text-slate-300" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings.themeTitle')}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Switch between Light mode and Dark mode</p>
            </div>
          </div>
          <button
            type="button"
            onClick={cycleThemeMode}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            <ActiveThemeIcon size={14} />
            <span>{activeTheme.label}</span>
          </button>
        </div>
      </div>

      {/* Team Directory Section (Admin / SuperAdmin) */}
      {isAdminRole(currentUser?.role) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-slate-700 dark:text-slate-300" />
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">{t('settings.teamDirectory')}</h2>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">{t('common.name')}</th>
                    <th className="px-6 py-3.5">{t('common.username')}</th>
                    {isSuperAdmin ? <th className="px-6 py-3.5">Password</th> : null}
                    <th className="px-6 py-3.5">{t('common.role')}</th>
                    <th className="px-6 py-3.5 text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {/* Render Managers First */}
                  {admins.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                          {(user.name || 'User').split(' ').map(n => n[0]).join('')}
                        </div>
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        {user.email || 'admin'}
                      </td>
                      {isSuperAdmin ? (
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {user.password || '—'}
                        </td>
                      ) : null}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                          {user.role === 'superadmin' ? 'Super Admin' : roleLabel('admin')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => navigate(`/settings/employee/${user.id}/history`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('settings.viewProfileHistory')}
                          >
                            <Eye size={16} />
                          </button>
                          {isSuperAdmin || (currentUser && currentUser.id === user.id) ? (
                            <button
                              onClick={() => navigate(`/settings/admin/${user.id}/edit`)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                              title="Edit admin details"
                            >
                              <Edit size={16} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Render Employees */}
                  {employees.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {(user.name || 'User').split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          {user.employeeRole && (
                            <span className="text-xs text-slate-400 font-normal mt-0.5">{user.employeeRole}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                        <div className="flex flex-col items-start gap-1">
                          <span>{user.username || t('settings.notSet')}</span>
                          {user.email ? <span className="text-[11px] text-slate-400">{user.email}</span> : null}
                        </div>
                      </td>
                      {isSuperAdmin ? (
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">—</td>
                      ) : null}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                          {roleLabel('employee')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => navigate(`/settings/employee/${user.id}/history`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('settings.viewProfileHistory')}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => navigate(`/settings/employee/${user.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('settings.editEmployeeDetails')}
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {employees.length === 0 && admins.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        {t('settings.noTeamMembersFound')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
