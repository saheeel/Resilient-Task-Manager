import React, { useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { Task, User } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import StatusBadge from './StatusBadge';
import { 
  Clock, 
  User as UserIcon, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Repeat, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CalendarDays, 
  List
} from 'lucide-react';

interface TaskCalendarProps {
  tasks: Task[];
  currentUserId?: string;
  currentUserRole?: string | null;
  users: User[];
  onTaskOpen: (taskId: string) => void;
  onQuickComplete?: (taskId: string) => void;
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth';
  height?: string | number;
  compact?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open':
      return '#3b82f6'; // Blue
    case 'in_progress':
      return '#eab308'; // Amber
    case 'completed':
      return '#22c55e'; // Green
    case 'could_not_complete':
    case 'blocked':
      return '#ef4444'; // Red
    default:
      return '#64748b'; // Slate
  }
};

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  currentUserId,
  currentUserRole,
  users,
  onTaskOpen,
  onQuickComplete,
  initialView = 'listMonth',
  height = 'auto',
  compact = false,
}) => {
  const { t, formatDate, formatDateTime, formatTime, priorityLabel, taskTypeLabel } = useLanguage();
  const calendarRef = useRef<FullCalendar | null>(null);

  const [calendarTitle, setCalendarTitle] = useState<string>('');
  const [activeView, setActiveView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>(initialView);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [selectedSingleTask, setSelectedSingleTask] = useState<Task | null>(null);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isPaused) return false;
      // Do not show completed tasks on the calendar
      if (task.status === 'completed') return false;

      // Filter by role if employee
      if (currentUserRole === 'employee' && currentUserId) {
        if (!task.assignedTo.includes(currentUserId)) return false;
      }

      return Boolean(task.dueDate || task.activeFrom || task.nextOccurrence || task.createdAt || task.type === 'daily');
    });
  }, [tasks, currentUserRole, currentUserId]);

  const events = useMemo(() => {
    return visibleTasks.map((task) => {
      const dateString = task.dueDate || task.activeFrom || task.nextOccurrence || task.createdAt;
      const startDate = new Date(dateString!);
      const isAllDay = !task.dueDate?.includes('T') && !task.recurringTime;
      const endDate = new Date(startDate.getTime() + (isAllDay ? 0 : 60 * 60 * 1000));

      const assigneeNames = task.assignedTo
        .map((id) => users.find((user) => user.id === id)?.name?.split(' ')[0] || 'Unknown')
        .filter(Boolean)
        .join(', ');

      const color = getStatusColor(task.status);

      return {
        id: task.id,
        title: `${task.pinned ? '📌 ' : ''}${task.title}`,
        start: isAllDay ? dateString!.split('T')[0] : startDate.toISOString(),
        end: isAllDay ? undefined : endDate.toISOString(),
        allDay: isAllDay,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          task,
          assigneeNames,
          priority: task.priority,
          status: task.status,
          type: task.type,
        },
      };
    });
  }, [visibleTasks, users]);

  // Tasks belonging to the selected date in Month / Week view
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const targetDate = new Date(`${selectedDate}T00:00:00`);
    const targetDayOfWeek = targetDate.getDay();
    const targetDayOfMonth = targetDate.getDate();
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayKey = dayKeys[targetDayOfWeek];

    return visibleTasks.filter((task) => {
      // 1. Exact date match on dueDate, activeFrom, or nextOccurrence
      if (task.dueDate && task.dueDate.startsWith(selectedDate)) return true;
      if (task.activeFrom && task.activeFrom.startsWith(selectedDate)) return true;
      if (task.nextOccurrence && task.nextOccurrence.startsWith(selectedDate)) return true;

      // 2. Daily routine
      if (task.type === 'daily') return true;

      // 3. Weekly routine matching target day of week
      if (task.type === 'weekly' && task.recurringDay) {
        const days = task.recurringDay.toLowerCase().split(',').map((d) => d.trim());
        if (days.includes(currentDayKey)) return true;
      }

      // 4. Monthly routine matching target date
      if (task.type === 'monthly' && task.recurringDay) {
        if (parseInt(task.recurringDay, 10) === targetDayOfMonth) return true;
      }

      // 5. One-time tasks created on this date
      if (task.type === 'one-time' && !task.dueDate && task.createdAt?.startsWith(selectedDate)) {
        return true;
      }

      return false;
    });
  }, [visibleTasks, selectedDate]);

  // Calendar Navigation Handlers
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth') => {
    setActiveView(view);
    calendarRef.current?.getApi().changeView(view);
    setSelectedDate(null);
    setSelectedSingleTask(null);
  };

  // When clicking a date cell (in month/week)
  const handleDateClick = (info: { dateStr: string }) => {
    const rawDate = info.dateStr.split('T')[0];
    setSelectedDate(rawDate);
    setHighlightedTaskId(null);
  };

  // When clicking an event pill/card
  const handleEventClick = (info: any) => {
    const rawDate = (info.event.startStr ? info.event.startStr.split('T')[0] : '') || selectedDate || new Date().toISOString().split('T')[0];
    const taskId = info.event.id;

    if (activeView === 'dayGridMonth' || activeView === 'timeGridWeek') {
      // Show all tasks for that date and highlight this one
      setSelectedDate(rawDate);
      setHighlightedTaskId(taskId);
    } else {
      // In Day or Agenda view, open task directly or show single preview
      const task = visibleTasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedSingleTask(task);
      } else {
        onTaskOpen(taskId);
      }
    }
  };

  const renderPriorityBadge = (priority: Task['priority']) => {
    const colorClasses = {
      high: 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
      medium: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
      low: 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    };

    return (
      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colorClasses[priority]}`}>
        {priorityLabel(priority)}
      </span>
    );
  };

  const formattedDateHeading = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(`${selectedDate}T00:00:00`);
    return formatDate(d, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [selectedDate, formatDate]);

  return (
    <div className="space-y-4">
      {/* Responsive Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 pb-1">
        {/* Title and Prev/Next Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {calendarTitle || 'Schedule'}
          </h2>

          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors rounded-lg cursor-pointer"
            >
              {t('common.today') || 'Today'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* View Switcher Segmented Pills (Agenda | Day | Week | Month) */}
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar w-full sm:w-auto justify-between sm:justify-start">
          {[
            { id: 'listMonth', label: t('calendar.agendaView') || 'Agenda', icon: List },
            { id: 'timeGridDay', label: t('calendar.dayView') || 'Day', icon: Clock },
            { id: 'timeGridWeek', label: t('calendar.weekView') || 'Week', icon: Calendar },
            { id: 'dayGridMonth', label: t('calendar.monthView') || 'Month', icon: CalendarDays },
          ].map((view) => {
            const isActive = activeView === view.id;
            const Icon = view.icon;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => handleViewChange(view.id as any)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FullCalendar Engine */}
      <div className={compact ? 'task-calendar task-calendar--compact' : 'task-calendar'}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={initialView}
          headerToolbar={false}
          datesSet={(dateInfo) => {
            setCalendarTitle(dateInfo.view.title);
          }}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          height={height}
          allDaySlot
          nowIndicator
          dayMaxEvents={2}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          eventClassNames="cursor-pointer font-medium"
          eventContent={(eventInfo) => {
            if (activeView === 'listMonth') return undefined;
            return (
              <div className="flex items-center gap-1 px-1 py-0.5 w-full overflow-hidden text-[10px] sm:text-[11px] leading-tight select-none">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: eventInfo.event.backgroundColor }}
                />
                <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                  {eventInfo.event.title}
                </span>
              </div>
            );
          }}
        />
      </div>

      {/* 🌟 Focused Day Overview Drawer (for Month & Week clicks) */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => {
              setSelectedDate(null);
              setHighlightedTaskId(null);
            }}
          />

          {/* Drawer / Modal Dialog */}
          <div
            className="relative bg-white dark:bg-slate-900 w-full sm:max-w-xl max-h-[85vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Drag Pill */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                    {formattedDateHeading}
                  </h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {selectedDateTasks.length === 1
                      ? `1 ${t('common.task') || 'task'}`
                      : `${selectedDateTasks.length} ${t('common.tasks') || 'tasks'}`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setHighlightedTaskId(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tasks List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Calendar size={22} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t('calendar.noTasksScheduled') || 'No tasks scheduled for this day.'}
                  </p>
                </div>
              ) : (
                selectedDateTasks.map((task) => {
                  const isHighlighted = highlightedTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`rounded-2xl p-4 transition-all border ${
                        isHighlighted
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      }`}
                    >
                      {/* Badges Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={task.status} />
                          {renderPriorityBadge(task.priority)}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          {task.type !== 'one-time' && <Repeat size={11} />}
                          <span>{taskTypeLabel(task.type)}</span>
                          {task.recurringTime && <span>• {formatTime(`1970-01-01T${task.recurringTime}:00`)}</span>}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug mb-1.5">
                        {task.pinned ? '📌 ' : ''}{task.title}
                      </h4>

                      {/* Description preview */}
                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        {/* Assignees */}
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <UserIcon size={14} className="shrink-0" />
                          <span className="truncate font-medium">
                            {task.assignedTo
                              .map((id) => users.find((u) => u.id === id)?.name?.split(' ')[0] || 'Unknown')
                              .filter(Boolean)
                              .join(', ') || t('common.unassigned') || 'Unassigned'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {onQuickComplete && task.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickComplete(task.id);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800/60"
                              title="Mark Complete"
                            >
                              <CheckCircle2 size={13} />
                              <span>{t('calendar.quickComplete') || 'Complete'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(null);
                              onTaskOpen(task.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer shadow-2xs"
                          >
                            <ExternalLink size={13} />
                            <span>{t('calendar.viewDetails') || 'Details'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single Task Popover Modal (for Day / Agenda view clicks) */}
      {selectedSingleTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setSelectedSingleTask(null)}
          />

          {/* Modal Container */}
          <div
            className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-scale-up space-y-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedSingleTask.status} />
                  {renderPriorityBadge(selectedSingleTask.priority)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedSingleTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSingleTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Task Info Details */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              {/* Cadence */}
              <div className="flex items-center gap-2">
                <Repeat size={14} className="text-slate-400" />
                <span className="font-semibold">{t('common.type') || 'Cadence'}:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {taskTypeLabel(selectedSingleTask.type)}
                </span>
              </div>

              {/* Due Date */}
              {selectedSingleTask.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-semibold">{t('common.dueDate') || 'Due Date'}:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(selectedSingleTask.dueDate)}
                  </span>
                </div>
              )}

              {/* Assignees */}
              <div className="flex items-center gap-2">
                <UserIcon size={14} className="text-slate-400" />
                <span className="font-semibold">{t('common.assigned') || 'Assigned to'}:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedSingleTask.assignedTo
                    .map((id) => users.find((u) => u.id === id)?.name || 'Unknown')
                    .join(', ')}
                </span>
              </div>

              {/* Description */}
              {selectedSingleTask.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <p className="line-clamp-3">{selectedSingleTask.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {onQuickComplete && selectedSingleTask.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickComplete(selectedSingleTask.id);
                    setSelectedSingleTask(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 size={15} />
                  <span>{t('calendar.quickComplete') || 'Complete'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const taskId = selectedSingleTask.id;
                  setSelectedSingleTask(null);
                  onTaskOpen(taskId);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <ExternalLink size={15} />
                <span>{t('calendar.viewDetails') || 'View Details'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
