import type { BridgeScreenBrightness } from "@/types/bridge-fork";

// Gingerbread's power control widget cycled brightness through these steps
export type BrightnessStep = 'auto' | 'low' | 'mid' | 'high';

export const BRIGHTNESS_LEVELS: Record<Exclude<BrightnessStep, 'auto'>, number> = {
    low: 0.1,
    mid: 0.5,
    high: 1,
};

const CYCLE: BrightnessStep[] = ['auto', 'low', 'mid', 'high'];

/** The step closest to the current brightness, which may have been set with the system slider. */
export function brightnessStep(brightness: BridgeScreenBrightness): BrightnessStep
{
    if (brightness.isAuto) return 'auto';
    if (brightness.level < (BRIGHTNESS_LEVELS.low + BRIGHTNESS_LEVELS.mid) / 2) return 'low';
    if (brightness.level < (BRIGHTNESS_LEVELS.mid + BRIGHTNESS_LEVELS.high) / 2) return 'mid';
    return 'high';
}

export function nextBrightnessStep(step: BrightnessStep): BrightnessStep
{
    return CYCLE[(CYCLE.indexOf(step) + 1) % CYCLE.length];
}
