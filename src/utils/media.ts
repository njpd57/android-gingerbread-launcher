import type { BridgeMediaSession } from "@/types/bridge-fork";

/** Where playback is at `nowMs`: Bridge reports the position at a moment, and it keeps advancing while playing. */
export function mediaPosition(session: BridgeMediaSession, nowMs: number): number | null
{
    if (session.positionMs === null) return null;

    const elapsed = session.state === 'playing'
        ? Math.max(0, nowMs - session.positionUpdatedAt) * session.playbackSpeed
        : 0;
    const position = session.positionMs + elapsed;

    return session.durationMs !== null ? Math.min(position, session.durationMs) : position;
}

/** "3:07", or "1:02:03" for an hour or more. */
export function formatMediaTime(ms: number): string
{
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor(totalSeconds / 60) % 60;
    const s = String(totalSeconds % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
