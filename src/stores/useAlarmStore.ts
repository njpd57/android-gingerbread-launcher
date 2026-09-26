import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useAppsStore } from "./useAppsStore";
import { useAppLauncherStore } from "./useAppLauncherStore";
import { bridgeHas } from "@/utils/bridge-utils";
import { findClockApp } from "@/utils/clock";
import type { BridgeNextAlarm } from "@/types/bridge-fork";

// The next alarm (status bar icon, digital clock) and opening the clock app from the clock widgets.
// Our Bridge fork reports the alarm and opens the alarm list of whatever clock app the user has; stock
// Bridge has neither, so the clocks launch the first known clock app installed.
export const useAlarmStore = defineStore('alarm', () =>
{
    const bridgeEvents = useBridgeEventStore();
    const apps = useAppsStore();
    const launcher = useAppLauncherStore();

    const isSupported = bridgeHas('getNextAlarm');
    const nextAlarm = ref<BridgeNextAlarm | null>(isSupported ? JSON.parse(Bridge.getNextAlarm()) : null);

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'nextAlarmChanged')
                nextAlarm.value = ev.newValue;
        });
    }

    function openAlarms()
    {
        if (bridgeHas('requestOpenAlarms') && Bridge.requestOpenAlarms(false))
            return;
        const pkg = findClockApp(p => apps.apps.has(p));
        if (pkg) launcher.launch(pkg);
    }

    return {
        isSupported,
        nextAlarm,
        openAlarms,
    };
});
