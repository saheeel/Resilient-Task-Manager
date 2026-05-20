import React, { useEffect, useRef } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Utility helper to convert VAPID public key base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationListener: React.FC = () => {
  const { tasks, currentUser } = useTasks();
  const savePushSubscription = useMutation(api.pushMutations.subscribe);
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

  // 2. Track Real-Time Foreground Task Assignments
  useEffect(() => {
    if (!currentUser) return;

    const myTasks = tasks.filter(t => t.assignedTo.includes(currentUser.id));

    if (isFirstLoad.current) {
      if (tasks.length > 0) {
        myTasks.forEach(t => knownTaskIds.current.add(t.id));
        isFirstLoad.current = false;
      }
      return;
    }

    myTasks.forEach((task) => {
      if (!knownTaskIds.current.has(task.id)) {
        knownTaskIds.current.add(task.id);

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification("New Task Assigned! 🚀", {
              body: `${task.title}\nPriority: ${task.priority.toUpperCase()}`,
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
  }, [tasks, currentUser]);

  // 3. Register Browser Web Push Subscription for Background alerts (app closed)
  useEffect(() => {
    if (!currentUser || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registerPush = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Wait for notification permission to be granted
        if (Notification.permission === 'granted') {
          const VAPID_PUBLIC_KEY = "BLgD25tF_Y0bXYc-I6KVYTGC_3iHSuXj6MrKBQUsJYuEXxhnWu9UFV8RF-fUnbkAsbDKNzwJxV4rCmsc3Cx3cj4";
          
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            console.log("Created fresh background Web Push subscription:", subscription);
          }

          const keyInfo = subscription.toJSON();
          if (keyInfo.endpoint && keyInfo.keys?.p256dh && keyInfo.keys?.auth) {
            await savePushSubscription({
              userId: currentUser.id,
              endpoint: keyInfo.endpoint,
              p256dh: keyInfo.keys.p256dh,
              auth: keyInfo.keys.auth,
            });
            console.log("Successfully registered PWA Web Push token in Convex database.");
          }
        }
      } catch (err) {
        console.error("Failed to register background Web Push subscription:", err);
      }
    };

    registerPush();
  }, [currentUser, savePushSubscription]);

  return null;
};

export default NotificationListener;
