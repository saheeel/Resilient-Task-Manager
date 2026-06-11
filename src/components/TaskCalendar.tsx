import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { Task, User } from '../contexts/TaskContext';
import { getTaskSortDate } from '../lib/taskOptions';

interface TaskCalendarProps {
  tasks: Task[];
  currentUserId?: string;
  currentUserRole?: string | null;
  users: User[];
  onTaskOpen: (taskId: string) => void;
  initialView?: 'timeGridWeek' | 'dayGridMonth' | 'timeGridDay';
  height?: string | number;
  compact?: boolean;
}

const getEventColor = (status: string) => {
  switch (status) {
    case 'open':
      return '#3b82f6';
    case 'in_progress':
      return '#eab308';
    case 'completed':
      return '#22c55e';
    case 'could_not_complete':
    case 'blocked':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  currentUserId,
  currentUserRole,
  users,
  onTaskOpen,
  initialView = 'timeGridWeek',
  height = '72vh',
  compact = false,
}) => {
  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        if (currentUserRole === 'employee') {
          return currentUserId ? task.assignedTo.includes(currentUserId) : false;
        }
        return true;
      })
      .sort((a, b) => getTaskSortDate(a) - getTaskSortDate(b));
  }, [currentUserId, currentUserRole, tasks]);

  const events = useMemo(() => {
    return visibleTasks.map((task) => {
      const startDate = new Date(task.dueDate!);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const assigneeNames = task.assignedTo
        .map((id) => users.find((user) => user.id === id)?.name.split(' ')[0])
        .filter(Boolean)
        .join(', ');

      return {
        id: task.id,
        title: task.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: getEventColor(task.status),
        borderColor: getEventColor(task.status),
        extendedProps: {
          inCharge: task.inCharge,
          assigneeNames,
        },
      };
    });
  }, [users, visibleTasks]);

  return (
    <div className={compact ? 'task-calendar task-calendar--compact' : 'task-calendar'}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: compact ? 'timeGridWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        eventClick={(info) => onTaskOpen(info.event.id)}
        height={height}
        allDaySlot
        nowIndicator
        dayMaxEvents={compact ? 2 : 4}
        eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        eventClassNames="cursor-pointer rounded-md border-0 px-1 py-0.5 text-[11px] font-semibold shadow-sm"
      />
    </div>
  );
};

export default TaskCalendar;
