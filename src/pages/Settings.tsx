import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { Settings as SettingsIcon, UserPlus, Users, Edit, Eye, ShieldPlus, Moon, Sun } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, type ThemeMode } from '../contexts/ThemeContext';

const HIDDEN_USER_EMAILS = new Set([
  'saheel62320@gmail.com',
]);

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { users, currentUser } = useTasks();
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 border-b border-slate-150 pb-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <SettingsIcon size={20} />
            </div>
            <div className="max-w-sm">
              <h1 className="text-2xl font-bold leading-tight text-slate-900 tracking-tight sm:text-3xl">
                {t('app.systemSettings')}
              </h1>
              <p className="mt-2 text-base leading-8 text-slate-500">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          {isSuperAdmin ? (
            <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:justify-end">
              <button
                onClick={() => navigate('/add-admin')}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-slate-800 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer md:min-h-0 md:flex-row md:rounded-lg md:px-4 md:py-2.5 md:text-left"
              >
                <ShieldPlus size={18} />
                <span className="text-sm font-semibold">Add Admin</span>
              </button>
              <button 
                onClick={() => navigate('/add-employee')}
                className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-4 text-center text-slate-800 shadow-sm transition-colors hover:bg-slate-200 cursor-pointer md:min-h-0 md:flex-row md:rounded-lg md:px-4 md:py-2.5 md:text-left"
              >
                <UserPlus size={18} />
                <span className="text-sm font-semibold">{t('settings.addEmployee')}</span>
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <div className="mb-8 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-[140px] items-center gap-2">
            <Moon size={16} className="text-slate-700" />
            <p className="text-sm font-semibold text-slate-900">{t('settings.themeTitle')}</p>
          </div>
          <button
            type="button"
            onClick={cycleThemeMode}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
          >
            <ActiveThemeIcon size={14} />
            <span>{activeTheme.label}</span>
          </button>
        </div>
      </div>

      {/* Team Directory Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-slate-700" />
          <h2 className="font-bold text-slate-900 text-lg tracking-tight">{t('settings.teamDirectory')}</h2>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">{t('common.name')}</th>
                  <th className="px-6 py-3.5">{t('common.username')}</th>
                  {isSuperAdmin ? <th className="px-6 py-3.5">Password</th> : null}
                  <th className="px-6 py-3.5">{t('common.role')}</th>
                  <th className="px-6 py-3.5 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Render Managers First */}
                {admins.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        {(user.name || 'User').split(' ').map(n => n[0]).join('')}
                      </div>
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {user.email || 'admin'}
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                        {user.password || '—'}
                      </td>
                    ) : null}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        {user.role === 'superadmin' ? 'Super Admin' : roleLabel('admin')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isSuperAdmin || (currentUser && currentUser.id === user.id) ? (
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => navigate(`/settings/employee/${user.id}/history`)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title={t('settings.viewProfileHistory')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/settings/admin/${user.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                            title="Edit admin details"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
                
                {/* Render Employees */}
                {employees.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {(user.name || 'User').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {user.employeeRole && (
                          <span className="text-xs text-slate-400 font-normal mt-0.5">{user.employeeRole}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      <div className="flex flex-col items-start gap-1">
                        <span>{user.username || t('settings.notSet')}</span>
                        {user.email ? <span className="text-[11px] text-slate-400">{user.email}</span> : null}
                      </div>
                    </td>
                    {isSuperAdmin ? (
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">—</td>
                    ) : null}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                        {roleLabel('employee')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/settings/employee/${user.id}/history`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                          title={t('settings.viewProfileHistory')}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/settings/employee/${user.id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
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
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      {t('settings.noTeamMembersFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
