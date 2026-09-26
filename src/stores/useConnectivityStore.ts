import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeConnectivity } from "@/types/bridge-fork";

// The real network state (network in use, Wi-Fi and mobile signal levels, data activity), from our
// Bridge fork. Null on stock Bridge, where the status bar falls back to a simulated signal.
export const useConnectivityStore = defineStore('connectivity', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getConnectivity');
    const connectivity = ref<BridgeConnectivity | null>(isSupported ? JSON.parse(Bridge.getConnectivity()) : null);

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'connectivityChanged')
                connectivity.value = ev.newValue;
        });
    }

    return {
        isSupported,
        connectivity,
    };
});
