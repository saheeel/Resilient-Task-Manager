import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, CheckCircle, AlertTriangle, Camera, Calendar, Clock, AlertCircle, Paperclip, Edit, Trash2, Play, Eye, X, PauseCircle, PlayCircle, Square, MessageSquare, Image, PackageCheck, UserRoundCog, ImageOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { materialStatusToneMap } from '../lib/taskOptions';
import { readFileAsDataUrl } from '../lib/fileDataUrl';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, currentUser, deleteTask, users, editTask, addTaskUpdate } = useTasks();
  const { t, formatDate, formatDateTime, formatTime, priorityLabel, taskTypeLabel, weekdayLabel, monthDayOrdinalLabel, roleLabel } = useLanguage();
  
  const task = tasks.find(t => t.id === id);
  
  const [comment, setComment] = useState('');
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const updates = useQuery(api.taskUpdates.list, { taskId: task?.id || "" }) || [];
  const [updateText, setUpdateText] = useState('');
  const [updatePhotoUrl, setUpdatePhotoUrl] = useState<string | null>(null);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const updatePhotoInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdatePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUpdatePhotoUrl(await readFileAsDataUrl(file));
    }
  };

  const handleRemoveUpdatePhoto = () => {
    setUpdatePhotoUrl(null);
  };

  const isImageFile = (url: string) => {
    return url.startsWith('blob:') || url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPhotoUrl(await readFileAsDataUrl(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(null);
  };

  const isLegacyUnavailableImage = (url: string) => url.startsWith('blob:');
  const isRenderableSavedImage = (url: string) => !isLegacyUnavailableImage(url) && !brokenImages[url];
  const markImageBroken = (url: string) => {
    setBrokenImages((current) => (current[url] ? current : { ...current, [url]: true }));
  };

  if (!currentUser) return null;

  const isAuthorized = task && (isAdminRole(currentUser.role) || task.assignedTo.includes(currentUser.id));

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

  const handleReopen = () => {
    updateTaskStatus(task.id, 'open', {
      blockReason: undefined,
      markedIssueAt: undefined,
      completionComment: undefined,
      completedAt: undefined,
      proofPhotoUrl: undefined,
      startedAt: undefined,
    });
    navigate(-1);
  };

  const recurringScheduleLabel = () => {
    if (task.type === 'daily') {
      return task.recurringTime ? `${t('manageTasks.everyDayAt')} ${formatTime(`1970-01-01T${task.recurringTime}:00`)}` : t('manageTasks.everyDay');
    }
    if (task.type === 'weekly') {
      const days = task.recurringDay
        ? task.recurringDay.split(',').map((day) => weekdayLabel(day.trim())).join(', ')
        : t('manageTasks.noScheduleSet');
      return task.recurringTime ? `${days} • ${formatTime(`1970-01-01T${task.recurringTime}:00`)}` : days;
    }
    if (task.type === 'monthly') {
      const day = task.recurringDay ? monthDayOrdinalLabel(task.recurringDay) : t('manageTasks.noScheduleSet');
      return task.recurringTime ? `${day} • ${formatTime(`1970-01-01T${task.recurringTime}:00`)}` : day;
    }
    return '';
  };

  const toggleRecurringPause = () => {
    editTask(task.id, {
      isPaused: !task.isPaused,
      pausedAt: task.isPaused ? undefined : new Date().toISOString(),
    });
  };

  const handleStopRecurring = () => {
    editTask(task.id, {
      type: 'one-time',
      recurringDay: undefined,
      recurringTime: undefined,
      isPaused: false,
      pausedAt: undefined,
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer bg-transparent border-none p-0 self-start"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        {isAdminRole(currentUser.role) && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {(task.status === 'could_not_complete' || task.status === 'blocked') && (
              <button
                onClick={handleReopen}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
              >
                <CheckCircle size={14} />
                {t('taskDetail.reopenTask')}
              </button>
            )}
            <button 
              onClick={() => navigate(`/task/${task.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Edit size={14} />
              {t('taskDetail.editTask')}
            </button>
            {task.type !== 'one-time' && (
              <>
                <button
                  onClick={toggleRecurringPause}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center ${
                    task.isPaused
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                  }`}
                >
                  {task.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                  {task.isPaused ? t('manageTasks.resumeRecurring') : t('manageTasks.pauseRecurring')}
                </button>
                <button
                  onClick={handleStopRecurring}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
                >
                  <Square size={14} />
                  {t('manageTasks.stopRecurring')}
                </button>
              </>
            )}
            <button 
              onClick={() => {
                if (confirm(t('common.confirmDeleteTask'))) {
                  deleteTask(task.id);
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center"
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
          {task.type !== 'one-time' ? (
            <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
              {taskTypeLabel(task.type)}
            </span>
          ) : (
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              {taskTypeLabel(task.type)}
            </span>
          )}
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

          {task.type !== 'one-time' && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded border border-indigo-200">
              <Play size={14} className="text-indigo-500" />
              {recurringScheduleLabel()}
            </div>
          )}

          {task.type !== 'one-time' && task.isPaused && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
              <PauseCircle size={14} className="text-amber-500" />
              {t('manageTasks.paused')}
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

          {task.inCharge && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('taskDetail.inCharge')}:</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <UserRoundCog size={14} />
                {task.inCharge}
              </span>
            </div>
          )}

          {task.materialStatus && (
            <div className="flex items-start gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900 shrink-0 min-w-[100px]">{t('taskDetail.materialStatus')}:</span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${materialStatusToneMap[task.materialStatus].badge}`}>
                <PackageCheck size={14} />
                {t(`materials.${task.materialStatus}`)}
              </span>
            </div>
          )}

          {(task.status === 'could_not_complete' || task.status === 'blocked') && (
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
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('common.comments')}</h3>
            <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-xl leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {task.remarks && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('common.instructions')}</h3>
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-xl leading-relaxed">
              {task.remarks}
            </p>
          </div>
        )}

        {task.proofPhotoUrl && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('taskDetail.completionPhotoProof')}</h3>
            {isRenderableSavedImage(task.proofPhotoUrl) ? (
              <div className="relative inline-block group cursor-zoom-in" onClick={() => setActiveZoomUrl(task.proofPhotoUrl || null)}>
                <img 
                  src={task.proofPhotoUrl} 
                  alt="Completion Proof" 
                  className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
                  onError={() => markImageBroken(task.proofPhotoUrl!)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                  <Eye className="text-white" size={20} />
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <ImageOff size={14} className="shrink-0" />
                <span>{t('taskDetail.legacyImageUnavailable')}</span>
              </div>
            )}
          </div>
        )}

        {task.attachments && task.attachments.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('taskDetail.attachmentsReference')}</h3>
            <div className="flex flex-wrap gap-3">
              {task.attachments.map((url, idx) => {
                if (isImageFile(url)) {
                  if (isRenderableSavedImage(url)) {
                    return (
                      <div key={idx} className="relative group inline-block cursor-zoom-in" onClick={() => setActiveZoomUrl(url)}>
                        <img 
                          src={url} 
                          alt={`Attachment ${idx + 1}`} 
                          className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
                          onError={() => markImageBroken(url)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                          <Eye className="text-white" size={16} />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className="flex h-24 w-24 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-2 text-center text-[11px] font-medium text-amber-800"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ImageOff size={16} />
                        <span>{t('taskDetail.legacyImageShort')}</span>
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

      {/* Progress Updates & Communication Thread */}
      <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
        <header className="mb-4 pb-3 border-b border-slate-200/80 flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{t('taskDetail.updatesTitle')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('taskDetail.updatesSubtitle')}</p>
          </div>
        </header>

        {/* Updates Thread List */}
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 mb-4 flex flex-col">
          {updates.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 font-medium bg-white rounded-lg border border-slate-150 shadow-inner">
              {t('taskDetail.noUpdates')}
            </p>
          ) : (
            updates.map((up: any) => {
              const isSelf = up.userId === currentUser.id;
              const sender = users.find(u => u.id === up.userId);
              const senderRoleLabel = sender ? roleLabel(sender.role) : '';
              
              return (
                <div 
                  key={up._id}
                  className={`flex flex-col gap-1 max-w-[85%] rounded-2xl p-3.5 shadow-xs border ${
                    isSelf 
                      ? 'bg-slate-100 border-slate-200 self-end rounded-tr-none' 
                      : 'bg-white border-slate-150 self-start rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px]">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      {up.userName}
                      {senderRoleLabel && (
                        <span className={`px-1 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide border ${
                          isAdminRole(sender?.role) 
                            ? 'bg-red-50 text-red-700 border-red-150' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                        }`}>
                          {senderRoleLabel}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-400 font-medium">{formatDateTime(up.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">{up.text}</p>
                  
                  {up.photoUrl && (
                    isRenderableSavedImage(up.photoUrl) ? (
                      <div className="relative inline-block mt-2 group cursor-zoom-in self-start" onClick={() => setActiveZoomUrl(up.photoUrl)}>
                        <img 
                          src={up.photoUrl} 
                          alt="Progress Proof" 
                          className="max-h-36 max-w-full object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
                          onError={() => markImageBroken(up.photoUrl)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                          <Eye className="text-white" size={16} />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                        <ImageOff size={14} className="shrink-0" />
                        <span>{t('taskDetail.legacyImageUnavailable')}</span>
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Post Update Form */}
        {task.status === 'in_progress' || isAdminRole(currentUser.role) ? (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!updateText.trim()) return;
              setIsPostingUpdate(true);
              try {
                await addTaskUpdate(task.id, updateText, updatePhotoUrl || undefined);
                setUpdateText('');
                setUpdatePhotoUrl(null);
              } catch (err) {
                console.error("Failed to add progress update:", err);
              } finally {
                setIsPostingUpdate(false);
              }
            }}
            className="border-t border-slate-200/80 pt-4"
          >
            <div className="flex flex-col gap-2">
              <textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder={t('taskDetail.updatePlaceholder')}
                disabled={isPostingUpdate}
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50 disabled:text-slate-400"
              />
              
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={updatePhotoInputRef}
                    onChange={handleUpdatePhotoChange}
                    disabled={isPostingUpdate}
                  />
                  
                  {!updatePhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => updatePhotoInputRef.current?.click()}
                      disabled={isPostingUpdate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Image size={13} className="text-slate-400" />
                      {t('taskDetail.updatePhoto')}
                    </button>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={updatePhotoUrl}
                        alt="Update attachment preview"
                        className="w-10 h-10 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in"
                        onClick={() => setActiveZoomUrl(updatePhotoUrl)}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveUpdatePhoto}
                        disabled={isPostingUpdate}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow border-none cursor-pointer"
                        title={t('taskDetail.removePhoto')}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPostingUpdate || !updateText.trim()}
                  className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isPostingUpdate ? t('taskDetail.posting') : t('taskDetail.sendUpdate')}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-3 text-slate-500 text-xs font-medium shadow-sm">
            <AlertCircle size={15} className="text-slate-400 shrink-0" />
            <span>{t('taskDetail.onlyInProgress')}</span>
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
