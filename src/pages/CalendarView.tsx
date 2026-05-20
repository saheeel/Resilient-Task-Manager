import React from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTasks } from '../contexts/TaskContext';
import { Calendar as CalendarIcon } from 'lucide-react';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, currentUser } = useTasks();

  const getEventColor = (status: string) => {
    switch (status) {
      case 'open': return '#3b82f6'; // blue-500
      case 'in_progress': return '#eab308'; // yellow-500
      case 'completed': return '#22c55e'; // green-500
      case 'could_not_complete':
      case 'blocked': return '#ef4444'; // red-500
      default: return '#64748b'; // slate-500
    }
  };

  const events = tasks
    .filter(task => {
      if (!task.dueDate) return false;
      if (currentUser?.role === 'employee') {
        return task.assignedTo.includes(currentUser.id);
      }
      return true;
    })
    .map(task => {
      const startDate = new Date(task.dueDate!);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
      
      return {
        id: task.id,
        title: task.title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: getEventColor(task.status),
        borderColor: getEventColor(task.status),
      };
    });

  const handleEventClick = (info: any) => {
    navigate(`/task/${info.event.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-6 flex justify-between items-center border-b border-slate-150 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-sm">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Schedule</h1>
            <p className="text-sm text-slate-500 mt-1">Hourly, daily, and weekly task calendar.</p>
          </div>
        </div>
      </header>

      <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={events}
          eventClick={handleEventClick}
          height="75vh"
          allDaySlot={true}
          nowIndicator={true}
          eventClassNames="cursor-pointer shadow-sm rounded-sm text-xs font-semibold px-1"
        />
      </div>
    </div>
  );
};

export default CalendarView;
