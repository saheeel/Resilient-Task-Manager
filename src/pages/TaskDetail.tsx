import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTasks, isAdminRole, type Task } from '../contexts/TaskContext';
import StatusBadge from '../components/StatusBadge';
import { TaskListSkeleton } from '../components/TaskSkeleton';
import { ArrowLeft, CheckCircle, AlertTriangle, Camera, Calendar, Clock, AlertCircle, Paperclip, Edit, Trash2, Play, Eye, X, PauseCircle, PlayCircle, Square, MessageSquare, Image, PackageCheck, UserRoundCog, ImageOff, ArrowRightLeft, Upload, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { materialStatusToneMap } from '../lib/taskOptions';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, updateTaskStatus, currentUser, deleteTask, users, editTask, addTaskUpdate, sendPushNotification, uploadFile } = useTasks();
  const { t, formatDate, formatDateTime, formatTime, priorityLabel, taskTypeLabel, weekdayLabel, monthDayOrdinalLabel, roleLabel } = useLanguage();
  
  const isValidId = Boolean(id && id !== 'undefined' && id !== 'null' && id.trim() !== '');
  const localTask = isValidId ? tasks.find(t => t.id === id) : undefined;
  const fetchedTaskRaw = useQuery(api.tasks.getById, isValidId && !localTask ? { id: id! } : "skip");
  const isFetchingTask = isValidId && !localTask && fetchedTaskRaw === undefined;

  const fetchedTask: Task | undefined = fetchedTaskRaw ? ({ ...fetchedTaskRaw, id: fetchedTaskRaw._id } as unknown as Task) : undefined;
  const task = localTask || fetchedTask;
  
  const [comment, setComment] = useState('');
  const [showBlockReason, setShowBlockReason] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState<{ storageId: string; previewUrl: string }[]>([]);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferToId, setTransferToId] = useState('');
  const [transferComment, setTransferComment] = useState('');

  const updates = useQuery(api.taskUpdates.list, task?.id ? { taskId: task.id } : "skip") || [];
  const [updateText, setUpdateText] = useState('');
  const [updatePhotoStorageId, setUpdatePhotoStorageId] = useState<string | null>(null);
  const [updatePhotoPreviewUrl, setUpdatePhotoPreviewUrl] = useState<string | null>(null);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const updatePhotoInputRef = React.useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'compressing' | 'preparing' | 'uploading' | 'done'>('uploading');
  const [uploadFileName, setUploadFileName] = useState('');

  useEffect(() => {
    if (!isUploading) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isUploading]);

  const handleUpdatePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const localPreview = URL.createObjectURL(file);
      setUpdatePhotoPreviewUrl(localPreview);
      setIsUploading(true);
      setUploadProgress(5);
      setUploadStage('compressing');
      setUploadFileName(file.name);
      try {
        const storageId = await uploadFile(file, (percent, stage) => {
          setUploadProgress(percent);
          setUploadStage(stage as any);
        });
        setUpdatePhotoStorageId(storageId);
      } catch (error) {
        console.error('Failed to prepare update photo:', error);
        alert(error instanceof Error ? error.message : 'Unable to prepare this image. Please choose a smaller photo.');
        setUpdatePhotoPreviewUrl(null);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveUpdatePhoto = () => {
    setUpdatePhotoStorageId(null);
    setUpdatePhotoPreviewUrl(null);
  };

  const isImageFile = (url: string) => {
    if (!url) return false;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return true;
    return /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(url);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setIsUploading(true);
      const newItems: { storageId: string; previewUrl: string }[] = [];
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const localPreview = URL.createObjectURL(file);
          setUploadFileName(files.length > 1 ? `${file.name} (${i + 1}/${files.length})` : file.name);
          setUploadProgress(5);
          setUploadStage('compressing');
          const storageId = await uploadFile(file, (percent, stage) => {
            setUploadProgress(percent);
            setUploadStage(stage as any);
          });
          newItems.push({ storageId, previewUrl: localPreview });
        }
        if (newItems.length > 0) {
          setCompletionPhotos(prev => [...prev, ...newItems]);
        }
      } catch (error) {
        console.error('Failed to prepare completion photo:', error);
        alert(error instanceof Error ? error.message : 'Unable to prepare this image. Please choose a smaller photo.');
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setCompletionPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const isLegacyUnavailableImage = (url: string) => url.startsWith('blob:');
  const isRenderableSavedImage = (url: string) => !isLegacyUnavailableImage(url) && !brokenImages[url];
  const markImageBroken = (url: string) => {
    setBrokenImages((current) => (current[url] ? current : { ...current, [url]: true }));
  };

  useEffect(() => {
    if (!activeZoomUrl) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const scrollY = window.scrollY;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.left = previousBodyLeft;
      document.body.style.right = previousBodyRight;
      window.scrollTo(0, scrollY);
    };
  }, [activeZoomUrl]);

  if (!currentUser) return null;

  if (isFetchingTask) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <TaskListSkeleton count={2} />
      </div>
    );
  }

  const isAuthorized = task && (isAdminRole(currentUser.role) || task.assignedTo.includes(currentUser.id));

  if (!task) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-600 font-medium">
          {t('taskDetail.taskNotFound')}
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

  const notifyAssigneesAndAssigner = async (title: string, body: string) => {
    if (!task) return;
    const userIdsToNotify = new Set(task.assignedTo);
    if (task.assignedById) {
      userIdsToNotify.add(task.assignedById);
    }
    
    for (const userId of Array.from(userIdsToNotify)) {
      if (currentUser && userId === currentUser.id) continue;
      await sendPushNotification({
        userId,
        title,
        body,
        url: `/task/${task.id}`
      }).catch(err => console.error("Failed to send push notification:", err));
    }
  };

  const handleStart = () => {
    updateTaskStatus(task.id, 'in_progress', {
      startedAt: new Date().toISOString()
    });
    addTaskUpdate(task.id, `${currentUser.name} started the task.`);
  };

  const handleComplete = () => {
    updateTaskStatus(task.id, 'completed', { 
      completedAt: new Date().toISOString(),
      completionComment: comment,
      proofPhotoUrls: completionPhotos.length > 0 ? completionPhotos.map(p => p.storageId) : undefined
    });
    addTaskUpdate(task.id, `${currentUser.name} completed the task.`);
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
    addTaskUpdate(task.id, `${currentUser.name} marked the task as an issue.`);
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

  const handleTransferRequest = () => {
    if (!transferToId) return;
    editTask(task.id, {
      pendingTransferTo: transferToId,
      pendingTransferFrom: currentUser.id,
      pendingTransferComment: transferComment || "",
    });
    
    sendPushNotification({
      userId: transferToId,
      title: "Task Transfer Request",
      body: `${currentUser.name} has requested to transfer a task to you: ${task.title}`,
      url: "/"
    }).catch(err => console.error("Failed to send transfer push notification", err));

    setShowTransfer(false);
    setTransferToId('');
    setTransferComment('');
  };

  const handleTransferCancel = () => {
    editTask(task.id, {
      pendingTransferTo: "",
      pendingTransferFrom: "",
      pendingTransferComment: "",
    });
  };

  const handleTransferAccept = () => {
    const newAssignedTo = task.assignedTo.filter(id => id !== task.pendingTransferFrom);
    if (!newAssignedTo.includes(currentUser.id)) {
      newAssignedTo.push(currentUser.id);
    }
    editTask(task.id, {
      assignedTo: newAssignedTo,
      pendingTransferTo: undefined,
      pendingTransferFrom: undefined,
      pendingTransferComment: undefined,
    });
  };

  const handleTransferDecline = () => {
    editTask(task.id, {
      pendingTransferTo: undefined,
      pendingTransferFrom: undefined,
      pendingTransferComment: undefined,
    });
  };

  const otherUsers = users.filter(u => u.id !== currentUser.id && !task.assignedTo.includes(u.id) && u.name.toLowerCase() !== 'saheel');

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <button 
          onClick={() => !isUploading && navigate(-1)} 
          disabled={isUploading}
          className={`inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer bg-transparent border-none p-0 self-start ${isUploading ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {isAdminRole(currentUser.role) && (
            <>
              {(task.status === 'could_not_complete' || task.status === 'blocked') && (
                <button
                  onClick={handleReopen}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={14} />
                  {t('taskDetail.reopenTask')}
                </button>
              )}
              <button 
                onClick={() => !isUploading && navigate(`/task/${task.id}/edit`)}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit size={14} />
                {t('taskDetail.editTask')}
              </button>
              {task.type !== 'one-time' && (
                <>
                  <button
                    onClick={toggleRecurringPause}
                    disabled={isUploading}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed ${
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
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Square size={14} />
                    {t('manageTasks.stopRecurring')}
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  if (isUploading) return;
                  if (confirm(t('common.confirmDeleteTask'))) {
                    deleteTask(task.id);
                    navigate('/');
                  }
                }}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
                {t('taskDetail.deleteTask')}
              </button>
            </>
          )}

          {/* Transfer Task Button for assigned users */}
          {task.assignedTo.includes(currentUser.id) && !task.pendingTransferTo && task.status !== 'completed' && (
            <button 
              onClick={() => setShowTransfer(!showTransfer)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex-1 sm:flex-initial justify-center ${showTransfer ? 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100' : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'}`}
            >
              <ArrowRightLeft size={14} />
              Transfer Task
            </button>
          )}
        </div>
      </div>

      {/* Transfer UI block */}
      {showTransfer && (
        <div className="bg-white p-5 border border-indigo-200 rounded-xl shadow-sm mb-6 bg-indigo-50/30">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Transfer Task to Employee</h3>
          <div className="space-y-3">
            <select
              value={transferToId}
              onChange={(e) => setTransferToId(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('taskDetail.selectColleague')}</option>
              {otherUsers.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <textarea
              value={transferComment}
              onChange={(e) => setTransferComment(e.target.value)}
              placeholder="Optional comment to the recipient..."
              rows={2}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowTransfer(false)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleTransferRequest} disabled={!transferToId} className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:text-white/70 rounded-lg shadow-sm transition-colors cursor-pointer">Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Transfer Banners */}
      {task.pendingTransferTo && task.pendingTransferFrom === currentUser.id && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-amber-800 font-medium">You requested to transfer this task to <span className="font-bold">{users.find(u => u.id === task.pendingTransferTo)?.name}</span>.</div>
          <button onClick={handleTransferCancel} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Cancel Request</button>
        </div>
      )}

      {task.pendingTransferTo === currentUser.id && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
            <div className="text-sm text-indigo-900 font-medium"><span className="font-bold">{users.find(u => u.id === task.pendingTransferFrom)?.name}</span> wants to transfer this task to you.</div>
            <div className="flex gap-2">
              <button onClick={handleTransferDecline} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Decline</button>
              <button onClick={handleTransferAccept} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-sm">Accept Task</button>
            </div>
          </div>
          {task.pendingTransferComment && <div className="text-xs text-indigo-800 italic bg-white/50 px-3 py-2 rounded border border-indigo-100">"{task.pendingTransferComment}"</div>}
        </div>
      )}

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
            <div className="flex items-start gap-2 text-sm text-red-950 dark:text-red-100 bg-red-50/90 dark:bg-red-950/50 border border-red-200/90 dark:border-red-800/80 rounded-lg p-3">
              <span className="font-semibold text-red-950 dark:text-red-200 shrink-0 min-w-[100px]">{t('taskDetail.incompleteAt')}:</span>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-red-950 dark:text-red-100">
                  {task.markedIssueAt 
                    ? formatDateTime(task.markedIssueAt, { dateStyle: 'short', timeStyle: 'short' })
                    : t('common.notRecorded')}
                </span>
                {task.blockReason && (
                  <span className="text-xs text-red-900 dark:text-red-200 italic mt-0.5">
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
            <div className="flex items-start gap-2 text-sm text-emerald-950 dark:text-emerald-100 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/90 dark:border-emerald-800/80 rounded-lg p-3">
              <span className="font-semibold text-emerald-950 dark:text-emerald-200 shrink-0 min-w-[100px]">{t('taskDetail.completedAt')}:</span>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-emerald-950 dark:text-emerald-100">
                  {task.completedAt 
                    ? formatDateTime(task.completedAt, { dateStyle: 'short', timeStyle: 'short' })
                    : t('common.notRecorded')}
                </span>
                {task.startedAt && task.completedAt && (
                  <span className="text-xs text-emerald-900 dark:text-emerald-200 font-medium mt-0.5">
                    {t('common.timeTaken')}: {formatTimeTaken(task.startedAt, task.completedAt)}
                  </span>
                )}
                {task.completionComment && (
                  <span className="text-xs text-emerald-900 dark:text-emerald-200 italic mt-0.5">
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

        {task.status === 'completed' && (task.proofPhotoUrls?.length || task.proofPhotoUrl) ? (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">{t('taskDetail.completionPhotoProof')}</h3>
            <div className="flex flex-wrap gap-3">
              {(task.proofPhotoUrls && task.proofPhotoUrls.length > 0 ? task.proofPhotoUrls : (task.proofPhotoUrl ? [task.proofPhotoUrl] : [])).map((url, index) => (
                <React.Fragment key={index}>
                  {isRenderableSavedImage(url) ? (
                    <div className="relative inline-block group cursor-zoom-in" onClick={() => setActiveZoomUrl(url || null)}>
                      <img 
                        src={url} 
                        alt={`Completion Proof ${index + 1}`} 
                        className="w-32 h-32 object-cover rounded-lg border border-slate-200 shadow-sm hover:brightness-95 transition-all"
                        onError={() => markImageBroken(url!)}
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
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : null}
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
        {(task.status === 'in_progress' || isAdminRole(currentUser.role)) && isAuthorized ? (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!updateText.trim()) return;
              setIsPostingUpdate(true);
              try {
                await addTaskUpdate(task.id, updateText, updatePhotoStorageId || undefined);
                notifyAssigneesAndAssigner('New Task Update', `${currentUser.name} posted an update on: ${task.title}`);
                setUpdateText('');
                setUpdatePhotoStorageId(null);
                setUpdatePhotoPreviewUrl(null);
              } catch (err) {
                console.error("Failed to add progress update:", err);
                alert('Unable to send this update right now. If you attached a large image, please try a smaller photo.');
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
                disabled={isPostingUpdate || isUploading}
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
                    disabled={isPostingUpdate || isUploading}
                  />
                  
                  {!updatePhotoPreviewUrl && !updatePhotoStorageId ? (
                    <button
                      type="button"
                      onClick={() => updatePhotoInputRef.current?.click()}
                      disabled={isPostingUpdate || isUploading}
                      className="task-action-secondary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Image size={13} className="text-slate-400" />
                      {t('taskDetail.updatePhoto')}
                    </button>
                  ) : (
                    <div className="relative inline-block">
                      <img
                        src={updatePhotoPreviewUrl || updatePhotoStorageId || ''}
                        alt="Update attachment preview"
                        className="w-10 h-10 object-cover rounded border border-slate-200 shadow-sm cursor-zoom-in"
                        onClick={() => setActiveZoomUrl(updatePhotoPreviewUrl || updatePhotoStorageId)}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveUpdatePhoto}
                        disabled={isPostingUpdate || isUploading}
                        className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow border-none cursor-pointer disabled:opacity-50"
                        title={t('taskDetail.removePhoto')}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPostingUpdate || isUploading || !updateText.trim()}
                  className="task-action-primary inline-flex items-center justify-center text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
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
      {task.status !== 'completed' && task.status !== 'could_not_complete' && isAuthorized && (
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
              multiple
              className="hidden" 
              ref={photoInputRef}
              onChange={handlePhotoChange}
              disabled={isUploading}
            />
            
            <button 
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isUploading}
              className="task-action-secondary inline-flex items-center justify-center gap-2 w-full rounded-lg py-2 text-sm font-semibold transition-colors cursor-pointer mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Camera size={18} />
              {t('taskDetail.addCompletionPhoto')}
            </button>
            
            {completionPhotos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {completionPhotos.map((item, index) => (
                  <div key={index} className="relative inline-block mt-1">
                    <img 
                      src={item.previewUrl} 
                      alt={`Proof Preview ${index + 1}`} 
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200 shadow-sm cursor-zoom-in"
                      onClick={() => setActiveZoomUrl(item.previewUrl)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      disabled={isUploading}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-colors border-none cursor-pointer disabled:opacity-50"
                      title={t('taskDetail.removePhoto')}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!showBlockReason ? (
            <div className="flex flex-col gap-2">
              {task.status === 'open' ? (
                <button 
                  onClick={handleStart}
                  disabled={isUploading}
                  className="task-action-primary inline-flex items-center justify-center gap-2 w-full rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Play size={18} className="fill-current" />
                  {t('taskDetail.startTask')}
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  disabled={isUploading}
                  className="task-action-success inline-flex items-center justify-center gap-2 w-full rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />
                  {t('taskDetail.markCompleted')}
                </button>
              )}
              
              <button 
                onClick={() => setShowBlockReason(true)}
                disabled={isUploading}
                className="task-action-danger-soft inline-flex items-center justify-center gap-2 w-full rounded-lg py-2.5 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                disabled={isUploading}
                className="task-action-danger inline-flex items-center justify-center w-full rounded-lg py-2.5 font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {t('taskDetail.submitIssue')}
              </button>
              <button 
                onClick={() => setShowBlockReason(false)}
                disabled={isUploading}
                className="task-action-secondary inline-flex items-center justify-center w-full rounded-lg py-2.5 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-lg transition-colors hover:bg-slate-100 cursor-pointer"
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
      {/* Upload Progress Modal Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            <div className="relative mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin flex items-center justify-center"></div>
              <Upload className="w-6 h-6 text-indigo-600 absolute" />
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {t('taskDetail.uploadInProgress')}
            </h3>

            <p className="text-xs text-slate-500 mb-4 max-w-[240px] truncate font-medium" title={uploadFileName}>
              {uploadFileName || t('taskDetail.uploadingMedia')}
            </p>

            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden border border-slate-200/60">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, uploadProgress)}%` }}
              ></div>
            </div>

            <div className="flex justify-between w-full text-xs text-slate-600 font-semibold mb-4 px-0.5">
              <span>
                {uploadStage === 'compressing'
                  ? t('taskDetail.compressingImage')
                  : uploadStage === 'preparing'
                  ? t('taskDetail.preparingUpload')
                  : t('taskDetail.uploadingMedia')}
              </span>
              <span className="text-indigo-600 font-bold">{uploadProgress}%</span>
            </div>

            <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 w-full flex items-center gap-2.5 text-left">
              <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <p className="text-[11px] text-amber-900 font-medium leading-tight">
                {t('taskDetail.doNotCloseWindow')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
