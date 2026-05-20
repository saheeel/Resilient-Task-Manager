import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { ShieldAlert, Lock, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const { setCurrentUser, users } = useTasks();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const matchedUser = users.find(u => u.username === username.trim() && u.password === password);

      if (matchedUser) {
        setCurrentUser(matchedUser);
      } else {
        setError(t('login.invalidCredentials'));
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('de')}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                language === 'de' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              DE
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/resilientlogo.svg" 
            alt="Resilient Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain" 
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t('app.workspace')}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {t('login.subtitle')}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm font-medium mb-6">
            <ShieldAlert size={18} className="text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('common.username')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                placeholder={t('login.usernamePlaceholder')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('common.password')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? t('login.authenticating') : t('login.signIn')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
