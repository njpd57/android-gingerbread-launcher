import { defineStore } from "pinia";
import { ref } from "vue";
import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";

export interface WeatherCity
{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
}

/** One day of the forecast; `date` is "YYYY-MM-DD" and the sun times "YYYY-MM-DDTHH:mm", both in the city's time. */
export interface WeatherDay
{
    date: string;
    code: number;
    max: number;
    min: number;
    sunrise: string;
    sunset: string;
}

export interface WeatherData
{
    temperature: number;
    code: number;
    isDay: boolean;
    max: number;
    min: number;
    /** Today and the next days, for the forecast and sun widgets (missing in data cached by older versions). */
    days?: WeatherDay[];
    fetchedAt: number;
}

// today plus 5 days, for the extended forecast
const FORECAST_DAYS = 6;

export type WeatherStatus = 'idle' | 'loading' | 'error';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 60 * 1000;

export const useWeatherStore = defineStore('weather', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const city = useLocalStorage<WeatherCity | null>('weather.city', null, { serializer: StorageSerializers.object });
    const data = useLocalStorage<WeatherData | null>('weather.data', null, { serializer: StorageSerializers.object });

    const status = ref<WeatherStatus>('idle');
    const errorMessage = ref('');

    async function refreshAsync()
    {
        const c = city.value;
        if (!c || status.value === 'loading') return;

        status.value = 'loading';
        errorMessage.value = '';

        try
        {
            const params = new URLSearchParams({
                latitude: String(c.latitude),
                longitude: String(c.longitude),
                current: 'temperature_2m,weather_code,is_day',
                daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
                timezone: 'auto',
                forecast_days: String(FORECAST_DAYS),
            });
            const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();

            data.value = {
                temperature: json.current.temperature_2m,
                code: json.current.weather_code,
                isDay: json.current.is_day === 1,
                max: json.daily.temperature_2m_max[0],
                min: json.daily.temperature_2m_min[0],
                days: (json.daily.time as string[]).map((date, i) => ({
                    date,
                    code: json.daily.weather_code[i],
                    max: json.daily.temperature_2m_max[i],
                    min: json.daily.temperature_2m_min[i],
                    sunrise: json.daily.sunrise[i],
                    sunset: json.daily.sunset[i],
                })),
                fetchedAt: Date.now(),
            };
            status.value = 'idle';
        }
        catch (err)
        {
            console.error(err);
            status.value = 'error';
            errorMessage.value = 'Sin conexión';
        }
    }

    function refreshIfStale()
    {
        // data cached before the forecast was added has no days
        if (!data.value || !data.value.days || Date.now() - data.value.fetchedAt > REFRESH_INTERVAL_MS)
            refreshAsync();
    }

    async function setCityAsync(query: string)
    {
        const q = query.trim();
        if (!q) return;

        status.value = 'loading';
        errorMessage.value = '';

        try
        {
            const params = new URLSearchParams({ name: q, count: '1', language: 'es', format: 'json' });
            const resp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            const result = json.results?.[0];

            if (!result)
            {
                status.value = 'error';
                errorMessage.value = `No se encontró «${q}»`;
                return;
            }

            city.value = {
                name: result.name,
                country: result.country ?? '',
                latitude: result.latitude,
                longitude: result.longitude,
            };
            data.value = null;
        }
        catch (err)
        {
            console.error(err);
            status.value = 'error';
            errorMessage.value = 'Sin conexión';
            return;
        }

        status.value = 'idle';
        await refreshAsync();
    }

    refreshIfStale();
    setInterval(refreshIfStale, STALE_CHECK_INTERVAL_MS);

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'afterResume')
            refreshIfStale();
    });

    return {
        city,
        data,
        status,
        errorMessage,
        refreshAsync,
        setCityAsync,
    };
});
