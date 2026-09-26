import { onBeforeUnmount, ref } from "vue";

// Network Information API; also missing from the DOM types and only partly available in WebViews
interface NetworkInformation extends EventTarget
{
    type?: string;
    effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

export type EffectiveConnectionType = NonNullable<NetworkInformation['effectiveType']>;

/**
 * What the WebView can tell us about the network for the Gingerbread status bar and the power widget.
 * Stock Bridge exposes none of this, so it relies on web APIs; anything unavailable stays null.
 * (The battery is in useBatteryStore.)
 */
export function useDeviceStatus()
{
    const online = ref(navigator.onLine);
    // 'wifi', 'cellular', ... or null when the WebView doesn't say
    const connectionType = ref<string | null>(null);
    // the browser's estimate of connection quality, or null when unavailable
    const effectiveType = ref<EffectiveConnectionType | null>(null);

    const nav = navigator as Navigator & { connection?: NetworkInformation };

    function readConnection()
    {
        online.value = navigator.onLine;
        connectionType.value = nav.connection?.type ?? null;
        effectiveType.value = nav.connection?.effectiveType ?? null;
    }

    readConnection();
    window.addEventListener('online', readConnection);
    window.addEventListener('offline', readConnection);
    nav.connection?.addEventListener('change', readConnection);

    onBeforeUnmount(() =>
    {
        window.removeEventListener('online', readConnection);
        window.removeEventListener('offline', readConnection);
        nav.connection?.removeEventListener('change', readConnection);
    });

    return {
        online,
        connectionType,
        effectiveType,
    };
}
