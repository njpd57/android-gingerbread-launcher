import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import { statusBarNotifications } from "@/utils/notifications";
import type { BridgeGetNotificationsResponse, BridgeNotification } from "@/types/bridge-fork";

// The device's active notifications. Only our Bridge fork can read them, and only after the user
// gives Bridge notification access; otherwise the list stays empty and `canRead` is false.
export const useNotificationsStore = defineStore('notifications', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getCanReadNotifications') && bridgeHas('getNotificationsURL');

    const canRead = ref(isSupported && Bridge.getCanReadNotifications());
    const byKey = ref(new Map<string, BridgeNotification>());

    async function load()
    {
        if (!canRead.value)
        {
            byKey.value = new Map();
            return;
        }

        try
        {
            const res = await fetch(Bridge.getNotificationsURL());
            const data = await res.json() as BridgeGetNotificationsResponse;
            byKey.value = new Map(data.notifications.map(n => [n.key, n]));
        }
        catch (ex)
        {
            console.error('Failed to load notifications', ex);
        }
    }

    function setCanRead(value: boolean)
    {
        if (canRead.value === value) return;
        canRead.value = value;
        load();
    }

    if (isSupported)
    {
        load();

        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'notificationPosted')
                byKey.value = new Map(byKey.value).set(ev.notification.key, ev.notification);
            else if (ev.name === 'notificationRemoved')
            {
                const next = new Map(byKey.value);
                next.delete(ev.key);
                byKey.value = next;
            }
            else if (ev.name === 'canReadNotificationsChanged')
                setCanRead(ev.newValue);
            // access is granted in Android's settings, so check again when coming back
            else if (ev.name === 'afterResume')
                setCanRead(Bridge.getCanReadNotifications());
        });
    }

    return {
        isSupported,
        canRead,
        notifications: computed(() => [...byKey.value.values()]),
        statusBarNotifications: computed(() => statusBarNotifications(byKey.value.values())),
        requestAccess: () => Bridge.requestOpenNotificationAccessSettings(true),
    };
});
