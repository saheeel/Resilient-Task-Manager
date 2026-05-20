import React, { useEffect, useRef } from 'react';
import { useTasks } from '../contexts/TaskContext';

const NotificationListener: React.FC = () => {
  const { tasks, currentUser } = useTasks();
  const knownTaskIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // 1. Request Browser System Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('System Notification permission:', permission);
      });
    }
  }, []);

  // 2. Track Real-Time Task Assignments
  useEffect(() => {
    if (!currentUser) return;

    // Filter tasks assigned to the current logged-in employee
    const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));

    // First load: Populate existing task IDs to prevent historic notification spam on startup
    if (isFirstLoad.current) {
      if (tasks.length > 0) {
        myTasks.forEach(t => knownTaskIds.current.add(t.id));
        isFirstLoad.current = false;
      }
      return;
    }

    // Check if any newly received task is not in our known list
    myTasks.forEach((task) => {
      if (!knownTaskIds.current.has(task.id)) {
        // Mark it as known
        knownTaskIds.current.add(task.id);

        // Trigger native OS notification banner!
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification("New Task Assigned! 🚀", {
              body: `${task.title}\nPriority: ${task.priority.toUpperCase()}`,
              icon: '/resilientlogo.svg',
              badge: '/resilientlogo.svg',
              vibrate: [200, 100, 200],
            } as any);

            // Focus on click
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (err) {
            console.error('Failed to trigger notification:', err);
          }
        }
      }
    });
  }, [tasks, currentUser]);

  return null; // Component does not render any visual layout
};

export default NotificationListener;
