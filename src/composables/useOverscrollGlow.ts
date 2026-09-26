import { onBeforeUnmount, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from "vue";

// how far the finger has to pull past the edge for a full-strength glow
const FULL_PULL_PX = 180;
// a fling that hits the edge "absorbs" into a short flash of this strength
const ABSORB_INTENSITY = 0.6;
const ABSORB_MS = 120;

/**
 * Gingerbread's overscroll glow: tracks how far the user pulls past the start or end of a
 * scroll container (touch only) and exposes a 0..1 intensity for each edge.
 * `start` is the top (axis 'y') or left (axis 'x') edge, `end` the bottom or right one.
 */
export function useOverscrollGlow(
    target: Ref<HTMLElement | undefined>,
    axis: 'x' | 'y',
    enabled: MaybeRefOrGetter<boolean> = true,
)
{
    const start = ref(0);
    const end = ref(0);
    // while the finger is down the glow follows it; on release it fades out (CSS transition)
    const pulling = ref(false);

    let touching = false;
    // finger position when the edge was reached during the current gesture, or null
    let startAnchor: number | null = null;
    let endAnchor: number | null = null;
    let wasAtStart = true;
    let wasAtEnd = false;
    let absorbTimer = 0;

    function pos(e: TouchEvent)
    {
        const t = e.touches[0];
        return axis === 'y' ? t.clientY : t.clientX;
    }

    function edges(el: HTMLElement)
    {
        const scroll = axis === 'y' ? el.scrollTop : el.scrollLeft;
        const max = axis === 'y' ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
        return { atStart: scroll <= 0, atEnd: scroll >= max - 1 };
    }

    function reset()
    {
        start.value = 0;
        end.value = 0;
        startAnchor = null;
        endAnchor = null;
    }

    function onTouchStart(e: TouchEvent)
    {
        if (!toValue(enabled) || e.touches.length !== 1) return;
        touching = true;
        pulling.value = true;
        reset();
    }

    function onTouchMove(e: TouchEvent)
    {
        const el = target.value;
        if (!touching || !el) return;

        const p = pos(e);
        const { atStart, atEnd } = edges(el);

        // start (top/left) edge: pulling the content "down/right" past it
        if (atStart)
        {
            startAnchor ??= p;
            start.value = Math.max(0, Math.min(1, (p - startAnchor) / FULL_PULL_PX));
        }
        else
        {
            startAnchor = null;
            start.value = 0;
        }

        // end (bottom/right) edge: pulling "up/left" past it
        if (atEnd)
        {
            endAnchor ??= p;
            end.value = Math.max(0, Math.min(1, (endAnchor - p) / FULL_PULL_PX));
        }
        else
        {
            endAnchor = null;
            end.value = 0;
        }
    }

    function onTouchEnd()
    {
        touching = false;
        pulling.value = false;
        reset();
    }

    // a fling (no finger down) that reaches an edge flashes the glow briefly
    function onScroll()
    {
        const el = target.value;
        if (!el) return;
        const { atStart, atEnd } = edges(el);

        if (!touching && toValue(enabled))
        {
            if (atStart && !wasAtStart) absorb(start);
            if (atEnd && !wasAtEnd) absorb(end);
        }

        wasAtStart = atStart;
        wasAtEnd = atEnd;
    }

    function absorb(edge: Ref<number>)
    {
        clearTimeout(absorbTimer);
        pulling.value = true;
        edge.value = ABSORB_INTENSITY;
        absorbTimer = window.setTimeout(() =>
        {
            pulling.value = false;
            edge.value = 0;
        }, ABSORB_MS);
    }

    function attach(el: HTMLElement)
    {
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: true });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('touchcancel', onTouchEnd, { passive: true });
        el.addEventListener('scroll', onScroll, { passive: true });
    }

    function detach(el: HTMLElement)
    {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchEnd);
        el.removeEventListener('scroll', onScroll);
    }

    watch(target, (el, old) =>
    {
        if (old) detach(old);
        if (el) attach(el);
    }, { immediate: true });

    onBeforeUnmount(() =>
    {
        clearTimeout(absorbTimer);
        if (target.value) detach(target.value);
    });

    return {
        start,
        end,
        pulling,
    };
}
