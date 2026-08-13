import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { TaskType, Priority } from '../contexts/TaskContext';
import { ArrowLeft, Paperclip, X, Calendar, Clock, RefreshCw, Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MATERIAL_STATUS_OPTIONS } from '../lib/taskOptions';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const IN_CHARGE_OPTIONS = ['Nicolas', 'Ivo', 'Carlo', 'Sun', 'Juliane', 'Diana'];

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tasks, users, addTask, uploadFile, currentUser } = useTasks();

  const followUpFromId = searchParams.get('followUpFrom');
  const parentTask = followUpFromId ? tasks.find(t => t.id === followUpFromId) : undefined;

  const handleSelfAssign = () => {
    if (!currentUser) return;
    if (assignedTo.includes(currentUser.id)) {
      setAssignedTo(prev => prev.filter(id => id !== currentUser.id));
    } else {
      setAssignedTo(prev => [...prev, currentUser.id]);
    }
  };
  const { t, priorityLabel, taskTypeLabel, shortWeekdayLabel, weekdayLabel, monthDayOrdinalLabel, formatDate } = useLanguage();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [type, setType] = useState<TaskType>('one-time');
  const [priority, setPriority] = useState<Priority>('medium');

  // Pre-fill fields if creating a follow-up task
  useEffect(() => {
    if (parentTask) {
      setTitle(parentTask.title.toLowerCase().startsWith(t('common.followUpPrefix').toLowerCase()) ? parentTask.title : `${t('common.followUpPrefix')}${parentTask.title}`);
      if (parentTask.description) setDescription(parentTask.description);
      if (parentTask.remarks) setRemarks(parentTask.remarks);
      if (parentTask.priority) setPriority(parentTask.priority);
      if (parentTask.type) setType(parentTask.type as TaskType);
      if (parentTask.inCharge) setInCharge(parentTask.inCharge);
      if (parentTask.materialStatus) setMaterialStatus(parentTask.materialStatus as any);
    }
  }, [parentTask]);
  const isEmployee = currentUser?.role === 'employee';
  const [inCharge, setInCharge] = useState('');
  const [materialStatus, setMaterialStatus] = useState<(typeof MATERIAL_STATUS_OPTIONS)[number] | ''>('');
  const [assignedTo, setAssignedTo] = useState<string[]>(() => {
    return isEmployee && currentUser ? [currentUser.id] : [];
  });

  useEffect(() => {
    if (isEmployee && currentUser) {
      setAssignedTo([currentUser.id]);
    }
  }, [isEmployee, currentUser]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentStorageId, setAttachmentStorageId] = useState<string | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [attachmentFileName, setAttachmentFileName] = useState<string | null>(null);
  const [activeZoomUrl, setActiveZoomUrl] = useState<string | null>(null);

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

  // Recurring schedule fields
  // For weekly: array of selected days (stored as comma-separated on save)
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  // For monthly: single day number string
  const [recurringDay, setRecurringDay] = useState('');
  const [recurringTime, setRecurringTime] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const assignableUsers = users.filter(u => u.name.toLowerCase() !== 'saheel');

  const toggleAssignee = (id: string) => {
    setAssignedTo(prev =>
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const toggleWeeklyDay = (day: string) => {
    setRecurringDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAttachment(file);
      setAttachmentFileName(file.name);
      
      const isImg = file.type.startsWith('image/');
      const localPreview = isImg ? URL.createObjectURL(file) : null;
      setAttachmentPreviewUrl(localPreview);

      setIsUploading(true);
      setUploadProgress(5);
      setUploadStage('compressing');
      setUploadFileName(file.name);

      try {
        const storageId = await uploadFile(file, (percent, stage) => {
          setUploadProgress(percent);
          setUploadStage(stage as any);
        });
        setAttachmentStorageId(storageId);
      } catch (error) {
        console.error('Failed to prepare task attachment:', error);
        alert(error instanceof Error ? error.message : 'Unable to prepare this file. Please choose a smaller file.');
        setAttachment(null);
        setAttachmentStorageId(null);
        setAttachmentPreviewUrl(null);
        setAttachmentFileName(null);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
        if (e.target) e.target.value = '';
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentStorageId(null);
    setAttachmentPreviewUrl(null);
    setAttachmentFileName(null);
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${m} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedTo.length === 0) {
      alert(t('createTask.fillTitleAndAssignee'));
      return;
    }

    let isoDueDate;
    let isoStartDate;
    if (type === 'one-time') {
      if (dueDate) {
        try {
          isoDueDate = new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString();
        } catch {
          isoDueDate = new Date(dueDate).toISOString();
        }
      }
      if (startDate) {
        try {
          isoStartDate = new Date(`${startDate}T${startTime || '00:00'}`).toISOString();
        } catch {
          isoStartDate = new Date(startDate).toISOString();
        }
      }
    }

    let attachmentUrls: string[] | undefined;
    if (attachmentStorageId) {
      attachmentUrls = [attachmentStorageId];
    } else if (attachment) {
      try {
        attachmentUrls = [await uploadFile(attachment)];
      } catch (error) {
        console.error('Failed to prepare task attachment:', error);
        alert(error instanceof Error ? error.message : 'Unable to prepare this file. Please choose a smaller file.');
        return;
      }
    }

    const finalAssignedTo = isEmployee && currentUser ? [currentUser.id] : assignedTo;

    addTask({
      title,
      description,
      remarks,
      dueDate: isoDueDate,
      startDate: isoStartDate,
      type,
      priority,
      inCharge: inCharge || undefined,
      materialStatus: materialStatus || undefined,
      assignedTo: finalAssignedTo,
      isSelfAssigned: isEmployee || (currentUser ? finalAssignedTo.includes(currentUser.id) : false),
      createdById: currentUser?.id,
      createdByName: currentUser?.name,
      followUpFromId: parentTask ? parentTask.id : undefined,
      status: 'open',
      attachments: attachmentUrls,
      // Weekly stores comma-separated days; monthly stores single day number
      recurringDay:
        type === 'weekly'
          ? recurringDays.join(',')
          : type === 'monthly'
          ? recurringDay
          : undefined,
      recurringTime:
        type === 'daily' || type === 'weekly' || type === 'monthly'
          ? recurringTime
          : undefined,
    });

    navigate('/');
  };

  // ─── Shared time picker ───────────────────────────────────────────────────
  const renderTimePicker = (
    accentColor: 'indigo' | 'violet' | 'emerald',
    label: string
  ) => {
    const colorMap = {
      indigo: 'border-indigo-200 focus:border-indigo-400 focus:ring-indigo-200',
      violet: 'border-violet-200 focus:border-violet-400 focus:ring-violet-200',
      emerald: 'border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200',
    };
    const labelColorMap = {
      indigo: 'text-indigo-700',
      violet: 'text-violet-700',
      emerald: 'text-emerald-700',
    };
    return (
      <div>
        <label className={`block text-xs font-semibold mb-2 ${labelColorMap[accentColor]}`}>
          {label}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={recurringTime}
            onChange={e => setRecurringTime(e.target.value)}
            onClick={(e) => {
              try {
                (e.target as HTMLInputElement).showPicker();
              } catch {
                return;
              }
            }}
            className={`px-3 py-2 border rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 cursor-pointer ${colorMap[accentColor]}`}
          />
          {recurringTime && (
            <span className={`text-xs font-semibold ${labelColorMap[accentColor]}`}>
              {formatDisplayTime(recurringTime)}
            </span>
          )}
          {recurringTime && (
            <button
              type="button"
              onClick={() => setRecurringTime('')}
              className="text-xs text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none p-0"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <ArrowLeft size={16} />
        {t('createTask.backToDashboard')}
      </button>

      <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-xl shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
          {parentTask ? t('createTask.createFollowUp') : t('createTask.title')}
        </h1>

        {parentTask && (
          <div className="mb-6 flex items-center gap-2.5 p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <LinkIcon size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {t('createTask.linkingFollowUp')} <strong className="underline">{parentTask.title}</strong>
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('createTask.taskTitle')} *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                placeholder={t('createTask.taskTitlePlaceholder')}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('createTask.instructionsOptional')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                rows={2}
                placeholder={t('createTask.instructionsPlaceholder')}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t('createTask.inChargeOptional')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  value={inCharge}
                  onChange={(e) => setInCharge(e.target.value)}
                >
                  <option value="">{t('createTask.selectInCharge')}</option>
                  {IN_CHARGE_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t('createTask.materialStatusOptional')}
                </label>
                <div className="grid gap-2">
                  {MATERIAL_STATUS_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
                        materialStatus === option
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="materialStatus"
                        className="mt-0.5 h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-500"
                        checked={materialStatus === option}
                        onChange={() => setMaterialStatus(option)}
                      />
                      <span className="leading-5 text-slate-700">{t(`materials.${option}`)}</span>
                    </label>
                  ))}
                  {materialStatus && (
                    <button
                      type="button"
                      onClick={() => setMaterialStatus('')}
                      className="justify-self-start text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer bg-transparent border-none p-0"
                    >
                      {t('createTask.clearMaterialStatus')}
                    </button>
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t('createTask.materialCommentsOptional')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    rows={2}
                    placeholder={t('createTask.materialCommentsPlaceholder')}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scheduling & Priority */}
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t('createTask.taskType')}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={type}
                    onChange={e => {
                      setType(e.target.value as TaskType);
                      setRecurringDay('');
                      setRecurringDays([]);
                      setRecurringTime('');
                    }}
                  >
                    <option value="one-time">{taskTypeLabel('one-time')}</option>
                    <option value="daily">{taskTypeLabel('daily')}</option>
                    <option value="weekly">{taskTypeLabel('weekly')}</option>
                    <option value="monthly">{taskTypeLabel('monthly')}</option>
                  </select>
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    {t('createTask.priority')}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                    value={priority}
                    onChange={e => setPriority(e.target.value as Priority)}
                  >
                    <option value="low">{priorityLabel('low')}</option>
                    <option value="medium">{priorityLabel('medium')}</option>
                    <option value="high">{priorityLabel('high')}</option>
                  </select>
                </div>
              </div>

              {/* One-Time: Date + Time */}
              {type === 'one-time' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date / Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                      {t('createTask.startDateTime')}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const el = document.getElementById('startDateInput') as HTMLInputElement;
                              el?.showPicker();
                            } catch {
                              document.getElementById('startDateInput')?.click();
                            }
                          }}
                          className={`inline-flex items-center gap-2 pl-4 py-2 border rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                            startDate
                              ? 'bg-blue-50 border-blue-200 text-blue-700 pr-8'
                              : 'bg-slate-50 border-slate-200 text-slate-600 pr-4'
                          }`}
                        >
                          <Calendar size={14} />
                          <span>
                            {startDate
                              ? formatDate(startDate, { month: 'short', day: 'numeric', year: 'numeric' })
                              : t('createTask.setDate')}
                          </span>
                        </button>
                        <input
                          id="startDateInput"
                          type="date"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker();
                            } catch {}
                          }}
                        />
                        {startDate && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setStartDate(''); }}
                            className="absolute right-2.5 z-20 font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-blue-100/50"
                          >×</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <input
                          type="time"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker();
                            } catch {}
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 cursor-pointer"
                        />
                        {startTime && (
                          <button
                            type="button"
                            onClick={() => setStartTime('')}
                            className="font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-blue-100/50"
                          >×</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Due Date / Time */}
                  {/* Due Date / Time */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                      {t('createTask.dueDateTime')}
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              dateInputRef.current?.showPicker();
                            } catch {
                              dateInputRef.current?.click();
                            }
                          }}
                          className={`inline-flex items-center gap-2 pl-4 py-2 border rounded-full text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                            dueDate
                              ? 'bg-blue-50 border-blue-200 text-blue-700 pr-8'
                              : 'bg-slate-50 border-slate-200 text-slate-600 pr-4'
                          }`}
                        >
                          <Calendar size={14} />
                          <span>
                            {dueDate
                              ? formatDate(dueDate, { month: 'short', day: 'numeric', year: 'numeric' })
                              : t('createTask.setDate')}
                          </span>
                        </button>
                        <input
                          ref={dateInputRef}
                          type="date"
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker();
                            } catch {}
                          }}
                        />
                        {dueDate && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setDueDate(''); }}
                            className="absolute right-2.5 z-20 font-bold text-blue-500 hover:text-blue-700 cursor-pointer flex items-center justify-center w-4 h-4 rounded-full bg-blue-100/50"
                          >×</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <input
                          type="time"
                          value={dueTime}
                          onChange={e => setDueTime(e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).showPicker();
                            } catch {
                              return;
                            }
                          }}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 cursor-pointer"
                        />
                        {dueTime && (
                          <button type="button" onClick={() => setDueTime('')} className="text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-none p-0">
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily: Time only */}
              {type === 'daily' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-indigo-500" />
                    {t('createTask.dailyRecurring')}
                  </label>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
                    {renderTimePicker('indigo', t('createTask.timeEachDay'))}
                    {recurringTime && (
                      <p className="text-xs text-indigo-700 font-medium">
                        {t('createTask.repeatsEveryDayAt', { time: formatDisplayTime(recurringTime) })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly: Multiple days + Time */}
              {type === 'weekly' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-violet-500" />
                    {t('createTask.weeklyRecurring')}
                  </label>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-xs text-violet-700 font-semibold mb-2">
                        {t('createTask.daysOfWeek')} <span className="font-normal text-violet-500">{t('createTask.selectMultiple')}</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleWeeklyDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              recurringDays.includes(day)
                                ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                                : 'bg-white text-slate-600 border-violet-200 hover:border-violet-400 hover:text-violet-700'
                            }`}
                          >
                            {shortWeekdayLabel(day)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {renderTimePicker('violet', t('createTask.timeOnThoseDays'))}
                    {recurringDays.length > 0 && recurringTime && (
                      <p className="text-xs text-violet-700 font-medium">
                        {t('createTask.repeatsEveryDaysAt', {
                          days: recurringDays.map((day) => weekdayLabel(day)).join(', '),
                          time: formatDisplayTime(recurringTime),
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Monthly: Day of month + Time */}
              {type === 'monthly' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <RefreshCw size={13} className="text-emerald-500" />
                    {t('createTask.monthlyRecurring')}
                  </label>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-4">
                    <div>
                      <label className="block text-xs text-emerald-700 font-semibold mb-2">{t('createTask.dayOfMonth')}</label>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: 31 }, (_, i) => String(i + 1)).map(day => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setRecurringDay(recurringDay === day ? '' : day)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              recurringDay === day
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white text-slate-600 border-emerald-200 hover:border-emerald-400 hover:text-emerald-700'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    {renderTimePicker('emerald', t('createTask.timeOnThatDay'))}
                    {recurringDay && recurringTime && (
                      <p className="text-xs text-emerald-700 font-medium">
                        {t('createTask.repeatsMonthlyAt', {
                          day: monthDayOrdinalLabel(recurringDay),
                          time: formatDisplayTime(recurringTime),
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  {t('createTask.attachReference')}
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Paperclip size={16} />
                      {attachmentFileName ? t('common.changeFile') : t('common.uploadFile')}
                    </button>
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                      disabled={isUploading}
                    />
                  </div>

                  {attachmentFileName && (
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {attachmentPreviewUrl && (
                        <img
                          src={attachmentPreviewUrl}
                          alt="Attachment preview"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-sm cursor-zoom-in"
                          onClick={() => setActiveZoomUrl(attachmentPreviewUrl)}
                        />
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg max-w-[240px]">
                        <span className="truncate">{attachmentFileName}</span>
                        <button 
                          type="button" 
                          onClick={handleRemoveAttachment}
                          disabled={isUploading}
                          className="text-slate-400 hover:text-red-500 cursor-pointer border-none bg-transparent p-0 disabled:opacity-50"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  {t('createTask.assignTo')} *
                </label>
                {!isEmployee && currentUser && (
                  <button
                    type="button"
                    onClick={handleSelfAssign}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer font-semibold ${
                      assignedTo.includes(currentUser.id)
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100'
                    }`}
                  >
                    {assignedTo.includes(currentUser.id) ? '✓ Self-Assigned' : '➕ Assign to Myself'}
                  </button>
                )}
              </div>

              {isEmployee ? (
                <div className="p-4 bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 rounded-xl flex items-center gap-3 shadow-xs">
                  <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-950 dark:text-cyan-200">
                      Self-Assigned Task ({currentUser?.name})
                    </p>
                    <p className="text-[11px] text-cyan-800 dark:text-cyan-300 mt-0.5">
                      Tasks created by employees are automatically assigned to yourself. (Assigning tasks to other employees is reserved for supervisors).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {assignableUsers.length > 0 ? (
                    assignableUsers.map(emp => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
                          checked={assignedTo.includes(emp.id)}
                          onChange={() => toggleAssignee(emp.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{emp.name}</span>
                          {emp.employeeRole && <span className="text-xs text-slate-400">{emp.employeeRole}</span>}
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 p-2">{t('common.noTeamMembers')}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3 font-semibold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {t('createTask.addTask')}
            </button>
          </div>
        </form>
      </div>

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

      {/* High-Fidelity Zoom Modal */}
      {activeZoomUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xs transition-opacity cursor-zoom-out"
          onClick={() => setActiveZoomUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] rounded-lg flex items-center justify-center p-2 shadow-2xl"
            style={{ backgroundColor: '#ffffff' }}
          >
            <button 
              className="fixed top-6 right-6 z-[110] flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-900 shadow-xl transition-colors hover:bg-slate-100 cursor-pointer"
              style={{ backgroundColor: '#ffffff' }}
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
              className="max-w-full max-h-[85vh] object-contain rounded-md"
              style={{ backgroundColor: '#ffffff' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTask;
