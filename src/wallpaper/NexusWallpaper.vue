<script setup lang="ts">
import { ref } from 'vue';
import { NEXUS_PULSES, NEXUS_SPEED, useSettingsStore } from '@/stores/useSettingsStore';
import { useLiveWallpaper, type WallpaperSize } from './useLiveWallpaper';

// A recreation of the "Nexus" live wallpaper: glowing colored pulses
// travelling along an invisible grid over a dark background.

const GRID = 48;

type RGB = [number, number, number];

const COLORS: RGB[] = [
    [255, 60, 60],   // red
    [60, 255, 95],   // green
    [60, 140, 255],  // blue
    [255, 225, 60],  // yellow
];

interface Pulse
{
    x: number;
    y: number;
    dx: number;
    dy: number;
    speed: number;
    length: number;
    width: number;
    color: RGB;
    // distance travelled so far; tails only grow to full length once travelled that far
    travelled: number;
}

const settings = useSettingsStore();

const maxPulses = () => NEXUS_PULSES[settings.nexusDensity];

const canvasEl = ref<HTMLCanvasElement>();

let background: HTMLCanvasElement | null = null;
let w = 0;
let h = 0;
let dpr = 1;
let worldW = 0;
let pulses: Pulse[] = [];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const snap = (v: number) => Math.round(v / GRID) * GRID;
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r},${g},${b},${a})`;

function makePulse(x: number, y: number, dx: number, dy: number, travelled: number): Pulse
{
    const length = rand(140, 320);
    return {
        x, y, dx, dy,
        speed: rand(70, 150),
        length,
        width: rand(2.5, 4.5),
        color: pick(COLORS),
        travelled: Math.min(travelled, length),
    };
}

function spawnFromEdge(): Pulse
{
    const sign = Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.5)
    {
        const x = sign > 0 ? -rand(0, 200) : worldW + rand(0, 200);
        return makePulse(x, snap(rand(0, h)), sign, 0, Infinity);
    }
    else
    {
        const y = sign > 0 ? -rand(0, 200) : h + rand(0, 200);
        return makePulse(snap(rand(0, worldW)), y, 0, sign, Infinity);
    }
}

function spawnInside(): Pulse
{
    const sign = Math.random() < 0.5 ? 1 : -1;
    const horizontal = Math.random() < 0.5;
    return makePulse(
        horizontal ? rand(0, worldW) : snap(rand(0, worldW)),
        horizontal ? snap(rand(0, h)) : rand(0, h),
        horizontal ? sign : 0,
        horizontal ? 0 : sign,
        Infinity,
    );
}

function isGone(p: Pulse)
{
    if (p.dx > 0) return p.x - p.length > worldW;
    if (p.dx < 0) return p.x + p.length < 0;
    if (p.dy > 0) return p.y - p.length > h;
    return p.y + p.length < 0;
}

function renderBackground()
{
    background = document.createElement('canvas');
    background.width = Math.round(worldW * dpr);
    background.height = Math.round(h * dpr);
    const bg = background.getContext('2d')!;
    bg.scale(dpr, dpr);

    const base = bg.createLinearGradient(0, 0, 0, h);
    base.addColorStop(0, '#0b0e15');
    base.addColorStop(0.55, '#161b27');
    base.addColorStop(1, '#06070a');
    bg.fillStyle = base;
    bg.fillRect(0, 0, worldW, h);

    // soft, blurred light bands across the lower half
    bg.filter = 'blur(14px)';
    const bands = [
        { y: 0.60, amp: 0.05, thickness: 0.07, alpha: 0.22 },
        { y: 0.68, amp: 0.04, thickness: 0.05, alpha: 0.16 },
        { y: 0.76, amp: 0.06, thickness: 0.09, alpha: 0.10 },
    ];
    for (const band of bands)
    {
        const y = band.y * h;
        const amp = band.amp * h;
        const t = band.thickness * h;
        const grad = bg.createLinearGradient(0, y - amp - t, 0, y + amp + t);
        grad.addColorStop(0, 'rgba(170,175,220,0)');
        grad.addColorStop(0.5, `rgba(185,190,235,${band.alpha})`);
        grad.addColorStop(1, 'rgba(170,175,220,0)');
        bg.fillStyle = grad;
        bg.beginPath();
        bg.moveTo(0, y);
        bg.bezierCurveTo(worldW * 0.3, y - amp * 2, worldW * 0.6, y + amp * 2, worldW, y - amp);
        bg.lineTo(worldW, y - amp + t);
        bg.bezierCurveTo(worldW * 0.6, y + amp * 2 + t, worldW * 0.3, y - amp * 2 + t, 0, y + t);
        bg.closePath();
        bg.fill();
    }
    bg.filter = 'none';
}

function drawPulse(c: CanvasRenderingContext2D, p: Pulse)
{
    const tail = Math.min(p.length, p.travelled);
    const tx = p.x - p.dx * tail;
    const ty = p.y - p.dy * tail;

    if (tail > 1)
    {
        const grad = c.createLinearGradient(tx, ty, p.x, p.y);
        grad.addColorStop(0, rgba(p.color, 0));
        grad.addColorStop(1, rgba(p.color, 1));
        c.strokeStyle = grad;
        c.lineCap = 'round';

        // wide, faint glow, then the bright core
        c.globalAlpha = 0.25;
        c.lineWidth = p.width * 4;
        c.beginPath();
        c.moveTo(tx, ty);
        c.lineTo(p.x, p.y);
        c.stroke();

        c.globalAlpha = 1;
        c.lineWidth = p.width;
        c.stroke();
    }

    const r = p.width * 5;
    const head = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    head.addColorStop(0, 'rgba(255,255,255,0.95)');
    head.addColorStop(0.25, rgba(p.color, 0.9));
    head.addColorStop(1, rgba(p.color, 0));
    c.fillStyle = head;
    c.fillRect(p.x - r, p.y - r, r * 2, r * 2);
}

function draw(ctx: CanvasRenderingContext2D, offsetX: number)
{
    if (!background) return;

    ctx.drawImage(background, offsetX * dpr, 0, w * dpr, h * dpr, 0, 0, w, h);

    ctx.translate(-offsetX, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (const p of pulses)
        drawPulse(ctx, p);
}

function step(dt: number)
{
    const speedFactor = NEXUS_SPEED[settings.nexusSpeed];
    for (const p of pulses)
    {
        const d = p.speed * speedFactor * dt;
        p.x += p.dx * d;
        p.y += p.dy * d;
        p.travelled += d;
    }

    // replace pulses that left the screen, dropping extras left over from taps
    const alive = pulses.filter(p => !isGone(p));
    while (alive.length < maxPulses())
        alive.push(spawnFromEdge());
    pulses = alive;
}

function resize(size: WallpaperSize)
{
    ({ w, h, dpr, worldW } = size);
    renderBackground();
    if (pulses.length === 0)
        pulses = Array.from({ length: maxPulses() }, spawnInside);
}

const { shouldAnimate, offsetX } = useLiveWallpaper(canvasEl, { resize, step, draw });

/** Sends pulses out in all four directions from a tapped point. */
function tap(clientX: number, clientY: number)
{
    if (!shouldAnimate.value) return;
    const x = snap(clientX + offsetX());
    const y = snap(clientY);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
        pulses.push(makePulse(x, y, dx, dy, 0));
}

defineExpose({ tap });
</script>

<template>
    <canvas ref="canvasEl" class="nexus-wallpaper" aria-hidden="true"></canvas>
</template>

<style scoped lang="scss">
.nexus-wallpaper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
}
</style>
