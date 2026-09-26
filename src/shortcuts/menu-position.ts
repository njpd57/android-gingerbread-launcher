export interface MenuPlacement
{
    left: number;
    top: number;
    /** Whether the menu opens above the icon (it didn't fit below). */
    above: boolean;
}

interface Box
{
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/**
 * Where to put a menu of the given size next to a long-pressed icon: below it if it fits, otherwise above,
 * centered on the icon and kept `margin` away from the screen edges.
 */
export function placeMenu(anchor: Box, width: number, height: number, viewportWidth: number, viewportHeight: number, margin = 8): MenuPlacement
{
    const centerX = (anchor.left + anchor.right) / 2;
    const left = Math.min(Math.max(margin, centerX - width / 2), Math.max(margin, viewportWidth - width - margin));

    const fitsBelow = anchor.bottom + margin + height <= viewportHeight - margin;
    const top = fitsBelow
        ? anchor.bottom + margin
        : Math.max(margin, anchor.top - margin - height);

    return { left, top, above: !fitsBelow };
}
