<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { useAlarmStore } from '@/stores/useAlarmStore';
import { formatClockTime } from '@/utils/clock';

// Big digital time with the date underneath, like the Android 2.x lock screen clock
// (Clockopia digits, 12-hour with a small AM/PM, like the Gingerbread status bar).

const now = useNow({ interval: 1000 });

const time = computed(() =>
{
    const h = now.value.getHours();
    const m = now.value.getMinutes();
    return {
        hm: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`,
        ampm: h < 12 ? 'AM' : 'PM',
    };
});

// "jueves, 25 de septiembre" -> "Jueves, 25 de septiembre"
const date = computed(() =>
{
    const s = now.value.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
});

// tapping the clock opens a clock app, like Gingerbread's alarm app; long-pressing still drags it
// (HomeGrid discards the click that ends a long press before it reaches us)
const alarm = useAlarmStore();

function openClockApp()
{
    alarm.openAlarms();
}

// the next alarm next to the date, like the Android 2.x lock screen ("7:00 AM"); needs our Bridge fork
const nextAlarm = computed(() => alarm.nextAlarm ? formatClockTime(new Date(alarm.nextAlarm.triggerTime)) : null);
</script>

<template>
    <div class="digital-clock" @click="openClockApp">
        <div class="time">
            <span class="hm">{{ time.hm }}</span>
            <span class="ampm">{{ time.ampm }}</span>
        </div>
        <div class="date">
            <span>{{ date }}</span>
            <span v-if="nextAlarm" class="alarm">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6" />
                    <path d="M8 6v3.2l2 1.3M2 4l2.5-2M14 4l-2.5-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                {{ nextAlarm }}
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.digital-clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    color: #fff;
    text-shadow: 0 2px 4px rgba(#000, 0.8);
    cursor: pointer;

    > .time {
        display: flex;
        align-items: baseline;
        gap: 6px;
        line-height: 1;

        > .hm {
            font-family: "Clockopia", "Droid Sans", sans-serif;
            font-size: 64px;
        }

        > .ampm {
            font-family: "Droid Sans", sans-serif;
            font-weight: bold;
            font-size: 18px;
        }
    }

    > .date {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        color: rgba(#fff, 0.9);

        > .alarm {
            display: flex;
            align-items: center;
            gap: 3px;
            font-size: 14px;

            > svg {
                width: 13px;
                height: 13px;
            }
        }
    }
}
</style>
