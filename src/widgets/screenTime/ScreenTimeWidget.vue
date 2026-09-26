<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { useUsageStore } from '@/stores/useUsageStore';
import { useAppsStore } from '@/stores/useAppsStore';
import { formatDuration, topAppsByTime, totalScreenTime } from '@/utils/usage';
import type { BridgeAppUsage } from '@/types/bridge-fork';

// Today's screen time (4x1): the total on the left, and the 3 apps used longest today with their time.
// Needs our Bridge fork and "Usage access" (tapping the widget without it opens that setting).

const TOP_APPS = 3;

const usageStore = useUsageStore();
const apps = useAppsStore();
const now = useNow({ interval: 60_000 });

const usage = ref<BridgeAppUsage[]>([]);
const today = computed(() => now.value.toDateString());

watch([today, () => usageStore.version, () => usageStore.canRead], async () =>
{
    const n = new Date();
    usage.value = await usageStore.fetchUsage(new Date(n.getFullYear(), n.getMonth(), n.getDate()), n);
}, { immediate: true });

const isInstalled = (p: string) => apps.apps.has(p);
const total = computed(() => totalScreenTime(usage.value, isInstalled));
const top = computed(() => topAppsByTime(usage.value, isInstalled, TOP_APPS));

const message = computed(() =>
{
    if (!usageStore.isSupported) return 'Tu versión de Bridge no puede leer el uso de las apps.';
    if (!usageStore.canRead) return 'Toca para permitir el acceso a los datos de uso.';
    return null;
});

function onClick()
{
    if (usageStore.isSupported && !usageStore.canRead)
        usageStore.requestAccess();
}
</script>

<template>
    <div class="screen-time-widget">
        <button class="bar" @click="onClick">
            <span class="label">Tiempo en pantalla</span>
            <span v-if="!message" class="value">{{ formatDuration(total) }}</span>
        </button>

        <div class="content" @click="onClick">
            <div v-if="message" class="message">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                    <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.5" />
                    <path d="M16 9v8l5 3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                </svg>
                <span>{{ message }}</span>
            </div>

            <div v-else class="apps">
                <div v-for="u in top" :key="u.packageName" class="app">
                    <img :src="Bridge.getDefaultAppIconURL(u.packageName)" alt="" draggable="false" />
                    <span class="time">{{ formatDuration(u.totalTimeMs) }}</span>
                </div>
                <span v-if="top.length === 0" class="empty">Todavía no usaste apps hoy.</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the total on a dark bar, the top apps recessed below
.screen-time-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    > .bar {
        @include gb-widget-bar;
        appearance: none;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        padding: 3px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font: inherit;
        cursor: pointer;

        &:active {
            @include gb-pressed;
        }

        > .label {
            font-size: 12px;
            text-transform: uppercase;
        }

        > .value {
            font-size: 16px;
            font-weight: bold;
            white-space: nowrap;
        }
    }

    > .content {
        @include gb-widget-inset;
        flex: 1;
        min-height: 0;
        cursor: pointer;

        > .message {
            display: flex;
            align-items: center;
            gap: 12px;
            height: 100%;
            padding: 4px 10px;
            font-size: 13px;
            color: #ccc;

            > svg {
                flex-shrink: 0;
                width: 26px;
                height: 26px;
            }
        }

        > .apps {
            display: flex;
            justify-content: space-around;
            align-items: center;
            height: 100%;
            padding: 4px 10px;

            > .app {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;

                > img {
                    width: 32px;
                    height: 32px;
                }

                > .time {
                    font-size: 11px;
                    color: #ccc;
                    white-space: nowrap;
                }
            }

            > .empty {
                font-size: 13px;
                color: #ccc;
            }
        }
    }
}
</style>
