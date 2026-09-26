<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { monthGrid, monthGridStart, WEEKS_SHOWN } from './month-grid';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { dayKey, eventsByDay } from '@/utils/calendar-events';
import type { BridgeCalendarEvent } from '@/types/bridge-fork';

// The current month's grid (4x2), today circled in Gingerbread orange, with arrows to browse
// months. Tapping the month name returns to today. With our Bridge fork and calendar access,
// days with events get colored dots (up to 3), and tapping a day opens it in the calendar app.

// dots under a day, one per event color
const MAX_DOTS = 3;

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const now = useNow({ interval: 60_000 });

// months away from the current one
const offset = ref(0);

const shown = computed(() =>
{
    const d = new Date(now.value.getFullYear(), now.value.getMonth() + offset.value, 1);
    return { year: d.getFullYear(), month: d.getMonth(), date: d };
});

const title = computed(() => shown.value.date.toLocaleDateString('es', { month: 'long', year: 'numeric' }));

const days = computed(() => monthGrid(shown.value.year, shown.value.month, now.value));

const calendar = useCalendarStore();
const gridStart = computed(() => monthGridStart(shown.value.year, shown.value.month));
const events = ref<BridgeCalendarEvent[]>([]);

// the events of the 6 weeks shown, fetched again when the month or the events change
watch([gridStart, () => calendar.version, () => calendar.canRead], async () =>
{
    const start = gridStart.value;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + WEEKS_SHOWN * 7);
    const fetched = await calendar.fetchEvents(start, end);
    if (start === gridStart.value)
        events.value = fetched;
}, { immediate: true });

const byDay = computed(() => eventsByDay(events.value));

function dateAt(index: number)
{
    const s = gridStart.value;
    return new Date(s.getFullYear(), s.getMonth(), s.getDate() + index);
}

function dotColors(index: number)
{
    const dayEvents = byDay.value.get(dayKey(dateAt(index))) ?? [];
    return [...new Set(dayEvents.map(e => e.color ?? '#ffffff'))].slice(0, MAX_DOTS);
}

function onDayClick(index: number)
{
    if (calendar.isSupported)
        calendar.openDay(dateAt(index));
}

</script>

<template>
    <div class="calendar-widget">
        <header>
            <button class="arrow" aria-label="Mes anterior" @click="offset--">‹</button>
            <button class="title" :class="{ away: offset !== 0 }" @click="offset = 0">{{ title }}</button>
            <button class="arrow" aria-label="Mes siguiente" @click="offset++">›</button>
        </header>

        <div class="grid">
            <span v-for="w in WEEKDAYS" :key="w" class="weekday">{{ w }}</span>
            <button
                v-for="(d, i) in days"
                :key="i"
                class="day"
                :class="{ out: !d.inMonth, today: d.isToday }"
                @click="onDayClick(i)">
                {{ d.day }}
                <span v-if="dotColors(i).length" class="dots">
                    <span v-for="c in dotColors(i)" :key="c" class="dot" :style="{ backgroundColor: c }"></span>
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// Songbird's look: a gray frame, the month on a dark bar between glossy arrows, the days recessed below
.calendar-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-shadow: inherit;
        cursor: pointer;

        &:active {
            color: $gingerbread-orange;
        }
    }

    > header {
        @include gb-widget-bar;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        > .arrow {
            @include gb-widget-button;
            width: 40px;
            height: 28px;
            font-size: 22px;
            line-height: 1;

            &:first-child {
                border-right: 1px solid #111;
            }

            &:last-child {
                border-left: 1px solid #111;
            }
        }

        > .title {
            font-size: 16px;
            font-weight: bold;
            text-transform: capitalize;

            // browsing another month: the title reads as "go back to today"
            &.away {
                color: $gingerbread-orange;
            }
        }
    }

    > .grid {
        @include gb-widget-inset;
        flex: 1;
        min-height: 0;
        padding: 2px 2px 4px;
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: auto repeat(6, 1fr);
        align-items: center;
        justify-items: center;
        font-size: 13px;

        > .weekday {
            padding-bottom: 2px;
            color: rgba(#fff, 0.6);
            font-size: 11px;
            font-weight: bold;
        }

        > .day {
            position: relative;
            display: grid;
            place-items: center;
            width: 1.9em;
            height: 1.9em;
            padding: 0;
            border-radius: 50%;
            font-size: inherit;

            > .dots {
                position: absolute;
                left: 50%;
                bottom: -2px;
                display: flex;
                gap: 2px;
                transform: translateX(-50%);

                > .dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    box-shadow: 0 0 1px #000;
                }
            }

            &.out {
                color: rgba(#fff, 0.3);
            }

            &.today {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
                font-weight: bold;
                text-shadow: none;
            }
        }
    }
}
</style>
