<script setup lang="ts">
import { ref } from 'vue';
import { POLAR_RINGS, polarClockFractions } from '@/utils/liveWallpapers';
import { useLiveWallpaper, type WallpaperSize } from './useLiveWallpaper';

// A recreation of Gingerbread's "Polar Clock" live wallpaper: the time as concentric arcs that fill
// clockwise from the top. From outside in: seconds, minutes, hours, day of the week, day of the month
// and month. Each ring's color shifts with how full it is, like the original's "cycling" palette.

const RING_GAP = 0.28; // gap between rings, relative to a ring's thickness

const canvasEl = ref<HTMLCanvasElement>();

let w = 0;
let h = 0;
let worldW = 0;

function resize(size: WallpaperSize)
{
    ({ w, h, worldW } = size);
}

function draw(ctx: CanvasRenderingContext2D, offsetX: number)
{
    const bg = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.75);
    bg.addColorStop(0, '#1e1e1e');
    bg.addColorStop(1, '#050505');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // centred in the world, so the clock slides a little as the pages scroll
    const cx = worldW / 2 - offsetX;
    const cy = h * 0.45;
    const outer = Math.min(w * 0.46, h * 0.36);
    const thickness = outer / (POLAR_RINGS.length * (1 + RING_GAP) + 0.8);
    const fractions = polarClockFractions(new Date());

    ctx.lineCap = 'butt';
    POLAR_RINGS.forEach((ring, i) =>
    {
        const f = fractions[ring];
        const r = outer - thickness / 2 - i * thickness * (1 + RING_GAP);
        const hue = (f * 360 + i * 25) % 360;

        // the empty track, then the filled part
        ctx.lineWidth = thickness;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        if (f <= 0) return;
        ctx.strokeStyle = `hsl(${hue},80%,55%)`;
        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2);
        ctx.stroke();
    });
}

useLiveWallpaper(canvasEl, { resize, draw });
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
