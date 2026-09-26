import { defineStore } from "pinia";
import { watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { BridgeTheme, OverscrollEffects, SystemBarAppearance } from "@bridgelauncher/api";
import { useTogglesStore } from "./useTogglesStore";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useHomeLayoutStore } from "./useHomeLayoutStore";
import { DEFAULT_PAGE, PAGE_COUNT, useWorkspaceStore } from "./useWorkspaceStore";

/** A live wallpaper drawn by the launcher (src/wallpaper/), or Android's own wallpaper. */
export type LiveWallpaperKind = 'nexus' | 'grass' | 'galaxy' | 'magicSmoke' | 'polarClock';
export type WallpaperKind = LiveWallpaperKind | 'system';
export type Level = 'low' | 'normal' | 'high';
export type NexusFps = 30 | 60 | 120;
export type StatusBarBackground = 'none' | 'gray' | 'blackGradient' | 'white' | 'black';

export const MAX_STATUS_BAR_HEIGHT = 80;
export const MAX_STATUS_BAR_SIDE_MARGIN = 60;

/** The Gingerbread status bar's icons the user can hide (the clock always shows). */
export type StatusBarIcon = 'notifications' | 'bluetooth' | 'alarm' | 'gps' | 'ringer' | 'dataActivity' | 'wifi' | 'signal' | 'battery';
export const STATUS_BAR_ICONS: StatusBarIcon[] = ['notifications', 'bluetooth', 'alarm', 'gps', 'ringer', 'dataActivity', 'wifi', 'signal', 'battery'];

export const NEXUS_PULSES: Record<Level, number> = { low: 5, normal: 9, high: 15 };
export const NEXUS_SPEED: Record<Level, number> = { low: 0.6, normal: 1, high: 1.6 };

export const useSettingsStore = defineStore('settings', () =>
{
    const toggles = useTogglesStore();
    const workspace = useWorkspaceStore();
    const bridgeEvents = useBridgeEventStore();
    const layout = useHomeLayoutStore();

    const wallpaper = useLocalStorage<WallpaperKind>('settings.wallpaper', 'nexus');
    const nexusDensity = useLocalStorage<Level>('settings.nexusDensity', 'normal');
    const nexusSpeed = useLocalStorage<Level>('settings.nexusSpeed', 'normal');
    const nexusFps = useLocalStorage<NexusFps>('settings.nexusFps', 30);
    const statusBarBackground = useLocalStorage<StatusBarBackground>('settings.statusBarBackground', 'none');
    // -1 = automatic (measured), otherwise a fixed height in CSS px
    const statusBarHeight = useLocalStorage<number>('settings.statusBarHeight', -1);
    // draw our own Gingerbread status bar instead of the system one (hidden through Bridge)
    const gingerbreadStatusBar = useLocalStorage<boolean>('settings.gingerbreadStatusBar', false);
    // side padding of the Gingerbread bar, in CSS px, so rounded screen corners don't cover it
    const statusBarSideMargin = useLocalStorage<number>('settings.statusBarSideMargin', 16);
    // which icons the Gingerbread bar shows; all by default, and icons added later start visible
    const statusBarIcons = useLocalStorage<Record<StatusBarIcon, boolean>>(
        'settings.statusBarIcons',
        Object.fromEntries(STATUS_BAR_ICONS.map(i => [i, true])) as Record<StatusBarIcon, boolean>,
        { mergeDefaults: true });
    // the Bridge status bar appearance to restore when turning the Gingerbread bar off
    const savedStatusBarAppearance = useLocalStorage<SystemBarAppearance>('settings.savedStatusBarAppearance', 'light-fg');
    // Bridge's own theme to restore when the Gingerbread bar is turned off; '' when we didn't change it
    const savedBridgeTheme = useLocalStorage<BridgeTheme | ''>('settings.savedBridgeTheme', '');
    // Gingerbread's orange glow at the end of lists, instead of Android's own overscroll effect
    const gingerbreadOverscroll = useLocalStorage<boolean>('settings.gingerbreadOverscroll', true);
    // Bridge's overscroll setting to restore when turning the Gingerbread glow off
    const savedOverscrollEffects = useLocalStorage<OverscrollEffects>('settings.savedOverscrollEffects', 'default');
    // like the Market of the time: put newly installed apps on the home screen
    const addIconOnInstall = useLocalStorage<boolean>('settings.addIconOnInstall', true);
    // app icon size, in percent of Gingerbread's 48 px (utils/iconSize.ts)
    const iconScale = useLocalStorage<number>('settings.iconScale', 100);

    // Bridge only needs to draw the system wallpaper when a live wallpaper canvas isn't covering it
    watch(wallpaper, kind =>
    {
        const drawSystem = kind === 'system';
        if (toggles.drawSystemWallpaperBehindWebView !== drawSystem)
            toggles.drawSystemWallpaperBehindWebView = drawSystem;
    }, { immediate: true });

    // our Gingerbread bar replaces the system one: hide it while on, restore it when turned off.
    // On startup it only re-hides (if the Bridge setting was changed meanwhile), it never un-hides.
    watch(gingerbreadStatusBar, (on, wasOn) =>
    {
        if (on)
        {
            if (toggles.statusBarAppearance !== 'hide')
            {
                savedStatusBarAppearance.value = toggles.statusBarAppearance;
                toggles.statusBarAppearance = 'hide';
            }
            // Bridge's own screens (its settings, console, drawer) go dark to match, so they don't
            // flash white when opened from the launcher
            if (toggles.bridgeTheme !== 'dark')
            {
                savedBridgeTheme.value = toggles.bridgeTheme;
                toggles.bridgeTheme = 'dark';
            }
        }
        else if (wasOn)
        {
            toggles.statusBarAppearance = savedStatusBarAppearance.value;
            if (savedBridgeTheme.value)
            {
                toggles.bridgeTheme = savedBridgeTheme.value;
                savedBridgeTheme.value = '';
            }
        }
    }, { immediate: true });

    // same idea for overscroll: turn off Bridge's effect while our glow is on, restore it when turned off
    watch(gingerbreadOverscroll, (on, wasOn) =>
    {
        if (on)
        {
            if (toggles.overscrollEffects !== 'none')
            {
                savedOverscrollEffects.value = toggles.overscrollEffects;
                toggles.overscrollEffects = 'none';
            }
        }
        else if (wasOn)
        {
            toggles.overscrollEffects = savedOverscrollEffects.value;
        }
    }, { immediate: true });

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name !== 'appInstalled' || !addIconOnInstall.value) return;
        const { packageName, label } = ev.app;
        if (layout.hasShortcut(packageName)) return;

        if (layout.addAppAnywhere(packageName, label, DEFAULT_PAGE))
            Bridge.showToast(`Se ha creado el acceso directo «${label}».`);
        else
            Bridge.showToast(`No hay espacio para el icono de «${label}».`);
    });

    // scroll the system wallpaper along with the pages, like a regular launcher
    Bridge.setWallpaperOffsetSteps(1 / (PAGE_COUNT - 1), 0);
    watch(() => workspace.scrollProgress, progress =>
    {
        if (wallpaper.value === 'system')
            Bridge.setWallpaperOffsets(progress, 0);
    }, { immediate: true });

    return {
        wallpaper,
        nexusDensity,
        nexusSpeed,
        nexusFps,
        statusBarBackground,
        statusBarHeight,
        gingerbreadStatusBar,
        statusBarSideMargin,
        statusBarIcons,
        gingerbreadOverscroll,
        addIconOnInstall,
        iconScale,
    };
});
