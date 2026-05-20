import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { Settings as SettingsIcon, UserPlus, Users, Edit, Eye } from 'lucide-react';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { users } = useTasks();

  const employees = users.filter(u => u.role === 'employee');
  const managers = users.filter(u => u.role === 'manager');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center border-b border-slate-150 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your team and operational preferences.</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/add-employee')}
          className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer border border-slate-200"
        >
          <UserPlus size={18} />
          Add Employee
        </button>
      </header>

      {/* Team Directory Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-slate-700" />
          <h2 className="font-bold text-slate-900 text-lg tracking-tight">Team Directory</h2>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Username</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Render Managers First */}
                {managers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {user.username || 'admin'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                        Manager
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Empty for Manager */}
                    </td>
                  </tr>
                ))}
                
                {/* Render Employees */}
                {employees.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        {user.employeeRole && (
                          <span className="text-xs text-slate-400 font-normal mt-0.5">{user.employeeRole}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {user.username || 'Not set'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                        Employee
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => navigate(`/settings/employee/${user.id}/history`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                          title="View Profile & Work History"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => navigate(`/settings/employee/${user.id}/edit`)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors border-none bg-transparent cursor-pointer"
                          title="Edit Employee Details"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {employees.length === 0 && managers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      No team members found.
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
