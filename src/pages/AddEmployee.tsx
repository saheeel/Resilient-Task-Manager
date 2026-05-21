import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { addUser, currentUser } = useTasks();
  const { t } = useLanguage();
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== 'superadmin') {
    return <Navigate to="/settings" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      alert(t('addEmployee.fillAllFields'));
      return;
    }
    
    addUser(name, 'employee', username, password, employeeRole || undefined);
    setSuccessMsg(t('addEmployee.success', { name }));
    
    // Clear form
    setName('');
    setUsername('');
    setPassword('');
    setEmployeeRole('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate('/')} 
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={16} />
        {t('addEmployee.backToDashboard')}
      </button>

      {/* Form Card */}
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <UserPlus size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('addEmployee.title')}</h1>
            <p className="text-xs text-slate-500">{t('addEmployee.subtitle')}</p>
          </div>
        </div>
        
        {successMsg && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('addEmployee.fullName')} *
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder={t('addEmployee.fullNamePlaceholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('common.username')} *
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder={t('addEmployee.usernamePlaceholder')}
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('common.password')} *
            </label>
            <input 
              type="password" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder={t('addEmployee.securePasswordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('addEmployee.employeeRoleTitle')} ({t('common.optional')})
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              placeholder={t('addEmployee.employeeRolePlaceholder')}
              value={employeeRole}
              onChange={e => setEmployeeRole(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer mt-4"
          >
            {t('addEmployee.registerEmployee')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
