import type { BridgeDataActivity } from "@/types/bridge-fork";

/** Android's Wi-Fi level (0 to 4) as Gingerbread's 3 arcs. */
export function wifiArcs(level: number | null): number
{
    return level === null ? 0 : Math.round(level * 3 / 4);
}

/** Which of the status bar's data activity arrows are lit. */
export function dataActivityArrows(activity: BridgeDataActivity): { in: boolean; out: boolean }
{
    return {
        in: activity === 'in' || activity === 'inout',
        out: activity === 'out' || activity === 'inout',
    };
}
