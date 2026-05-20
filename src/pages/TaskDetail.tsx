import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, CheckCircle, AlertTriangle, Camera, Calendar, Clock, AlertCircle, Paperclip, Edit, Trash2, Play, Eye, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, currentUser, deleteTask, users } = useTasks();
  const { t, formatDate, formatDateTime, formatTime, priorityLabel, taskTypeLabel } = useLanguage();
  
  const task = tasks.find(t => t.id === id);
  
  const [comment, setComment] = useState('');
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const isImageFile = (url: string) => {
    return url.startsWith('blob:') || url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  if (!currentUser) return null;

  const isAuthorized = task && (currentUser.role === 'manager' || task.assignedTo.includes(currentUser.id));

  if (!task || !isAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 font-medium">
          {!task ? t('taskDetail.taskNotFound') : t('taskDetail.noPermission')}
        </p>
        
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-5 py-2 text-sm font-semibold shadow-sm transition-colors mt-6 cursor-pointer"
        >
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  const formatTimeTaken = (start: string, end: string) => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    if (diffMs < 0) return '0 minutes';
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs} hr ${mins % 60} min`;
    }
    return `${mins} min`;
  };

  const handleStart = () => {
    updateTaskStatus(task.id, 'in_progress', {
      startedAt: new Date().toISOString()
    });
  };

  const handleComplete = () => {
    updateTaskStatus(task.id, 'completed', { 
      completedAt: new Date().toISOString(),
      completionComment: comment,
      proofPhotoUrl: photoUrl || undefined
    });
    navigate(-1);
  };

  const handleBlock = () => {
    if (!comment) {
      alert(t('taskDetail.provideReason'));
      return;
    }
    updateTaskStatus(task.id, 'could_not_complete', {
      blockReason: comment,
      markedIssueAt: new Date().toISOString()
    });
    navigate(-1);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header action bar */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        {currentUser.role === 'manager' && (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/task/${task.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Edit size={14} />
              {t('taskDetail.editTask')}
            </button>
            <button 
              onClick={() => {
                if (confirm(t('common.confirmDeleteTask'))) {
                  deleteTask(task.id);
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              {t('taskDetail.deleteTask')}
            </button>
          </div>
        )}
      </div>

      {/* Task Card */}
      <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center gap-4 mb-4">
          <StatusBadge status={task.status} />
          <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            {taskTypeLabel(task.type)}
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-4">{task.title}</h1>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
            <AlertCircle size={14} className="text-slate-400" />
            <span>{t('taskDetail.taskTypePriority', { priority: priorityLabel(task.priority) })}</span>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
              <Calendar size={14} className="text-slate-400" />
              {t('common.due')}: {formatDate(task.dueDate)}
              <Clock size={14} className="text-slate-400 ml-1" />
              {formatTime(task.dueDate)}
            </div>
          )}

          {task.createdAt && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200" title={t('taskDetail.assignedAt')}>
              <Clock size={14} className="text-slate-400" />
              {t('common.assigned')}: {formatDateTime(task.createdAt, { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>

        {/* Timeline & Assignments */}
        <div className="border-t border-slate-100 pt-4 mt-2 mb-6 space-y-3">
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('taskDetail.assignedTo')}:</span>
            <span className="font-medium text-slate-800">
              {task.assignedTo.length > 0 
                ? task.assignedTo.map(id => users.find(u => u.id === id)?.name).join(', ')
                : t('common.unassigned')}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600">
            <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('taskDetail.assignedAt')}:</span>
            <span className="font-medium text-slate-800">
              {task.createdAt 
                ? formatDateTime(task.createdAt, { dateStyle: 'short', timeStyle: 'short' })
                : t('common.notRecorded')}
            </span>
          </div>

          {task.assignedByName && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('common.assignedBy')}:</span>
              <span className="font-medium text-slate-800">{task.assignedByName}</span>
            </div>
          )}

          {task.status === 'could_not_complete' && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="font-semibold shrink-0 min-w-[100px]">{t('taskDetail.incompleteAt')}:</span>
              <div className="flex flex-col gap-1">
                <span className="font-bold">
                  {task.markedIssueAt 
                    ? formatDateTime(task.markedIssueAt, { dateStyle: 'short', timeStyle: 'short' })
                    : t('common.notRecorded')}
                </span>
                {task.blockReason && (
                  <span className="text-xs text-red-800 italic mt-0.5">
                    {t('common.reason')}: "{task.blockReason}"
                  </span>
                )}
              </div>
            </div>
          )}

          {task.startedAt && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('taskDetail.startedAt')}:</span>
              <span className="font-medium text-slate-800">
                {formatDateTime(task.startedAt, { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
          )}

          {task.status === 'completed' && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="font-semibold shrink-0 min-w-[100px]">{t('taskDetail.completedAt')}:</span>
              <div className="flex flex-col gap-1">
                <span className="font-bold">
                  {task.completedAt 
                    ? formatDateTime(task.completedAt, { dateStyle: 'short', timeStyle: 'short' })
                    : t('common.notRecorded')}
                </span>
                {task.startedAt && task.completedAt && (
                  <span className="text-xs text-green-800 font-medium mt-0.5">
                    {t('common.timeTaken')}: {formatTimeTaken(task.startedAt, task.completedAt)}
                  </span>
                )}
                {task.completionComment && (
                  <span className="text-xs text-green-800 italic mt-0.5">
                    {t('common.note')}: "{task.completionComment}"
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {task.description && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('common.description')}</h3>
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {task.remarks && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('common.remarks')}</h3>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-xl leading-relaxed">
              {task.remarks}
            </p>
          </div>
        )}

        {task.proofPhotoUrl && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('taskDetail.completionPhotoProof')}</h3>
            <div className="relative inline-block group cursor-zoom-in" onClick={() => setActiveZoomUrl(task.proofPhotoUrl || null)}>
              <img 
                src={task.proofPhotoUrl} 
                alt="Completion Proof" 
                className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                <Eye className="text-white" size={20} />
              </div>
            </div>
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('taskDetail.attachmentsReference')}</h3>
            <div className="flex flex-wrap gap-3">
              {task.attachments.map((url, idx) => {
                if (isImageFile(url)) {
                  return (
                    <div key={idx} className="relative group inline-block cursor-zoom-in" onClick={() => setActiveZoomUrl(url)}>
                      <img 
                        src={url} 
                        alt={`Attachment ${idx + 1}`} 
                        className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                        <Eye className="text-white" size={16} />
                      </div>
                    </div>
                  );
                }
                return (
                  <a 
                    key={idx} 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Paperclip size={16} />
                    {t('taskDetail.referenceFile', { index: idx + 1 })}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Completion Actions (Visible only for non-finalized tasks) */}
      {task.status !== 'completed' && task.status !== 'could_not_complete' && (
        <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">{t('taskDetail.completionActions')}</h3>
          
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              {t('taskDetail.addCommentOptional')}
            </label>
            <textarea 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              rows={3}
              placeholder={t('taskDetail.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={photoInputRef}
              onChange={handlePhotoChange}
            />
            {!photoUrl ? (
              <button 
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-semibold transition-colors cursor-pointer"
              >
                <Camera size={18} />
                {t('taskDetail.addCompletionPhoto')}
              </button>
            ) : (
              <div className="relative inline-block mt-1">
                <img 
                  src={photoUrl} 
                  alt="Proof Preview" 
                  className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm cursor-zoom-in"
                  onClick={() => setActiveZoomUrl(photoUrl)}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-colors border-none cursor-pointer"
                  title={t('taskDetail.removePhoto')}
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {!showBlockReason ? (
            <div className="flex flex-col gap-2">
              {task.status === 'open' ? (
                <button 
                  onClick={handleStart}
                  className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <Play size={18} className="fill-current" />
                  {t('taskDetail.startTask')}
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  className="inline-flex items-center justify-center gap-2 w-full bg-green-700 hover:bg-green-800 text-white rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle size={18} />
                  {t('taskDetail.markCompleted')}
                </button>
              )}
              
              <button 
                onClick={() => setShowBlockReason(true)}
                className="inline-flex items-center justify-center gap-2 w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg py-2.5 font-semibold text-sm transition-colors cursor-pointer"
              >
                <AlertTriangle size={18} />
                {t('taskDetail.cannotComplete')}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-red-700 font-semibold">{t('taskDetail.explainIssue')}</p>
              <button 
                onClick={handleBlock}
                className="inline-flex items-center justify-center w-full bg-red-700 hover:bg-red-800 text-white rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
              >
                {t('taskDetail.submitIssue')}
              </button>
              <button 
                onClick={() => setShowBlockReason(false)}
                className="inline-flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-2.5 font-semibold text-sm transition-colors cursor-pointer"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>
      )}
      {/* High-Fidelity Zoom Modal */}
      {activeZoomUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity cursor-zoom-out"
          onClick={() => setActiveZoomUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent rounded-lg overflow-hidden flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white bg-slate-900/50 hover:bg-slate-800/80 p-2 rounded-full transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActiveZoomUrl(null);
              }}
            >
              <X size={20} />
            </button>
            <img 
              src={activeZoomUrl} 
              alt="Zoomed Reference" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
