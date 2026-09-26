import { describe, expect, it } from 'vitest';
import { formatInsets, RingLog, summarizeEvent, MAX_DETAIL_LENGTH } from '../diagnostics';

describe('summarizeEvent', () =>
{
    it('keeps the name apart and rounds the payload numbers', () =>
    {
        expect(summarizeEvent({ name: 'ImeWindowInsetsChanged', insets: { top: 0, bottom: 411.02222 } }, 5))
            .toEqual({ time: 5, name: 'ImeWindowInsetsChanged', detail: '{"insets":{"top":0,"bottom":411}}' });
    });

    it('has no detail for events without a payload', () =>
    {
        expect(summarizeEvent({ name: 'afterResume' }, 1).detail).toBe('');
    });

    it('cuts long payloads', () =>
    {
        const detail = summarizeEvent({ name: 'x', text: 'a'.repeat(200) }, 1).detail;
        expect(detail.length).toBe(MAX_DETAIL_LENGTH);
        expect(detail.endsWith('…')).toBe(true);
    });
});

describe('RingLog', () =>
{
    it('lists the entries newest first', () =>
    {
        const log = new RingLog<number>(3);
        log.push(1);
        log.push(2);
        expect(log.newestFirst()).toEqual([2, 1]);
    });

    it('keeps only the last entries once full', () =>
    {
        const log = new RingLog<number>(3);
        for (let i = 1; i <= 7; i++) log.push(i);
        expect(log.newestFirst()).toEqual([7, 6, 5]);
    });
});

describe('formatInsets', () =>
{
    it('lists top, right, bottom and left, rounded', () =>
    {
        expect(formatInsets({ top: 24.4, right: 0, bottom: 14.6, left: 0 })).toBe('24 0 15 0');
    });
});
