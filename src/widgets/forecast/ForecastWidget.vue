<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { describeWeatherCode } from '@/widgets/weather/weather-codes';
import WeatherIcon from '@/widgets/weather/WeatherIcon.vue';

// The next days' weather (4x2) for the weather widget's city, from the same Open-Meteo request: weekday,
// icon, high and low. Tapping it refreshes.

const DAYS_SHOWN = 5;

const weather = useWeatherStore();

const weekday = new Intl.DateTimeFormat('es', { weekday: 'short' });
const days = computed(() => (weather.data?.days ?? []).slice(0, DAYS_SHOWN).map((d, i) =>
{
    // "YYYY-MM-DD" as a local date, at noon so no time zone shifts it to another day
    const [y, m, day] = d.date.split('-').map(Number);
    const label = i === 0 ? 'Hoy' : weekday.format(new Date(y, m - 1, day, 12)).replace('.', '');
    return { ...d, label, kind: describeWeatherCode(d.code).kind };
}));
</script>

<template>
    <button class="forecast-widget" @click="weather.refreshAsync()">
        <template v-if="weather.city && days.length > 0">
            <div class="city">Pronóstico · {{ weather.city.name }}</div>
            <div class="days">
                <div v-for="d in days" :key="d.date" class="day">
                    <span class="label">{{ d.label }}</span>
                    <WeatherIcon class="icon" :kind="d.kind" :is-day="true" />
                    <span class="max">{{ Math.round(d.max) }}°</span>
                    <span class="min">{{ Math.round(d.min) }}°</span>
                </div>
            </div>
        </template>
        <span v-else-if="!weather.city" class="empty">Elige tu ciudad en el widget del tiempo</span>
        <span v-else class="empty">{{ weather.status === 'error' ? weather.errorMessage : 'Cargando el pronóstico…' }}</span>
    </button>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the city on a dark bar and the days recessed below
.forecast-widget {
    @include gb-widget-frame;
    appearance: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    font: inherit;
    text-shadow: 0 1px 1px #000;
    cursor: pointer;

    > .city {
        @include gb-widget-bar;
        padding: 3px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font-size: 13px;
        font-weight: bold;
        text-align: left;
    }

    &:active > .city {
        @include gb-pressed;
    }

    > .days {
        @include gb-widget-inset;
        flex: 1;
        display: grid;
        grid-template-columns: repeat(5, 1fr);

        > .day {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;

            & + .day {
                border-left: 1px solid #111;
                box-shadow: inset 1px 0 0 rgba(#fff, 0.06);
            }

            > .label {
                font-size: 12px;
                text-transform: capitalize;
                opacity: 0.85;
            }

            > .icon {
                width: 44px;
                height: 44px;
            }

            > .max {
                font-size: 16px;
            }

            > .min {
                font-size: 13px;
                opacity: 0.6;
            }
        }
    }

    > .empty {
        @include gb-widget-inset;
        flex: 1;
        display: grid;
        place-items: center;
        padding: 8px;
        font-size: 13px;
        color: #ccc;
    }
}
</style>
