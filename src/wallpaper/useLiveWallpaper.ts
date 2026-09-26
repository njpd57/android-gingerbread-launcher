import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useDocumentVisibility, usePreferredReducedMotion, useResizeObserver } from '@vueuse/core';
import type { AnyBridgeEventListener } from '@/stores/useBridgeEventStore';
import { useBridgeEventStore } from '@/stores/useBridgeEventStore';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';

// The canvas plumbing every live wallpaper shares: sizing for the device pixel ratio, a world wider
// than the screen that scrolls slower than the pages (parallax), the frame loop at the chosen fps, and
// pausing while the drawer is open, the launcher is in the background or motion is reduced.

const PARALLAX_WIDTH = 1.5; // wallpaper width relative to the screen
const MAX_DPR = 2;
// rAF timestamps jitter slightly, so allow frames a bit early to avoid skipping every other one
const FRAME_TOLERANCE_MS = 2;

export interface WallpaperSize
{
    /** Screen size in CSS px. */
    w: number;
    h: number;
    dpr: number;
    /** Width of the whole wallpaper, which scrolls across the pages. */
    worldW: number;
}

export interface LiveWallpaperScene
{
    /** On mount and whenever the canvas changes size: rebuild whatever depends on it. */
    resize(size: WallpaperSize): void;
    /** Advances the animation by `dt` seconds. */
    step?(dt: number): void;
    /** Draws a frame; the context is in CSS px, `offsetX` is how far the world is scrolled. */
    draw(ctx: CanvasRenderingContext2D, offsetX: number): void;
}

export function useLiveWallpaper(canvasEl: Ref<HTMLCanvasElement | undefined>, scene: LiveWallpaperScene)
{
    const bridgeEvents = useBridgeEventStore();
    const drawer = useDrawerStore();
    const workspace = useWorkspaceStore();
    const settings = useSettingsStore();

    const visibility = useDocumentVisibility();
    const reducedMotion = usePreferredReducedMotion();
    const bridgePaused = ref(false);

    const size: WallpaperSize = { w: 0, h: 0, dpr: 1, worldW: 0 };
    let ctx: CanvasRenderingContext2D | null = null;
    let rafId = 0;
    let lastFrame = 0;

    const offsetX = () => workspace.scrollProgress * (size.worldW - size.w);

    function draw()
    {
        if (!ctx) return;
        ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        scene.draw(ctx, offsetX());
    }

    function loop(t: number)
    {
        rafId = requestAnimationFrame(loop);
        if (t - lastFrame < 1000 / settings.nexusFps - FRAME_TOLERANCE_MS) return;
        const dt = Math.min((t - lastFrame) / 1000, 0.1);
        lastFrame = t;
        scene.step?.(dt);
        draw();
    }

    function start()
    {
        if (rafId) return;
        lastFrame = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    function stop()
    {
        cancelAnimationFrame(rafId);
        rafId = 0;
    }

    const shouldAnimate = computed(() =>
        !drawer.isOpen
        && !bridgePaused.value
        && visibility.value === 'visible'
        && reducedMotion.value !== 'reduce'
    );

    function resize()
    {
        const canvas = canvasEl.value;
        if (!canvas || canvas.clientWidth === 0 || canvas.clientHeight === 0) return;

        size.w = canvas.clientWidth;
        size.h = canvas.clientHeight;
        size.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        size.worldW = size.w * PARALLAX_WIDTH;

        canvas.width = Math.round(size.w * size.dpr);
        canvas.height = Math.round(size.h * size.dpr);
        ctx = canvas.getContext('2d');

        scene.resize({ ...size });
        draw();
    }

    const onBridgeEvent: AnyBridgeEventListener = ev =>
    {
        if (ev.name === 'beforePause')
            bridgePaused.value = true;
        else if (ev.name === 'afterResume')
            bridgePaused.value = false;
    };

    bridgeEvents.addEventListener(onBridgeEvent);

    useResizeObserver(canvasEl, resize);

    onMounted(() =>
    {
        resize();
        watch(shouldAnimate, animate => animate ? start() : stop(), { immediate: true });
    });

    // while not animating (e.g. reduced motion), still follow page scrolling
    watch(() => workspace.scrollProgress, () =>
    {
        if (!rafId) draw();
    });

    onBeforeUnmount(() =>
    {
        stop();
        bridgeEvents.removeEventListener(onBridgeEvent);
    });

    return { shouldAnimate, offsetX };
}
