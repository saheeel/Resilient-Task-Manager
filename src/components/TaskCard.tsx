import React from 'react';
import type { Task } from '../contexts/TaskContext';
import StatusBadge from './StatusBadge';
import { Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/employee/task/${task.id}`);
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
    <div className="task-card" onClick={handleCardClick}>
      <div className="task-card-header">
        <h3 className="task-title">{task.title}</h3>
        <StatusBadge status={task.status} />
      </div>
      
      <div className="task-meta mt-2">
        <span className="flex items-center gap-2">
          <AlertCircle size={14} />
          <span className={getPriorityClass(task.priority)}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </span>
        </span>
        
        <span className="flex items-center gap-2" style={{ marginLeft: '1rem' }}>
          <Clock size={14} />
          <span>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</span>
        </span>
      </div>
    </div>
  );
};

export default TaskCard;
