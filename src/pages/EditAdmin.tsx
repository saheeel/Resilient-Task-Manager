import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useTasks, isAdminRole } from '../contexts/TaskContext';

const EditAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser, updateAdminUser } = useTasks();

  const adminUser = users.find((user) => user.id === id && isAdminRole(user.role));

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!adminUser) return;
    setName(adminUser.name);
    setPassword(adminUser.password || '');
  }, [adminUser]);

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (currentUser.role !== 'superadmin') {
    return <Navigate to="/settings" replace />;
  }

  if (!adminUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 font-medium">Admin not found.</p>
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition-colors mt-6 cursor-pointer"
        >
          Back to Settings
        </button>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }

    setSaving(true);

    try {
      await updateAdminUser(adminUser.id, {
        name: name.trim(),
        password,
      });
      setSuccess('Admin details updated.');
      setPassword('');
      setTimeout(() => navigate('/settings'), 1200);
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to update admin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/settings')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit Admin</h1>
            <p className="text-xs text-slate-500">Update name and password for {adminUser.email}.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={adminUser.email || ''}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
              disabled
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="text"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer mt-4 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditAdmin;
