import { bridgeHas } from "./bridge-utils";

/** Android API levels of the features that depend on the version (idea 13). */
export const API_LEVELS = {
    /** Bridge locks the screen through its accessibility service: Android 9. */
    lockScreen: 28,
    /** Bridge sets the system night mode (UiModeManager): Android 11. */
    setNightMode: 30,
} as const;

/** Whether `current` is at least `required`. An unknown level counts as supported, so nothing is hidden by mistake. */
export function meetsApiLevel(current: number | null, required: number): boolean
{
    return current === null || current >= required;
}

let cachedLevel: number | null | undefined;

/** The device's Android API level, or null if this Bridge can't tell. */
export function androidApiLevel(): number | null
{
    if (cachedLevel === undefined)
    {
        try
        {
            cachedLevel = bridgeHas('getAndroidAPILevel') ? Bridge.getAndroidAPILevel() : null;
        }
        catch
        {
            cachedLevel = null;
        }
    }
    return cachedLevel;
}

export function supportsApiLevel(required: number): boolean
{
    return meetsApiLevel(androidApiLevel(), required);
}
