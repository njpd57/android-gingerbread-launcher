import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeAppUsage, BridgeGetAppUsageResponse } from "@/types/bridge-fork";

// App usage from Android's own records, for "Apps más usadas" and the screen time widget. Only our
// Bridge fork can read it, once the user gives Bridge "Usage access" in Android's settings. Widgets fetch
// the range they need and fetch again whenever `version` changes (back on the home screen, access changed).
export const useUsageStore = defineStore('usage', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getAppUsageURL') && bridgeHas('getCanReadUsageStats');
    const canRead = ref(isSupported && Bridge.getCanReadUsageStats());
    const version = ref(0);

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'canReadUsageStatsChanged')
            {
                canRead.value = ev.newValue;
                version.value++;
            }
            // usage grows while away in other apps, and access is granted in Android's settings
            else if (ev.name === 'afterResume')
            {
                canRead.value = Bridge.getCanReadUsageStats();
                version.value++;
            }
        });
    }

    async function fetchUsage(from: Date, to: Date): Promise<BridgeAppUsage[]>
    {
        if (!canRead.value) return [];
        try
        {
            const res = await fetch(Bridge.getAppUsageURL(from.getTime(), to.getTime()));
            if (!res.ok) return [];
            return (await res.json() as BridgeGetAppUsageResponse).apps;
        }
        catch (ex)
        {
            console.error('Failed to load app usage', ex);
            return [];
        }
    }

    return {
        isSupported,
        canRead,
        version,
        fetchUsage,
        requestAccess: () => Bridge.requestOpenUsageAccessSettings(true),
    };
});
