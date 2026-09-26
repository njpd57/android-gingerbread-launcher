import { defineStore } from "pinia";
import { ref } from "vue";
import { RingLog, summarizeEvent, type RecentBridgeEvent } from "@/utils/diagnostics";
import type { BridgeEvent } from "@bridgelauncher/api";
import type { BridgeForkEvent } from "@/types/bridge-fork";

// our Bridge fork sends events the upstream types don't know about
export type AnyBridgeEvent = BridgeEvent | BridgeForkEvent;
export type AnyBridgeEventListener = (event: AnyBridgeEvent) => void;

const MAX_RECENT_EVENTS = 30;

export const useBridgeEventStore = defineStore('bridgeEvent', () =>
{
    const listeners = new Set<AnyBridgeEventListener>();
    // the last events received, for the diagnostics dialog: stored as they come (no copying or
    // summarizing per event) and only turned into text when the dialog reads them
    const log = new RingLog<{ time: number; event: AnyBridgeEvent }>(MAX_RECENT_EVENTS);
    // bumped per event, so an open dialog updates; nothing depends on it while the dialog is closed
    const eventCount = ref(0);

    function recentEvents(): RecentBridgeEvent[]
    {
        void eventCount.value;
        return log.newestFirst().map(e => summarizeEvent(e.event as { name: string } & Record<string, unknown>, e.time));
    }

    function addEventListener(listener: AnyBridgeEventListener)
    {
        listeners.add(listener);
    }

    function removeEventListener(listener: AnyBridgeEventListener)
    {
        listeners.delete(listener);
    }

    window.onBridgeEvent = (event: AnyBridgeEvent) =>
    {
        log.push({ time: Date.now(), event });
        eventCount.value++;
        for (const listener of listeners)
        {
            listener(event);
        }
    };

    return {
        addEventListener,
        removeEventListener,
        recentEvents,
    };
});
