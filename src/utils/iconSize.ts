// Gingerbread's app icons were 48 dp; the user can scale them (Apariencia → "Tamaño de los iconos")
export const BASE_ICON_SIZE = 48;
export const MIN_ICON_SCALE = 75;
export const MAX_ICON_SCALE = 130;

// what a home screen cell needs besides the icon: HomeGrid's item padding (4px around), the gap
// and the label bubble underneath (Shortcut.vue)
const CELL_PADDING = 8;
const LABEL_SPACE = 22;
const MIN_ICON_SIZE = 24;

/** The icon size for a scale in percent, without any limit (the drawer has room to spare). */
export function scaledIconSize(scale: number)
{
    return Math.round(BASE_ICON_SIZE * scale / 100);
}

/**
 * The icon size for the home screen grid: scaled, but never larger than a cell can hold with its
 * label, so big icons still fit with 7 rows on a short screen.
 */
export function fittedIconSize(scale: number, cellWidth: number, cellHeight: number)
{
    const fit = Math.min(cellWidth - CELL_PADDING, cellHeight - CELL_PADDING - LABEL_SPACE);
    return Math.max(MIN_ICON_SIZE, Math.min(scaledIconSize(scale), Math.floor(fit)));
}
