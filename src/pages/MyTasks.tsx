import React from 'react';
import { useTasks } from '../contexts/TaskContext';
import TaskCard from '../components/TaskCard';

const MyTasks: React.FC = () => {
  const { tasks, currentUser } = useTasks();

  if (!currentUser) return null;

  // Filter tasks assigned to the current user that are not completed or blocked
  const myTasks = tasks.filter(t => 
    t.assignedTo.includes(currentUser.id) && 
    (t.status === 'open' || t.status === 'in_progress')
  );

  return (
    <div className="support-container" style={{ paddingBottom: '20px' }}>
      <header className="mb-6">
        <h1 className="text-xl font-bold">Your Tasks</h1>
        <p className="text-sm text-gray-800 mt-1">
          {myTasks.length > 0 
            ? `You have ${myTasks.length} active tasks.` 
            : 'No active tasks assigned to you right now.'}
        </p>
      </header>

      <div className="task-list mt-4">
        {myTasks.length > 0 ? (
          myTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="text-center mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <p className="text-gray-800 font-medium">All caught up! Great job.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;
