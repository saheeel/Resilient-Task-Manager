import React, { useState } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { ShieldAlert, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const { setCurrentUser, users } = useTasks();
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
        setError('Invalid username or password.');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/resilientlogo.svg" 
            alt="Resilient Logo" 
            className="w-16 h-16 mx-auto mb-4 object-contain" 
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Resilient Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Please enter your credentials to access your dashboard.
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
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                placeholder="Enter admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                placeholder="Enter password"
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
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
