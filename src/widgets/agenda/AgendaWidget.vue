<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { agendaDays, formatEventTime } from '@/utils/calendar-events';
import type { BridgeCalendarEvent } from '@/types/bridge-fork';

// Upcoming calendar events (4x2), after Android 2.x's calendar widget: today's weekday and date on top,
// then the next events grouped by day, each with its calendar's color, time and title. Needs our Bridge
// fork and calendar access (asked with Android's dialog from here). Tapping an event opens it; tapping
// the date opens the calendar app on today.

// how far ahead to look, and how many rows fit in 4x2
const DAYS_AHEAD = 14;
const MAX_ROWS = 5;

const calendar = useCalendarStore();
const now = useNow({ interval: 60_000 });

const events = ref<BridgeCalendarEvent[]>([]);
const todayKey = computed(() => now.value.toDateString());

watch([todayKey, () => calendar.version, () => calendar.canRead], async () =>
{
    const start = new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + DAYS_AHEAD);
    events.value = await calendar.fetchEvents(start, end);
}, { immediate: true });

// day headers count as rows too; whatever doesn't fit is summed up at the bottom
const layout = computed(() =>
{
    const rows: ({ kind: 'day'; key: string; label: string } | { kind: 'event'; key: string; event: BridgeCalendarEvent })[] = [];
    let hidden = 0;
    for (const day of agendaDays(events.value, now.value, DAYS_AHEAD))
    {
        for (const [i, e] of day.events.entries())
        {
            const needed = i === 0 ? 2 : 1;
            if (rows.length + needed > MAX_ROWS)
            {
                hidden++;
                continue;
            }
            if (i === 0) rows.push({ kind: 'day', key: day.key, label: day.label });
            rows.push({ kind: 'event', key: `${day.key}-${e.eventId}-${e.begin}`, event: e });
        }
    }
    return { rows, hidden };
});

const weekday = computed(() => now.value.toLocaleDateString('es', { weekday: 'long' }));
const monthDay = computed(() => now.value.toLocaleDateString('es', { month: 'short' }).replace('.', ''));

const message = computed(() =>
{
    if (!calendar.isSupported) return 'Tu versión de Bridge no puede leer el calendario.';
    if (!calendar.canRead) return 'Toca para permitir el acceso al calendario.';
    if (layout.value.rows.length === 0) return `Sin eventos en los próximos ${DAYS_AHEAD} días.`;
    return null;
});

function onMessageClick()
{
    if (calendar.isSupported && !calendar.canRead)
        calendar.requestAccess();
}

function openToday()
{
    if (calendar.isSupported)
        calendar.openDay(now.value);
}
</script>

<template>
    <div class="agenda-widget">
        <button class="date" aria-label="Abrir el calendario" @click="openToday">
            <span class="weekday">{{ weekday }}</span>
            <span class="day">{{ now.getDate() }}</span>
            <span class="month">{{ monthDay }}</span>
        </button>

        <div class="list">
            <button v-if="message" class="message" @click="onMessageClick">{{ message }}</button>

            <template v-else>
                <template v-for="row in layout.rows" :key="row.key">
                    <div v-if="row.kind === 'day'" class="day-label">{{ row.label }}</div>
                    <button v-else class="event" @click="calendar.openEvent(row.event)">
                        <span class="color" :style="{ backgroundColor: row.event.color ?? '#ffffff' }"></span>
                        <span class="time">{{ formatEventTime(row.event) }}</span>
                        <span class="title">{{ row.event.title || '(Sin título)' }}</span>
                    </button>
                </template>
                <div v-if="layout.hidden > 0" class="more">y {{ layout.hidden }} más</div>
            </template>
        </div>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// Songbird's look: a gray frame, today's date on a glossy block (like its buttons), the events recessed
.agenda-widget {
    @include gb-widget-frame;
    display: flex;
    gap: 5px;
    height: 100%;
    padding: 5px;
    overflow: hidden;
    text-shadow: 0 1px 1px #000;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        text-shadow: inherit;
        cursor: pointer;
    }

    // Android 2.x's calendar widget: the weekday over a big date number
    > .date {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 76px;
        padding: 0;
        @include gb-widget-button;
        border: 1px solid #111;
        border-radius: 4px;
        text-align: center;

        > .weekday {
            font-size: 13px;
            text-transform: capitalize;
            color: rgba(#fff, 0.8);
        }

        > .day {
            font-size: 44px;
            font-weight: bold;
            line-height: 1.05;
        }

        > .month {
            font-size: 13px;
            text-transform: uppercase;
            color: $gingerbread-orange;
        }

        // pressed, the whole block turns orange (from the mixin): keep every line readable on it
        &:active > * {
            color: #111;
        }
    }

    > .list {
        @include gb-widget-inset;
        flex: 1;
        min-width: 0;
        padding: 4px 8px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;

        > .message {
            padding: 0;
            color: rgba(#fff, 0.8);
            font-size: 14px;
        }

        > .day-label {
            margin-top: 2px;
            font-size: 12px;
            font-weight: bold;
            text-transform: capitalize;
            color: $gingerbread-orange;

            &:first-child {
                margin-top: 0;
            }
        }

        > .event {
            display: flex;
            align-items: center;
            gap: 6px;
            min-height: 22px;
            padding: 0;
            font-size: 14px;

            > .color {
                flex-shrink: 0;
                width: 4px;
                height: 16px;
                border-radius: 2px;
                box-shadow: 0 0 1px #000;
            }

            > .time {
                flex-shrink: 0;
                color: rgba(#fff, 0.75);
                font-size: 12px;
            }

            > .title {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &:active > .title {
                color: $gingerbread-orange;
            }
        }

        > .more {
            font-size: 12px;
            color: rgba(#fff, 0.6);
        }
    }
}
</style>
