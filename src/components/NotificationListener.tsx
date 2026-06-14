import React, { useEffect, useRef } from 'react';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ensurePushSubscription } from '../lib/pushNotifications';

const NotificationListener: React.FC = () => {
  const { tasks, currentUser, isBackendConnected } = useTasks();
  const savePushSubscription = useMutation(api.pushMutations.subscribe);
  const knownTaskIds = useRef<Set<string>>(new Set());
  const knownTaskStates = useRef<Map<string, string>>(new Map());
  const isFirstLoad = useRef(true);
  const supportsBackgroundPush = 'serviceWorker' in navigator && 'PushManager' in window;

  // 1. Request Browser System Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('System Notification permission:', permission);
      });
    }
  }, []);

  // 2. Track Real-Time Foreground Task Assignments
  useEffect(() => {
    if (!currentUser || !isBackendConnected) return;

    const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));

    if (isFirstLoad.current) {
      if (tasks.length > 0) {
        myTasks.forEach(t => knownTaskIds.current.add(t.id));
        tasks.forEach((task) => knownTaskStates.current.set(task.id, task.status));
        isFirstLoad.current = false;
      }
      return;
    }

    myTasks.forEach((task) => {
      if (!knownTaskIds.current.has(task.id)) {
        knownTaskIds.current.add(task.id);

        if (!supportsBackgroundPush && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification("New Task Assigned! 🚀", {
              body: `${task.title}\nPriority: ${task.priority.toUpperCase()}${task.assignedByName ? `\nAssigned by: ${task.assignedByName}` : ''}`,
              icon: '/resilientlogo.svg',
              badge: '/resilientlogo.svg',
              vibrate: [200, 100, 200],
            } as any);

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (err) {
            console.error('Failed to trigger foreground notification:', err);
          }
        }
      }
    });
  }, [tasks, currentUser, isBackendConnected]);

  // 3. Track task completion updates for admin-side users while the app is open
  useEffect(() => {
    if (!currentUser || !isAdminRole(currentUser.role) || !isBackendConnected) return;

    if (isFirstLoad.current) return;

    tasks.forEach((task) => {
      const previousStatus = knownTaskStates.current.get(task.id);

      if (previousStatus && previousStatus !== 'completed' && task.status === 'completed') {
        if (!supportsBackgroundPush && 'Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification('Task Completed', {
              body: task.title,
              icon: '/resilientlogo.svg',
              badge: '/resilientlogo.svg',
              vibrate: [150, 75, 150],
            } as any);

            notification.onclick = () => {
              window.focus();
              window.location.href = `/task/${task.id}`;
              notification.close();
            };
          } catch (err) {
            console.error('Failed to trigger completion notification:', err);
          }
        }
      }

      knownTaskStates.current.set(task.id, task.status);
    });
  }, [tasks, currentUser, isBackendConnected]);

  // 4. Register Browser Web Push Subscription for Background alerts (app closed)
  useEffect(() => {
    if (!currentUser || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Wait for notification permission to be granted
        if (Notification.permission === 'granted') {
          await registration.update();
          await ensurePushSubscription(currentUser.id, savePushSubscription);
          console.log("Successfully registered PWA Web Push token in Convex database.");
        }
      } catch (err) {
        console.error("Failed to register background Web Push subscription:", err);
      }
    };

    const retryOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        registerPush();
      }
    };

    registerPush();
    window.addEventListener('focus', registerPush);
    document.addEventListener('visibilitychange', retryOnVisibility);

    return () => {
      window.removeEventListener('focus', registerPush);
      document.removeEventListener('visibilitychange', retryOnVisibility);
    };
  }, [currentUser, savePushSubscription]);

  return null;
};

export default NotificationListener;
