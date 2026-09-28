// Android 2.3's still wallpapers (src/assets/wallpapers/, from AOSP android-2.3.7_r1's Launcher2,
// Apache 2.0), in the order its wallpaper picker showed them.

export const GINGERBREAD_WALLPAPERS = [
    'electric', 'grass', 'canyon', 'monumentvalley', 'tree', 'zanzibar', 'field', 'cloud', 'desert',
    'goldengate', 'despair', 'grass_night', 'galaxy', 'x67', 'nexusrain', 'nexuspattern', 'nexuswallpaper1',
    'brown', 'pcut', 'bluedotgrid', 'hazybluedots', 'ropelights', 'gray', 'greengray', 'lightgrad',
] as const;

export type GingerbreadWallpaper = typeof GINGERBREAD_WALLPAPERS[number];

/** Every image is this size: two screens of a 480×800 phone, for the parallax. */
export const WALLPAPER_IMAGE_WIDTH = 960;
export const WALLPAPER_IMAGE_HEIGHT = 800;

export function isGingerbreadWallpaper(id: string): id is GingerbreadWallpaper
{
    return (GINGERBREAD_WALLPAPERS as readonly string[]).includes(id);
}

const images = import.meta.glob<string>('../assets/wallpapers/wallpaper-*.{jpg,png}', { import: 'default', eager: true });

function imageURL(name: string): string
{
    return images[`../assets/wallpapers/wallpaper-${name}.jpg`] ?? images[`../assets/wallpapers/wallpaper-${name}.png`];
}

/** The full image. */
export function wallpaperURL(id: GingerbreadWallpaper): string
{
    return imageURL(id);
}

/** The picker's small preview. */
export function wallpaperThumbURL(id: GingerbreadWallpaper): string
{
    return imageURL(`${id}-thumb`);
}

export interface WallpaperImageLayout
{
    /** Size the image is drawn at, in CSS px. */
    width: number;
    height: number;
    /** Where its top goes (negative when it's cropped), in CSS px. */
    top: number;
    /** How far it scrolls from the first page to the last. */
    scrollRange: number;
}

/**
 * Like Android's wallpapers: the image fills the screen's height (or its width, on a wide screen),
 * centered vertically, and scrolls across its whole width as the pages go by.
 */
export function wallpaperImageLayout(screenW: number, screenH: number): WallpaperImageLayout
{
    const scale = Math.max(screenH / WALLPAPER_IMAGE_HEIGHT, screenW / WALLPAPER_IMAGE_WIDTH);
    const width = WALLPAPER_IMAGE_WIDTH * scale;
    const height = WALLPAPER_IMAGE_HEIGHT * scale;
    return {
        width,
        height,
        top: (screenH - height) / 2,
        scrollRange: Math.max(width - screenW, 0),
    };
}
