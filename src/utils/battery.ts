import type { BridgePluggedType } from "@/types/bridge-fork";

// Gingerbread warned twice as the battery ran down: at 15 % and again at 5 %.
export const LOW_BATTERY_THRESHOLDS = [15, 5];

/**
 * The low battery threshold (in %) crossed going from `previous` to `current`, or null. When a drop
 * crosses both, the lower one is shown. Nothing while charging, or on the first reading (`previous`
 * null), so reopening the launcher at 10 % doesn't warn again.
 */
export function crossedLowBattery(previous: number | null, current: number, charging: boolean): number | null
{
    if (charging || previous === null) return null;
    const crossed = LOW_BATTERY_THRESHOLDS.filter(t => previous > t && current <= t);
    return crossed.length > 0 ? Math.min(...crossed) : null;
}

const PLUGGED_LABELS: Record<BridgePluggedType, string> = {
    ac: 'Cargador',
    usb: 'USB',
    wireless: 'Inalámbrico',
    other: 'Cargador',
};

/** What the phone is charging from, for the battery widget; null when not plugged in. */
export function pluggedLabel(pluggedType: BridgePluggedType | null): string | null
{
    return pluggedType ? PLUGGED_LABELS[pluggedType] : null;
}
