import { defineStore } from "pinia";
import { computed, toValue, watch, type MaybeRefOrGetter, type WritableComputedRef } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useHomeLayoutStore } from "./useHomeLayoutStore";
import { pruneWidgetData, type WidgetDataMap } from "@/utils/widgetData";

// Settings and content of widgets that have their own (a countdown's date, a note's text, a task list),
// keyed by the widget's home item id and kept in localStorage. Removing a widget drops its data.
export const useWidgetDataStore = defineStore('widgetData', () =>
{
    const layout = useHomeLayoutStore();
    const data = useLocalStorage<WidgetDataMap>('widgets.data', {});

    watch(() => layout.items, items =>
    {
        data.value = pruneWidgetData(data.value, items.filter(i => i.type === 'widget').map(i => i.id));
    }, { immediate: true });

    return {
        get: (id: string) => data.value[id],
        set: (id: string, value: unknown) => { data.value = { ...data.value, [id]: value }; },
    };
});

/**
 * One widget's data as a writable ref. Without an id (the previews in "Añadir"), it reads `preview`
 * and ignores writes, so previews show sample content and never store anything.
 */
export function useWidgetData<T>(
    widgetId: MaybeRefOrGetter<string | undefined>,
    empty: T,
    preview: T = empty): WritableComputedRef<T>
{
    const store = useWidgetDataStore();
    return computed({
        get: () =>
        {
            const id = toValue(widgetId);
            if (!id) return preview;
            return (store.get(id) as T | undefined) ?? empty;
        },
        set: value =>
        {
            const id = toValue(widgetId);
            if (id) store.set(id, value);
        },
    });
}
