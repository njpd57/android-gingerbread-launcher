<script setup lang="ts">
import { ref } from 'vue';
import { useLiveWallpaper, type WallpaperSize } from './useLiveWallpaper';

// A recreation of Gingerbread's "Magic Smoke" live wallpaper: clouds of colored smoke drifting over
// black, slowly changing color. Tapping stirs a puff of smoke where the finger was. The clouds are
// drawn small and scaled up, which blurs them into smoke cheaply.

const SCALE = 1 / 8; // resolution of the smoke buffer relative to the screen
const CLOUDS = 9;
const HUE_SPEED = 4; // degrees per second
const PUFF_LIFE = 3.5; // seconds

interface Cloud
{
    // centre and reach of its drift, in world px
    cx: number;
    cy: number;
    ax: number;
    ay: number;
    fx: number;
    fy: number;
    phase: number;
    radius: number;
    hueOffset: number;
}

interface Puff
{
    x: number;
    y: number;
    age: number;
    hue: number;
}

const canvasEl = ref<HTMLCanvasElement>();

let w = 0;
let h = 0;
let worldW = 0;
let buffer: HTMLCanvasElement | null = null;
let clouds: Cloud[] = [];
let puffs: Puff[] = [];
let time = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const baseHue = () => (200 + time * HUE_SPEED) % 360;

function resize(size: WallpaperSize)
{
    ({ w, h, worldW } = size);
    buffer = document.createElement('canvas');
    buffer.width = Math.max(1, Math.round(worldW * SCALE));
    buffer.height = Math.max(1, Math.round(h * SCALE));
    clouds = Array.from({ length: CLOUDS }, (_, i) => ({
        cx: rand(0.1, 0.9) * worldW,
        cy: rand(0.1, 0.9) * h,
        ax: rand(0.15, 0.35) * worldW,
        ay: rand(0.1, 0.3) * h,
        fx: rand(0.03, 0.08),
        fy: rand(0.03, 0.08),
        phase: rand(0, Math.PI * 2),
        radius: rand(0.3, 0.55) * Math.max(w, h),
        hueOffset: (i % 3) * 40 - 40,
    }));
}

function step(dt: number)
{
    time += dt;
    for (const p of puffs)
        p.age += dt;
    puffs = puffs.filter(p => p.age < PUFF_LIFE);
}

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, hue: number, alpha: number)
{
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `hsla(${hue},85%,55%,${alpha})`);
    grad.addColorStop(0.5, `hsla(${hue},85%,45%,${alpha * 0.45})`);
    grad.addColorStop(1, `hsla(${hue},85%,40%,0)`);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
}

function draw(ctx: CanvasRenderingContext2D, offsetX: number)
{
    if (!buffer) return;
    const g = buffer.getContext('2d')!;
    g.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000';
    g.fillRect(0, 0, worldW, h);
    g.globalCompositeOperation = 'lighter';

    const hue = baseHue();
    for (const c of clouds)
    {
        const x = c.cx + Math.sin(time * c.fx * Math.PI + c.phase) * c.ax;
        const y = c.cy + Math.cos(time * c.fy * Math.PI + c.phase * 1.3) * c.ay;
        // each cloud breathes a little
        const r = c.radius * (0.85 + 0.15 * Math.sin(time * 0.3 + c.phase));
        blob(g, x, y, r, (hue + c.hueOffset + 360) % 360, 0.28);
    }

    for (const p of puffs)
    {
        const t = p.age / PUFF_LIFE;
        const r = Math.max(w, h) * (0.08 + 0.3 * t);
        blob(g, p.x, p.y - t * h * 0.06, r, p.hue, 0.55 * (1 - t) ** 1.5);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buffer, offsetX * SCALE, 0, w * SCALE, h * SCALE, 0, 0, w, h);
}

const { shouldAnimate, offsetX } = useLiveWallpaper(canvasEl, { resize, step, draw });

/** Stirs up a puff of smoke at a tapped point. */
function tap(clientX: number, clientY: number)
{
    if (!shouldAnimate.value) return;
    puffs.push({ x: clientX + offsetX(), y: clientY, age: 0, hue: (baseHue() + 60) % 360 });
}

defineExpose({ tap });
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
