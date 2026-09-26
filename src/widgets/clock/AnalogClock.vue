<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { useAlarmStore } from '@/stores/useAlarmStore';

const now = useNow({ interval: 1000 });

// tapping the clock opens a clock app, like Gingerbread's alarm app; long-pressing still drags it
// (HomeGrid discards the click that ends a long press before it reaches us)
const alarm = useAlarmStore();

function openClockApp()
{
    alarm.openAlarms();
}

const hourAngle = computed(() =>
{
    const n = now.value;
    return (n.getHours() % 12 + n.getMinutes() / 60) * 30;
});

const minuteAngle = computed(() =>
{
    const n = now.value;
    return (n.getMinutes() + n.getSeconds() / 60) * 6;
});

const ticks = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    major: i % 3 === 0,
}));

</script>

<template>
    <svg
        class="analog-clock"
        viewBox="0 0 200 200"
        role="img"
        :aria-label="now.toLocaleTimeString()"
        @click="openClockApp">
        <defs>
            <radialGradient id="clock-face" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset="0.7" stop-color="#e4e4e4" />
                <stop offset="1" stop-color="#bdbdbd" />
            </radialGradient>
            <linearGradient id="clock-rim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#8a8a8a" />
                <stop offset="1" stop-color="#2e2e2e" />
            </linearGradient>
        </defs>

        <circle cx="100" cy="100" r="95" fill="url(#clock-rim)" />
        <circle cx="100" cy="100" r="89" fill="url(#clock-face)" />

        <!-- hour marks -->
        <line
            v-for="t in ticks"
            :key="t.angle"
            x1="100"
            :y1="t.major ? 18 : 22"
            x2="100"
            y2="30"
            stroke="#3a3a3a"
            :stroke-width="t.major ? 5 : 2.5"
            stroke-linecap="round"
            :transform="`rotate(${t.angle} 100 100)`" />

        <!-- little Android head below the center -->
        <g transform="translate(100 140)" fill="#a4c639" opacity="0.75">
            <path d="M-12 4a12 12 0 0 1 24 0z" />
            <line x1="-7" y1="-9" x2="-10" y2="-14" stroke="#a4c639" stroke-width="1.6" stroke-linecap="round" />
            <line x1="7" y1="-9" x2="10" y2="-14" stroke="#a4c639" stroke-width="1.6" stroke-linecap="round" />
            <circle cx="-5" cy="-2" r="1.4" fill="#e8e8e8" />
            <circle cx="5" cy="-2" r="1.4" fill="#e8e8e8" />
        </g>

        <!-- hands -->
        <g class="hands" filter="drop-shadow(1px 2px 1.5px rgba(0,0,0,0.35))">
            <line
                x1="100" y1="112" x2="100" y2="52"
                stroke="#2a2a2a" stroke-width="7" stroke-linecap="round"
                :transform="`rotate(${hourAngle} 100 100)`" />
            <line
                x1="100" y1="114" x2="100" y2="26"
                stroke="#2a2a2a" stroke-width="4" stroke-linecap="round"
                :transform="`rotate(${minuteAngle} 100 100)`" />
            <circle cx="100" cy="100" r="5" fill="#2a2a2a" />
        </g>
    </svg>
</template>

<style scoped lang="scss">
.analog-clock {
    display: block;
    width: 100%;
    height: auto;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
    cursor: pointer;
}
</style>
