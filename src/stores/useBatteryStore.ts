import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import { crossedLowBattery } from "@/utils/battery";
import type { BridgeBattery, BridgePluggedType } from "@/types/bridge-fork";

// Battery Status API; not in TypeScript's DOM types, and not available in every WebView
interface BatteryManager extends EventTarget
{
    level: number;
    charging: boolean;
}

// The battery for the status bar, the battery widget and the low battery warning. Our Bridge fork
// reports the real level, charging state and plug type (`getBattery`); stock Bridge falls back to the
// web Battery Status API, which has no plug type and may be missing (level stays null).
export const useBatteryStore = defineStore('battery', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getBattery');
    // 0 to 1, or null when unknown
    const level = ref<number | null>(null);
    const charging = ref(false);
    const pluggedType = ref<BridgePluggedType | null>(null);
    // the threshold (%) of the low battery warning to show, or null
    const lowBatteryWarning = ref<number | null>(null);

    function update(newLevel: number, newCharging: boolean, newPlugged: BridgePluggedType | null)
    {
        const previous = level.value === null ? null : Math.round(level.value * 100);
        const current = Math.round(newLevel * 100);
        const crossed = crossedLowBattery(previous, current, newCharging);
        if (crossed !== null)
            lowBatteryWarning.value = crossed;
        else if (newCharging)
            lowBatteryWarning.value = null;

        level.value = newLevel;
        charging.value = newCharging;
        pluggedType.value = newPlugged;
    }

    function fromBridge(b: BridgeBattery)
    {
        update(b.level / 100, b.isCharging, b.pluggedType);
    }

    if (isSupported)
    {
        fromBridge(JSON.parse(Bridge.getBattery()));
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'batteryChanged')
                fromBridge(ev.newValue);
        });
    }
    else
    {
        const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
        nav.getBattery?.()
            .then(b =>
            {
                const read = () => update(b.level, b.charging, null);
                read();
                b.addEventListener('levelchange', read);
                b.addEventListener('chargingchange', read);
            })
            .catch(() => { /* not available: level stays null */ });
    }

    return {
        isSupported,
        level,
        charging,
        pluggedType,
        lowBatteryWarning,
        dismissLowBatteryWarning: () => { lowBatteryWarning.value = null; },
    };
});
