import type { Component } from 'vue';
import type { LiveWallpaperKind } from '@/stores/useSettingsStore';
import NexusWallpaper from './NexusWallpaper.vue';
import GrassWallpaper from './GrassWallpaper.vue';
import GalaxyWallpaper from './GalaxyWallpaper.vue';
import MagicSmokeWallpaper from './MagicSmokeWallpaper.vue';
import PolarClockWallpaper from './PolarClockWallpaper.vue';

// Gingerbread's live wallpapers, recreated on a canvas. Adding one: its kind in `LiveWallpaperKind`
// (useSettingsStore), its component here, and its entry in WallpaperDialog.

export const LIVE_WALLPAPERS: Record<LiveWallpaperKind, Component> = {
    nexus: NexusWallpaper,
    grass: GrassWallpaper,
    galaxy: GalaxyWallpaper,
    magicSmoke: MagicSmokeWallpaper,
    polarClock: PolarClockWallpaper,
};

/** What App.vue can call on the mounted wallpaper: those that react to taps expose `tap`. */
export interface LiveWallpaperInstance
{
    tap?: (clientX: number, clientY: number) => void;
}
