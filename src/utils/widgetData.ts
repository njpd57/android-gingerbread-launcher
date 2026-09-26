/** Per-widget settings and content, keyed by the widget's home item id. */
export type WidgetDataMap = Record<string, unknown>;

/** Drops the entries of widgets that are no longer on the home screen; returns the same map if nothing changed. */
export function pruneWidgetData(data: WidgetDataMap, widgetIds: Iterable<string>): WidgetDataMap
{
    const keep = new Set(widgetIds);
    const stale = Object.keys(data).filter(id => !keep.has(id));
    if (stale.length === 0) return data;
    const next = { ...data };
    for (const id of stale)
        delete next[id];
    return next;
}
