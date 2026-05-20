export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

interface SavePushSubscriptionArgs {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function ensurePushSubscription(
  userId: string,
  savePushSubscription: (args: SavePushSubscriptionArgs) => Promise<unknown>
) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Push notifications are not supported on this device.');
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is missing.');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const keyInfo = subscription.toJSON();
  if (!keyInfo.endpoint || !keyInfo.keys?.p256dh || !keyInfo.keys?.auth) {
    throw new Error('Push subscription is missing required key information.');
  }

  await savePushSubscription({
    userId,
    endpoint: keyInfo.endpoint,
    p256dh: keyInfo.keys.p256dh,
    auth: keyInfo.keys.auth,
  });
}
