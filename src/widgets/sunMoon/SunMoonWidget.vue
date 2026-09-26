<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { moonIllumination, moonLitPath, moonPhase, moonPhaseName } from '@/utils/moon';

// Sunrise and sunset (from the weather widget's city, Open-Meteo) and the moon's phase, computed from the
// date (2x1). The moon is drawn as seen from the city's hemisphere: mirrored in the south.

const weather = useWeatherStore();
const now = useNow({ interval: 60 * 60_000 });

const phase = computed(() => moonPhase(now.value));
const litPath = computed(() => moonLitPath(phase.value, 20, 20, 17));
const southern = computed(() => (weather.city?.latitude ?? 0) < 0);
const illumination = computed(() => Math.round(moonIllumination(phase.value) * 100));

// "2026-09-25T07:12" → "07:12"; the times are already in the city's time zone
const today = computed(() => weather.data?.days?.[0] ?? null);
const time = (iso: string) => iso.slice(11, 16);
</script>

<template>
    <div class="sun-moon-widget">
        <div class="sky">
            <svg class="moon" viewBox="0 0 40 40" :aria-label="moonPhaseName(phase)">
                <circle cx="20" cy="20" r="17" class="dark" />
                <path :d="litPath" class="lit" :transform="southern ? 'translate(40 0) scale(-1 1)' : undefined" />
            </svg>
        </div>
        <div class="info">
            <div class="phase">{{ moonPhaseName(phase) }} <small>{{ illumination }} %</small></div>
            <div v-if="today" class="sun">
                <span>☀↑ {{ time(today.sunrise) }}</span>
                <span>☀↓ {{ time(today.sunset) }}</span>
            </div>
            <div v-else class="hint">Elige tu ciudad en el widget del tiempo para ver el sol</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the moon in a recessed night-sky window, the details beside it
.sun-moon-widget {
    @include gb-widget-frame;
    display: flex;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    > .sky {
        @include gb-widget-inset;
        flex-shrink: 0;
        display: grid;
        place-items: center;
        height: 100%;
        aspect-ratio: 1;
        background: radial-gradient(circle at 50% 40%, #1d2b4a, #070b16 75%);

        > .moon {
            width: 78%;
            height: 78%;
            filter: drop-shadow(0 0 4px rgba(#fff8d0, 0.35));

            > .dark {
                fill: #2a2d38;
            }

            > .lit {
                fill: #f3f0dc;
            }
        }
    }

    > .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        > .phase {
            @include gb-widget-bar;
            padding: 3px 6px;
            overflow: hidden;
            font-size: 12px;
            font-weight: bold;
            text-overflow: ellipsis;
            white-space: nowrap;

            > small {
                font-weight: normal;
                color: #bdbdbd;
            }
        }

        > .sun,
        > .hint {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2px 6px;
            background: linear-gradient(to bottom, #1c1c1c, #262626);
        }

        > .sun {
            font-size: 12px;
            color: #ffd54f;
        }

        > .hint {
            font-size: 10px;
            color: #bbb;
        }
    }
}
</style>
