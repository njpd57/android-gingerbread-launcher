<script setup lang="ts">
import { ref } from 'vue';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { clockMinutes, grassSky, type GrassSky, type RGB } from '@/utils/liveWallpapers';
import { useLiveWallpaper, type WallpaperSize } from './useLiveWallpaper';

// A recreation of Gingerbread's "Grass" live wallpaper: blades of grass swaying in the wind along the
// bottom, under a sky that follows the time of day (night with stars, an orange dawn and dusk, blue
// day). Like the original, it uses the real sunrise and sunset: those of the weather widget's city.

// fallbacks while the weather widget has no city
const DEFAULT_SUNRISE = 7 * 60;
const DEFAULT_SUNSET = 19 * 60 + 30;
const SKY_REFRESH_MS = 30_000;

interface Blade
{
    x: number;
    height: number;
    width: number;
    // how much the wind bends it: short blades are stiffer
    bend: number;
    phase: number;
    // darker blades stand behind lighter ones
    shade: number;
}

interface Star
{
    x: number;
    y: number;
    r: number;
    twinkle: number;
}

const weather = useWeatherStore();

const canvasEl = ref<HTMLCanvasElement>();

let w = 0;
let h = 0;
let blades: Blade[] = [];
let stars: Star[] = [];
let time = 0;
let sky: GrassSky = grassSky(12 * 60, DEFAULT_SUNRISE, DEFAULT_SUNSET);
let skyCheckedAt = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const rgb = ([r, g, b]: RGB, k = 1) => `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;

function todaysSunTimes(): [number, number]
{
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const day = weather.data?.days?.find(d => d.date === today);
    const sunrise = day ? clockMinutes(day.sunrise) : null;
    const sunset = day ? clockMinutes(day.sunset) : null;
    return [sunrise ?? DEFAULT_SUNRISE, sunset ?? DEFAULT_SUNSET];
}

function updateSky()
{
    const now = new Date();
    skyCheckedAt = Date.now();
    sky = grassSky(now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60, ...todaysSunTimes());
}

function resize(size: WallpaperSize)
{
    ({ w, h } = size);
    const count = Math.round(size.worldW / 2.2);
    blades = Array.from({ length: count }, () =>
    {
        const tall = Math.random() < 0.15;
        const height = h * (tall ? rand(0.22, 0.34) : rand(0.08, 0.2));
        return {
            x: rand(-10, size.worldW + 10),
            height,
            width: rand(3, 7),
            bend: height / (h * 0.3),
            phase: rand(0, Math.PI * 2),
            shade: rand(0.55, 1.15),
        };
    }).sort((a, b) => a.shade - b.shade);
    stars = Array.from({ length: Math.round(size.worldW * h / 5000) }, () => ({
        x: rand(0, size.worldW),
        // more of them higher up, away from the horizon's glow
        y: Math.random() ** 1.6 * h * 0.75,
        r: rand(0.4, 1.3),
        twinkle: rand(0, Math.PI * 2),
    }));
    updateSky();
}

function step(dt: number)
{
    time += dt;
    if (Date.now() - skyCheckedAt > SKY_REFRESH_MS)
        updateSky();
}

function draw(ctx: CanvasRenderingContext2D, offsetX: number)
{
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, rgb(sky.top));
    gradient.addColorStop(1, rgb(sky.bottom));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.translate(-offsetX, 0);

    if (sky.stars > 0.01)
    {
        ctx.fillStyle = '#fff';
        for (const s of stars)
        {
            if (s.x < offsetX - 2 || s.x > offsetX + w + 2) continue;
            ctx.globalAlpha = sky.stars * (0.55 + 0.45 * Math.sin(time * 1.3 + s.twinkle));
            ctx.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
        }
        ctx.globalAlpha = 1;
    }

    for (const b of blades)
    {
        if (b.x < offsetX - 60 || b.x > offsetX + w + 60) continue;
        // two gusts of wind travelling across the field
        const wind = Math.sin(time * 0.7 - b.x * 0.004 + b.phase * 0.15) * 0.7
            + Math.sin(time * 1.9 - b.x * 0.011 + b.phase) * 0.2;
        const sway = wind * b.height * 0.35 * b.bend;
        const tipX = b.x + sway;
        const tipY = h - b.height + Math.abs(sway) * 0.25;

        ctx.fillStyle = rgb(sky.grass, b.shade);
        ctx.beginPath();
        ctx.moveTo(b.x - b.width / 2, h);
        ctx.quadraticCurveTo(b.x - b.width / 4 + sway * 0.25, h - b.height * 0.55, tipX, tipY);
        ctx.quadraticCurveTo(b.x + b.width / 4 + sway * 0.25, h - b.height * 0.55, b.x + b.width / 2, h);
        ctx.closePath();
        ctx.fill();
    }
}

useLiveWallpaper(canvasEl, { resize, step, draw });
</script>

<template>
    <canvas ref="canvasEl" class="live-wallpaper" aria-hidden="true"></canvas>
</template>

<style scoped lang="scss">
.live-wallpaper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
}
</style>
