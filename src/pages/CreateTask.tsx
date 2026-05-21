import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import type { TaskType, Priority } from '../contexts/TaskContext';
import { ArrowLeft, Paperclip, X, Calendar, Clock, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const { users, addTask } = useTasks();
  const { t, priorityLabel, taskTypeLabel, shortWeekdayLabel, weekdayLabel, monthDayOrdinalLabel, formatDate } = useLanguage();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [type, setType] = useState<TaskType>('one-time');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);

  // Recurring schedule fields
  // For weekly: array of selected days (stored as comma-separated on save)
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  // For monthly: single day number string
  const [recurringDay, setRecurringDay] = useState('');
  const [recurringTime, setRecurringTime] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const employees = users.filter(u => u.role === 'employee');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    }
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 || 12;
    return `${displayHr}:${m} ${ampm}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || assignedTo.length === 0) {
      alert(t('createTask.fillTitleAndAssignee'));
      return;
    }

    let isoDueDate;
    if (type === 'one-time' && dueDate) {
      try {
        isoDueDate = new Date(`${dueDate}T${dueTime || '00:00'}`).toISOString();
      } catch {
        isoDueDate = new Date(dueDate).toISOString();
      }
    }

    addTask({
      title,
      description,
      remarks,
      dueDate: isoDueDate,
      type,
      priority,
      assignedTo,
      status: 'open',
      attachments: attachment ? [URL.createObjectURL(attachment)] : undefined,
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
        <h1 className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">{t('createTask.title')}</h1>

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
                {t('createTask.descriptionOptional')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                rows={2}
                placeholder={t('createTask.descriptionPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('createTask.remarksOptional')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                rows={2}
                placeholder={t('createTask.remarksPlaceholder')}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
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
                          } catch (err) {
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
                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
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
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <Paperclip size={16} />
                    {attachment ? t('common.changeFile') : t('common.uploadFile')}
                  </button>
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  {attachment && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg max-w-[200px]">
                      <span className="truncate">{attachment.name}</span>
                      <button type="button" onClick={() => setAttachment(null)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                {t('createTask.assignTo')} *
              </label>
              <div className="space-y-2 max-h-[260px] overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                {employees.length > 0 ? (
                  employees.map(emp => (
                    <label
                      key={emp.id}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer select-none transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-500 w-4 h-4"
                        checked={assignedTo.includes(emp.id)}
                        onChange={() => toggleAssignee(emp.id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{emp.name}</span>
                        {emp.employeeRole && <span className="text-xs text-slate-400">{emp.employeeRole}</span>}
                      </div>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 p-2">{t('common.noTeamMembers')}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-3 font-semibold text-sm shadow-sm transition-colors cursor-pointer"
            >
              {t('createTask.addTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
