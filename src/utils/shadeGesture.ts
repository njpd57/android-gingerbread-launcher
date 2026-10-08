// Pulling the notification panel down with a finger, like Gingerbread's shade, and swiping up to open
// the drawer (useShadePull).

/** How far the finger moves before the gesture counts as a pull (or as something else). */
export const SHADE_SLOP_PX = 12;
/** How long the panel takes to finish opening or closing after the finger lifts; matches its CSS. */
export const SHADE_SETTLE_MS = 250;
// a flick at least this fast (px/ms) opens or closes the panel whatever its position
const FLICK_SPEED = 0.5;
// otherwise it opens once this much of it shows
const OPEN_FRACTION = 0.35;

/**
 * What a finger that moved (dx, dy) from where it went down is doing: pulling the panel down, swiping
 * up (to open the drawer), something else (swiping pages), or null while it hasn't moved enough to tell.
 */
export function shadeGestureDirection(dx: number, dy: number): 'down' | 'up' | 'other' | null
{
    if (Math.hypot(dx, dy) < SHADE_SLOP_PX) return null;
    if (Math.abs(dy) <= 1.5 * Math.abs(dx)) return 'other';
    return dy > 0 ? 'down' : 'up';
}

// a swipe up opens the drawer once the finger has gone this far, or flicks up this fast (px/ms)
const DRAWER_SWIPE_PX = 80;

/** Whether a swipe up that moved `dy` px (negative = up) and ended at `velocity` px/ms opens the drawer. */
export function swipeOpensDrawer(dy: number, velocity: number): boolean
{
    return dy <= -DRAWER_SWIPE_PX || velocity <= -FLICK_SPEED;
}

/**
 * Whether the panel ends up open when the finger lifts, with `revealed` px of its `height`
 * showing and the finger moving at `velocity` px/ms (positive = down).
 */
export function shadeSettlesOpen(revealed: number, height: number, velocity: number): boolean
{
    if (velocity >= FLICK_SPEED) return true;
    if (velocity <= -FLICK_SPEED) return false;
    return revealed >= height * OPEN_FRACTION;
}
