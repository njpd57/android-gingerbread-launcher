import { describe, expect, it } from 'vitest';
import { pruneWidgetData } from '../widgetData';

describe('pruneWidgetData', () =>
{
    it('drops the data of removed widgets', () =>
    {
        expect(pruneWidgetData({ a: 1, b: 2 }, ['a'])).toEqual({ a: 1 });
    });

    it('returns the same object when every widget is still there', () =>
    {
        const data = { a: 1 };
        expect(pruneWidgetData(data, ['a', 'c'])).toBe(data);
    });
});
