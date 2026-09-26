import { describe, expect, it } from 'vitest';
import { formatMediaTime, mediaPosition } from '../media';
import type { BridgeMediaSession } from '@/types/bridge-fork';

function session(extra: Partial<BridgeMediaSession>): BridgeMediaSession
{
    return {
        packageName: 'com.music', title: 'Song', artist: null, album: null, state: 'playing',
        durationMs: 200_000, positionMs: 10_000, positionUpdatedAt: 1_000_000, playbackSpeed: 1,
        hasArt: false, artVersion: 1, canSkipToNext: true, canSkipToPrevious: true,
        ...extra,
    };
}

describe('mediaPosition', () =>
{
    it('advances with time while playing', () =>
    {
        expect(mediaPosition(session({}), 1_005_000)).toBe(15_000);
    });

    it('takes the playback speed into account', () =>
    {
        expect(mediaPosition(session({ playbackSpeed: 2 }), 1_005_000)).toBe(20_000);
    });

    it('stays put while paused', () =>
    {
        expect(mediaPosition(session({ state: 'paused' }), 1_005_000)).toBe(10_000);
    });

    it('never passes the duration', () =>
    {
        expect(mediaPosition(session({}), 9_000_000)).toBe(200_000);
    });

    it('is null when the app does not report a position', () =>
    {
        expect(mediaPosition(session({ positionMs: null }), 1_005_000)).toBeNull();
    });
});

describe('formatMediaTime', () =>
{
    it('shows minutes and seconds', () =>
    {
        expect(formatMediaTime(187_400)).toBe('3:07');
        expect(formatMediaTime(0)).toBe('0:00');
    });

    it('shows hours for long tracks', () =>
    {
        expect(formatMediaTime(3_723_000)).toBe('1:02:03');
    });
});
