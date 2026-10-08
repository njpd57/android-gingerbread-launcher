import { useMenuStore } from '@/stores/useMenuStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useDragStore } from '@/stores/useDragStore';
import { SHADE_SETTLE_MS, SHADE_SLOP_PX, shadeGestureDirection, shadeSettlesOpen, swipeOpensDrawer } from '@/utils/shadeGesture';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { bridgeRequest } from '@/utils/toast';

// a finger that stopped this long before lifting isn't flicking
const FLICK_MAX_PAUSE_MS = 100;

let settleTimer = 0;

/**
 * Gingerbread's shade: swiping down on the home screen (or on our status bar) pulls the notification
 * panel down with the finger, and dragging its handle up pushes it back. Android's own top-edge
 * swipe can't be taken over, so the pull starts below it. A swipe up on the home screen opens the drawer.
 * Without our Bridge fork there's no panel of ours: a pull opens Android's shade instead.
 */
export function useShadePull()
{
    const menu = useMenuStore();
    const notifications = useNotificationsStore();
    const drag = useDragStore();
    const drawer = useDrawerStore();

    // 'swipingUp': a swipe up on the home screen, which opens the drawer when the finger lifts
    let state: 'idle' | 'pending' | 'pulling' | 'swipingUp' = 'idle';
    let startX = 0;
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let handleDragged = false;

    const panelHeight = () => window.innerHeight;
    const clampPull = (px: number) => Math.min(Math.max(px, 0), panelHeight());

    function track(y: number)
    {
        const now = performance.now();
        if (now > lastTime)
            velocity = (y - lastY) / (now - lastTime);
        lastY = y;
        lastTime = now;
    }

    function begin(x: number, y: number)
    {
        state = 'pending';
        startX = x;
        startY = lastY = y;
        lastTime = performance.now();
        velocity = 0;
    }

    function startPull(revealed: number)
    {
        state = 'pulling';
        clearTimeout(settleTimer);
        menu.notificationPullDragging = true;
        menu.notificationPull = revealed;
    }

    /** Lets go of the panel: it animates open, or closed and then goes away. */
    function settle(open: boolean, wasOpen: boolean)
    {
        state = 'idle';
        menu.notificationPullDragging = false;
        if (open)
        {
            if (!wasOpen) menu.showNotificationPanel();
            menu.notificationPull = null;
            return;
        }
        menu.notificationPull = 0;
        settleTimer = window.setTimeout(() =>
        {
            // closing first, so the leaving panel keeps its closed position instead of jumping back
            if (wasOpen) menu.closeAll();
            menu.notificationPull = null;
        }, SHADE_SETTLE_MS);
    }

    function releaseVelocity()
    {
        return performance.now() - lastTime > FLICK_MAX_PAUSE_MS ? 0 : velocity;
    }

    // --- pulling it down: touch listeners on the workspace and the status bar ---

    function onTouchStart(e: TouchEvent)
    {
        state = 'idle';
        if (e.touches.length !== 1 || menu.isAnythingOpen || drag.active) return;
        // lists inside widgets (agenda, headlines, messages) scroll instead
        if (startsInScroller(e.target, e.currentTarget)) return;
        begin(e.touches[0].clientX, e.touches[0].clientY);
    }

    function onTouchMove(e: TouchEvent)
    {
        if (state === 'idle') return;
        const t = e.touches[0];
        const dy = t.clientY - startY;

        if (state === 'pending')
        {
            const direction = shadeGestureDirection(t.clientX - startX, dy);
            if (direction === null) return;
            if (direction === 'other' || drag.active)
            {
                state = 'idle';
                return;
            }
            if (direction === 'up')
                state = 'swipingUp';
        }

        if (state === 'swipingUp')
        {
            if (e.cancelable) e.preventDefault();
            track(t.clientY);
            return;
        }

        if (state === 'pending')
        {
            if (notifications.isSupported)
                startPull(0);
            else
                state = 'pulling';
        }

        // keep the pages from scrolling sideways under the pull
        if (e.cancelable) e.preventDefault();
        track(t.clientY);
        if (notifications.isSupported)
            menu.notificationPull = clampPull(dy - SHADE_SLOP_PX);
    }

    function onTouchEnd()
    {
        if (state === 'swipingUp')
        {
            state = 'idle';
            if (!drag.active && swipeOpensDrawer(lastY - startY, releaseVelocity()))
                drawer.open();
            return;
        }
        if (state !== 'pulling')
        {
            state = 'idle';
            return;
        }

        if (!notifications.isSupported)
        {
            state = 'idle';
            if (shadeSettlesOpen(lastY - startY, panelHeight(), releaseVelocity()))
                bridgeRequest(t => Bridge.requestExpandNotificationShade(t));
            return;
        }
        settle(shadeSettlesOpen(menu.notificationPull ?? 0, panelHeight(), releaseVelocity()), false);
    }

    // --- pushing it back up: pointer listeners on the panel's handle ---

    function onHandleDown(e: PointerEvent)
    {
        handleDragged = false;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        begin(e.clientX, e.clientY);
    }

    function onHandleMove(e: PointerEvent)
    {
        if (state === 'idle') return;
        const dy = e.clientY - startY;

        if (state === 'pending')
        {
            if (dy > -SHADE_SLOP_PX) return;
            handleDragged = true;
            startPull(panelHeight());
        }

        track(e.clientY);
        menu.notificationPull = clampPull(panelHeight() + dy + SHADE_SLOP_PX);
    }

    function onHandleUp()
    {
        if (state === 'pulling')
            settle(shadeSettlesOpen(menu.notificationPull ?? 0, panelHeight(), releaseVelocity()), true);
        state = 'idle';
    }

    /** Call from the handle's click handler: true (once) if that click ended a drag and should be ignored. */
    function consumeHandleDrag()
    {
        const dragged = handleDragged;
        handleDragged = false;
        return dragged;
    }

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onHandleDown,
        onHandleMove,
        onHandleUp,
        consumeHandleDrag,
    };
}

/** Whether the touch began inside something that scrolls vertically, up to `boundary`. */
function startsInScroller(target: EventTarget | null, boundary: EventTarget | null): boolean
{
    for (let el = target instanceof Element ? target : null; el && el !== boundary; el = el.parentElement)
    {
        if (el.scrollHeight <= el.clientHeight + 1) continue;
        const overflowY = getComputedStyle(el).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return true;
    }
    return false;
}
