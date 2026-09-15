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
  const { t, formatDateTime, priorityLabel, taskTypeLabel } = useLanguage();
  const calendarRef = useRef<FullCalendar | null>(null);

  const [calendarTitle, setCalendarTitle] = useState<string>('');
  const [activeView, setActiveView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>(initialView);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const visibleTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.isPaused) return false;
      // Do not show completed tasks on the calendar
      if (task.status === 'completed') return false;

      // Filter by role if employee
      if (currentUserRole === 'employee' && currentUserId) {
        if (!task.assignedTo.includes(currentUserId)) return false;
      }

      return Boolean(task.dueDate || task.activeFrom || task.createdAt);
    });
  }, [tasks, currentUserRole, currentUserId]);

  const events = useMemo(() => {
    return visibleTasks.map((task) => {
      const dateString = task.dueDate || task.activeFrom || task.createdAt;
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
  };

  const handleEventClick = (info: any) => {
    const task = visibleTasks.find((t) => t.id === info.event.id);
    if (task) {
      setSelectedTask(task);
    } else {
      onTaskOpen(info.event.id);
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

  return (
    <div className="space-y-4">
      {/* Responsive Calendar Toolbar (Clean, No-Overlap Design) */}
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

      {/* 3. FullCalendar Engine */}
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
          height={height}
          allDaySlot
          nowIndicator
          dayMaxEvents={2}
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          eventClassNames="cursor-pointer font-medium"
          eventContent={(eventInfo) => {
            if (activeView === 'listMonth') return undefined; // use native clean list layout
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

      {/* 4. Task Preview Popover / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setSelectedTask(null)}
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
                  <StatusBadge status={selectedTask.status} />
                  {renderPriorityBadge(selectedTask.priority)}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
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
                  {taskTypeLabel(selectedTask.type)}
                </span>
              </div>

              {/* Due Date */}
              {selectedTask.dueDate && (
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span className="font-semibold">{t('common.dueDate') || 'Due Date'}:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDateTime(selectedTask.dueDate)}
                  </span>
                </div>
              )}

              {/* Assignees */}
              <div className="flex items-center gap-2">
                <UserIcon size={14} className="text-slate-400" />
                <span className="font-semibold">{t('common.assigned') || 'Assigned to'}:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {selectedTask.assignedTo
                    .map((id) => users.find((u) => u.id === id)?.name || 'Unknown')
                    .join(', ')}
                </span>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <p className="line-clamp-3">{selectedTask.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {onQuickComplete && selectedTask.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickComplete(selectedTask.id);
                    setSelectedTask(null);
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
                  const taskId = selectedTask.id;
                  setSelectedTask(null);
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
