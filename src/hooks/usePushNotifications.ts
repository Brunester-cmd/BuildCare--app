import { useState, useEffect, useCallback } from 'react';

function canNotify() {
    return 'Notification' in window && 'serviceWorker' in navigator;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        return await navigator.serviceWorker.ready;
    } catch {
        return null;
    }
}

export function usePushNotifications(userId: string | undefined) {
    const [permission, setPermission] = useState<NotificationPermission>(
        canNotify() ? Notification.permission : 'denied'
    );
    const [pushEnabled, setPushEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load current preference — stubbed until Worker profile API is ready
    useEffect(() => {
        if (!userId) return;
        // TODO: fetch from /api/profiles/:userId when Worker endpoint is ready
        setPushEnabled(false);
    }, [userId]);

    const enable = useCallback(async (): Promise<boolean> => {
        if (!canNotify()) {
            alert('Tu navegador no soporta notificaciones push.');
            return false;
        }
        setLoading(true);

        // Request permission
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== 'granted') { setLoading(false); return false; }

        // Register SW if not yet done
        const reg = await getRegistration();
        if (!reg) { setLoading(false); return false; }

        // TODO: Save preference via Worker API
        // await fetchApi(`/profiles/${userId}`, { method: 'PUT', body: JSON.stringify({ push_enabled: true }) });
        setPushEnabled(true);
        setLoading(false);
        return true;
    }, [userId]);

    const disable = useCallback(async () => {
        // TODO: Save preference via Worker API
        // await fetchApi(`/profiles/${userId}`, { method: 'PUT', body: JSON.stringify({ push_enabled: false }) });
        setPushEnabled(false);
    }, [userId]);

    const toggle = useCallback(async () => {
        if (pushEnabled) {
            await disable();
        } else {
            await enable();
        }
    }, [pushEnabled, enable, disable]);

    return { permission, pushEnabled, loading, toggle, enable, disable };
}

/** Show a notification via the Service Worker (works while app is open) */
export async function showLocalNotification(title: string, body: string) {
    if (!canNotify() || Notification.permission !== 'granted') return;

    const reg = await getRegistration();
    if (reg) {
        await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            // vibrate is valid at runtime in Chrome/Android but not in TS lib types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

    } else {
        // Fallback: basic browser notification
        new Notification(title, { body, icon: '/icon-192.png' });
    }
}
