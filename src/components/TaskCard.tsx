import React from 'react';
import type { Task } from '../contexts/TaskContext';
import { useTasks } from '../contexts/TaskContext';
import StatusBadge from './StatusBadge';
import { Clock, AlertCircle, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const navigate = useNavigate();
  const { editTask } = useTasks();

  const handleCardClick = () => {
    navigate(`/employee/task/${task.id}`);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    editTask(task.id, { pinned: !task.pinned });
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="task-card relative" onClick={handleCardClick}>
      <div className="task-card-header flex justify-between items-start">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="task-title" style={{ margin: 0 }}>{task.title}</h3>
          {task.isSelfAssigned && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300">
              Self-Assigned
            </span>
          )}
          <button 
            onClick={handlePinClick}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${task.pinned ? 'text-blue-600' : 'text-gray-400'}`}
            title={task.pinned ? "Unpin task" : "Pin task"}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Pin size={16} fill={task.pinned ? "currentColor" : "none"} />
          </button>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="text-[11px] text-slate-500 mt-1">
        Created by: <span className="font-semibold text-slate-700">{task.createdByName || task.assignedByName || 'System'}</span>
      </div>
      
      <div className="task-meta mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs">
            <AlertCircle size={14} />
            <span className={getPriorityClass(task.priority)}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          </span>
          
          <span className="flex items-center gap-1 text-xs">
            <Clock size={14} />
            <span>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</span>
          </span>
        </div>

        {task.actualDuration && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            ⏱ {task.actualDuration}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
