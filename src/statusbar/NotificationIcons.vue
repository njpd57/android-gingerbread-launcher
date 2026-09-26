<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useNow } from '@vueuse/core';

// Without notification access (or on stock Bridge), these are decorative Gingerbread notification icons,
// with a bit of life: today's date on the calendar, USB icons while plugged into USB, and an occasional download.

const props = defineProps<{
    usb: boolean;
}>();

// an occasional "Market download": every 1-3 minutes, for 10-20 seconds
const DOWNLOAD_EVERY_MIN_MS = 60_000;
const DOWNLOAD_EVERY_MAX_MS = 180_000;
const DOWNLOAD_FOR_MIN_MS = 10_000;
const DOWNLOAD_FOR_MAX_MS = 20_000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const now = useNow({ interval: 60_000 });
const day = computed(() => now.value.getDate());

const downloading = ref(false);
let downloadTimer = 0;

function scheduleDownload()
{
    downloadTimer = window.setTimeout(() =>
    {
        downloading.value = true;
        downloadTimer = window.setTimeout(() =>
        {
            downloading.value = false;
            scheduleDownload();
        }, rand(DOWNLOAD_FOR_MIN_MS, DOWNLOAD_FOR_MAX_MS));
    }, rand(DOWNLOAD_EVERY_MIN_MS, DOWNLOAD_EVERY_MAX_MS));
}

scheduleDownload();
onBeforeUnmount(() => clearTimeout(downloadTimer));

</script>

<template>
    <div class="notification-icons">
        <!-- Gmail: envelope with the "M" fold -->
        <svg class="icon" viewBox="0 0 20 18" aria-hidden="true">
            <rect x="1" y="3" width="18" height="12" rx="1" class="solid" />
            <path d="M2.5 4.5l7.5 6 7.5-6" class="stroke" />
        </svg>

        <!-- Calendar: today's day of the month -->
        <svg class="icon" viewBox="0 0 16 18" aria-hidden="true">
            <rect x="1" y="2" width="14" height="15" rx="1.5" class="solid" />
            <rect x="1" y="2" width="14" height="4" rx="1.5" class="accent" />
            <text x="8" y="15" text-anchor="middle" class="day">{{ day }}</text>
        </svg>

        <!-- USB connected: the trident -->
        <svg v-if="props.usb" class="icon" viewBox="0 0 16 18" aria-hidden="true">
            <path d="M8 1v16M8 12L3.5 8.5V6M8 9.5l4.5-2.5V5" class="stroke" />
            <path d="M6 3.5L8 0.5l2 3z" class="solid" />
            <circle cx="3.5" cy="5" r="1.5" class="solid" />
            <rect x="11" y="3" width="3" height="3" class="solid" />
            <circle cx="8" cy="16" r="1.8" class="solid" />
        </svg>

        <!-- USB debugging: the Android robot -->
        <svg v-if="props.usb" class="icon" viewBox="0 0 16 18" aria-hidden="true">
            <path d="M3 8a5 5 0 0 1 10 0z" class="solid" />
            <path d="M5 3.5L4 2M11 3.5l1-1.5" class="stroke" />
            <rect x="3" y="9" width="10" height="6" rx="1" class="solid" />
            <rect x="0.5" y="9" width="2" height="5" rx="1" class="solid" />
            <rect x="13.5" y="9" width="2" height="5" rx="1" class="solid" />
            <rect x="5" y="14" width="2" height="3.5" rx="1" class="solid" />
            <rect x="9" y="14" width="2" height="3.5" rx="1" class="solid" />
        </svg>

        <!-- download in progress: an arrow sliding into a tray -->
        <svg v-if="downloading" class="icon download" viewBox="0 0 16 18" aria-hidden="true">
            <clipPath id="download-clip">
                <rect x="0" y="0" width="16" height="13" />
            </clipPath>
            <g clip-path="url(#download-clip)">
                <path d="M6.5 0v5H3.5L8 10l4.5-5h-3V0z" class="solid arrow" />
            </g>
            <path d="M1.5 13v3.5h13V13" class="stroke" />
        </svg>
    </div>
</template>

<style scoped lang="scss">
.notification-icons {
    display: flex;
    align-items: center;
    gap: 5px;
    // light bars override this through the parent's `color`
    color: #cfcfcf;

    > .icon {
        width: auto;
        height: 16px;

        .solid {
            fill: currentColor;
        }

        .stroke {
            fill: none;
            stroke: currentColor;
            stroke-width: 1.6;
            stroke-linecap: round;
            stroke-linejoin: round;
        }

        // the envelope's fold is drawn in the bar's background color
        rect.solid + .stroke {
            stroke: #222;
        }

        .accent {
            fill: #d33;
        }

        .day {
            font-family: "Droid Sans", sans-serif;
            font-weight: bold;
            font-size: 8px;
            fill: #222;
        }

        &.download .arrow {
            animation: download-slide 1.1s linear infinite;
        }
    }
}

@keyframes download-slide {
    from {
        transform: translateY(-8px);
    }

    to {
        transform: translateY(6px);
    }
}
</style>
