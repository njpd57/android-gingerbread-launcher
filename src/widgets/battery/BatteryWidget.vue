<script setup lang="ts">
import { computed } from 'vue';
import { useBatteryStore } from '@/stores/useBatteryStore';
import { pluggedLabel } from '@/utils/battery';

// A 1x1 battery gauge in Gingerbread colors: green, yellow when getting low, red when low,
// with a bolt while charging. The level comes from our Bridge fork, or the web Battery API on stock
// Bridge; with the fork it also says what it's charging from (USB, charger, wireless).

const battery = useBatteryStore();

const level = computed(() => battery.level);
const percent = computed(() => level.value === null ? null : Math.round(level.value * 100));

const state = computed(() =>
{
    if (level.value === null) return 'unknown';
    if (level.value <= 0.15) return 'low';
    if (level.value <= 0.3) return 'medium';
    return 'ok';
});

// inner fill area of the icon: y from 9 to 45 (36 units tall)
const fillHeight = computed(() => Math.max(2, Math.round((level.value ?? 0) * 36)));

</script>

<template>
    <div class="battery-widget" :class="state">
        <svg viewBox="0 0 32 48" aria-hidden="true">
            <defs>
                <linearGradient id="battery-shell" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stop-color="#9a9a9a" />
                    <stop offset="0.5" stop-color="#e8e8e8" />
                    <stop offset="1" stop-color="#8a8a8a" />
                </linearGradient>
            </defs>
            <rect x="11" y="1" width="10" height="5" rx="1" fill="url(#battery-shell)" />
            <rect x="3" y="5" width="26" height="42" rx="3" fill="#1c1c1c" stroke="url(#battery-shell)" stroke-width="3" />
            <rect class="fill" x="7" :y="45 - fillHeight" width="18" :height="fillHeight" rx="1" />
            <path v-if="battery.charging" class="bolt" d="M18.5 14l-8 13h5.5l-2 11 8-14h-5.5z" />
        </svg>
        <span class="label">{{ percent === null ? '—' : `${percent} %` }}</span>
        <span v-if="battery.charging && pluggedLabel(battery.pluggedType)" class="plugged">{{ pluggedLabel(battery.pluggedType) }}</span>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;

.battery-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    > svg {
        width: 34px;
        height: 51px;
        filter: drop-shadow(0 2px 2px rgba(#000, 0.6));

        > .fill {
            fill: $gb-green;
        }

        > .bolt {
            fill: #fff;
            stroke: #333;
            stroke-width: 0.8;
        }
    }

    &.medium > svg > .fill {
        fill: #ffd21f;
    }

    &.low > svg > .fill {
        fill: #e53935;
    }

    &.unknown > svg > .fill {
        fill: #555;
    }

    // same bubble as the shortcut labels
    > .label {
        padding: 1px 6px;
        border-radius: 6px;
        background-color: rgba(#000, 0.45);
        font-size: 12px;
        line-height: 1.3;
        white-space: nowrap;
    }

    > .plugged {
        margin-top: -3px;
        font-size: 10px;
        line-height: 1.2;
        white-space: nowrap;
        text-shadow: 0 1px 2px #000;
    }
}
</style>
