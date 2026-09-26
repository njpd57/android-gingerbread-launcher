import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeCalendarEvent, BridgeGetCalendarEventsResponse } from "@/types/bridge-fork";

// The device's calendar events, for the month calendar and agenda widgets. Only our Bridge fork can read
// them, after the user allows it in Android's dialog. Widgets fetch the range they show, and fetch again
// whenever `version` changes (events changed, access granted, or back from another app).
export const useCalendarStore = defineStore('calendar', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getCalendarEventsURL') && bridgeHas('requestCalendarPermission');
    const canRead = ref(isSupported && Bridge.getCanReadCalendar());
    const version = ref(0);

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'calendarChanged')
                version.value++;
            else if (ev.name === 'canReadCalendarChanged')
            {
                canRead.value = ev.newValue;
                version.value++;
            }
            // the permission can also be granted in Android's settings
            else if (ev.name === 'afterResume')
            {
                canRead.value = Bridge.getCanReadCalendar();
                version.value++;
            }
        });
    }

    async function fetchEvents(from: Date, to: Date): Promise<BridgeCalendarEvent[]>
    {
        if (!canRead.value) return [];
        try
        {
            const res = await fetch(Bridge.getCalendarEventsURL(from.getTime(), to.getTime()));
            if (!res.ok) return [];
            return (await res.json() as BridgeGetCalendarEventsResponse).events;
        }
        catch (ex)
        {
            console.error('Failed to load calendar events', ex);
            return [];
        }
    }

    return {
        isSupported,
        canRead,
        version,
        fetchEvents,
        requestAccess: () => Bridge.requestCalendarPermission(true),
        openEvent: (e: BridgeCalendarEvent) => Bridge.requestOpenCalendarEvent(e.eventId, e.begin, e.end, true),
        openDay: (date: Date) => Bridge.requestOpenCalendarAt(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9).getTime(), true),
    };
});
