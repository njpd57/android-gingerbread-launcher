<script setup lang="ts">
import { ref } from 'vue';
import type { RGB } from '@/utils/liveWallpapers';
import { lerpRGB } from '@/utils/liveWallpapers';
import { useLiveWallpaper, type WallpaperSize } from './useLiveWallpaper';

// A recreation of Gingerbread's "Galaxy" live wallpaper: a two-armed spiral galaxy, seen at a slight
// tilt, turning slowly over a field of faint stars and bluish nebula. The galaxy is drawn once to an
// offscreen canvas and only rotated each frame.

const TILT = 0.72; // vertical squash of the disc
const TURN_SPEED = 0.025; // radians per second
const ARMS = 2;
const TWIST = 2.6; // how tightly the arms wind

const CORE: RGB = [255, 236, 200];
const ARM: RGB = [150, 185, 255];

const canvasEl = ref<HTMLCanvasElement>();

let w = 0;
let h = 0;
let dpr = 1;
let worldW = 0;
let background: HTMLCanvasElement | null = null;
let galaxy: HTMLCanvasElement | null = null;
let galaxyRadius = 0;
let angle = 0;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
// roughly normal, for stars scattered around each arm
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

function renderBackground()
{
    background = document.createElement('canvas');
    background.width = Math.round(worldW * dpr);
    background.height = Math.round(h * dpr);
    const bg = background.getContext('2d')!;
    bg.scale(dpr, dpr);

    bg.fillStyle = '#020309';
    bg.fillRect(0, 0, worldW, h);

    // faint nebula clouds
    bg.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++)
    {
        const x = rand(0, worldW);
        const y = rand(0, h);
        const r = rand(0.25, 0.55) * Math.max(w, h);
        const cloud = bg.createRadialGradient(x, y, 0, x, y, r);
        const color: RGB = Math.random() < 0.5 ? [40, 60, 140] : [80, 40, 120];
        cloud.addColorStop(0, rgba(color, 0.22));
        cloud.addColorStop(1, rgba(color, 0));
        bg.fillStyle = cloud;
        bg.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // distant stars
    bg.fillStyle = '#fff';
    const count = Math.round(worldW * h / 900);
    for (let i = 0; i < count; i++)
    {
        bg.globalAlpha = rand(0.15, 0.8);
        const r = rand(0.3, 1);
        bg.fillRect(rand(0, worldW), rand(0, h), r, r);
    }
    bg.globalAlpha = 1;
}

function renderGalaxy()
{
    galaxyRadius = Math.max(w, h * 0.8) * 0.62;
    const size = galaxyRadius * 2;
    galaxy = document.createElement('canvas');
    galaxy.width = Math.round(size * dpr);
    galaxy.height = Math.round(size * dpr);
    const g = galaxy.getContext('2d')!;
    g.scale(dpr, dpr);
    g.translate(galaxyRadius, galaxyRadius);
    g.globalCompositeOperation = 'lighter';

    // glowing bulge
    const bulge = g.createRadialGradient(0, 0, 0, 0, 0, galaxyRadius * 0.35);
    bulge.addColorStop(0, rgba(CORE, 0.9));
    bulge.addColorStop(0.3, rgba(CORE, 0.35));
    bulge.addColorStop(1, rgba(CORE, 0));
    g.fillStyle = bulge;
    g.fillRect(-galaxyRadius, -galaxyRadius, size, size);

    // dust along the arms, blurred into clouds
    g.filter = `blur(${Math.round(galaxyRadius * 0.04)}px)`;
    for (let i = 0; i < 90; i++)
    {
        const t = Math.random() ** 0.8;
        const r = t * galaxyRadius * 0.9;
        const a = (i % ARMS) * (2 * Math.PI / ARMS) + t * TWIST * Math.PI + gauss() * 0.25;
        g.fillStyle = rgba(Math.random() < 0.6 ? [70, 100, 220] : [150, 70, 170], 0.12);
        const s = galaxyRadius * rand(0.05, 0.12);
        g.beginPath();
        g.arc(Math.cos(a) * r, Math.sin(a) * r, s, 0, Math.PI * 2);
        g.fill();
    }
    g.filter = 'none';

    // stars: many near the core, thinning out along the arms
    const count = Math.round(galaxyRadius * 14);
    for (let i = 0; i < count; i++)
    {
        const t = Math.random() ** 1.4;
        const r = t * galaxyRadius;
        const spread = 0.12 + 0.5 * (1 - t) ** 3;
        const a = (i % ARMS) * (2 * Math.PI / ARMS) + t * TWIST * Math.PI + gauss() * spread * Math.PI;
        const x = Math.cos(a) * r + gauss() * galaxyRadius * 0.02;
        const y = Math.sin(a) * r + gauss() * galaxyRadius * 0.02;
        const s = rand(0.5, 1.6) * (1 - t * 0.4);
        g.fillStyle = rgba(lerpRGB(CORE, ARM, Math.min(1, t * 1.6)), rand(0.35, 1) * (1 - t * 0.5));
        g.fillRect(x - s / 2, y - s / 2, s, s);
    }
}

function resize(size: WallpaperSize)
{
    ({ w, h, dpr, worldW } = size);
    renderBackground();
    renderGalaxy();
}

function step(dt: number)
{
    angle = (angle + TURN_SPEED * dt) % (Math.PI * 2);
}

function draw(ctx: CanvasRenderingContext2D, offsetX: number)
{
    if (!background || !galaxy) return;
    ctx.drawImage(background, offsetX * dpr, 0, w * dpr, h * dpr, 0, 0, w, h);

    // the galaxy sits in the middle of the world, so it slides across as the pages scroll
    ctx.translate(worldW / 2 - offsetX, h * 0.42);
    ctx.scale(1, TILT);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(galaxy, -galaxyRadius, -galaxyRadius, galaxyRadius * 2, galaxyRadius * 2);
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
