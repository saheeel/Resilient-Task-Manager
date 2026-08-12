import React, { useEffect, useRef } from 'react';
import { useTasks, isAdminRole } from '../contexts/TaskContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { ensurePushSubscription } from '../lib/pushNotifications';

const NotificationListener: React.FC = () => {
  const { tasks, currentUser, isBackendConnected, deviceNotificationsMuted } = useTasks();
  const savePushSubscription = useMutation(api.pushMutations.subscribe);
  const knownTaskIds = useRef<Set<string>>(new Set());
  const knownTaskStates = useRef<Map<string, string>>(new Map());
  const isFirstLoad = useRef(true);

  // 1. Request Browser System Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const promise = Notification.requestPermission();
        if (promise && promise.then) {
          promise.then((permission) => {
            console.log('System Notification permission:', permission);
          }).catch(console.error);
        }
      } catch (err) {
        console.error('Failed to request notification permission:', err);
      }
    }
  }, []);

  // 2. Track Real-Time Foreground Task Assignments & Supervisor Activity Feed
  useEffect(() => {
    if (!currentUser || !isBackendConnected) return;
    if (deviceNotificationsMuted) return; // Muted specifically on this device

    const isDianaOrSupervisor = currentUser.name.toLowerCase().includes('diana') || currentUser.isPrimarySupervisor || isAdminRole(currentUser.role);
    const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));

    if (isFirstLoad.current) {
      if (tasks.length > 0) {
        myTasks.forEach(t => knownTaskIds.current.add(t.id));
        tasks.forEach((task) => knownTaskStates.current.set(task.id, task.status));
        isFirstLoad.current = false;
      }
      return;
    }

    // A. Notify Assignee of new task assignment
    myTasks.forEach((task) => {
      if (!knownTaskIds.current.has(task.id)) {
        knownTaskIds.current.add(task.id);

        if ('Notification' in window && Notification.permission === 'granted') {
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

    // B. For Diana / Primary Supervisor: Notify on all task updates (status change, images added, marked incomplete)
    if (isDianaOrSupervisor) {
      tasks.forEach((task) => {
        const previousStatus = knownTaskStates.current.get(task.id);

        if (previousStatus && previousStatus !== task.status) {
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              let title = `Task Status Update: ${task.title}`;
              if (task.status === 'completed') title = `✅ Task Completed: ${task.title}`;
              if (task.status === 'could_not_complete' || task.status === 'blocked') title = `⚠️ Task Issue: ${task.title}`;

              const notification = new Notification(title, {
                body: `Status changed from ${previousStatus.toUpperCase()} to ${task.status.toUpperCase()}`,
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
              console.error('Failed to trigger supervisor notification:', err);
            }
          }
        }

        knownTaskStates.current.set(task.id, task.status);
      });
    }
  }, [tasks, currentUser, isBackendConnected]);

  // 4. Register Browser Web Push Subscription for Background alerts (app closed)
  useEffect(() => {
    if (!currentUser || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Wait for notification permission to be granted
        if ('Notification' in window && Notification.permission === 'granted') {
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
