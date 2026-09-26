import { computed, onBeforeUnmount, ref } from "vue";
import { useWindowInsetsStore } from "@/stores/useWindowInsetsStore";

/**
 * How many CSS px at the bottom of the window the on-screen keyboard still covers,
 * so content can be padded to stay visible above it.
 *
 * Depending on how Bridge's activity handles the keyboard, the WebView may shrink when it opens
 * (then the keyboard covers nothing extra) or stay full size (then it covers its whole height).
 * Bridge's IME inset is the keyboard's full height, so the part the window already shrank by is
 * subtracted; without that inset, the visual viewport is used as a fallback.
 */
export function useKeyboardInset()
{
    const insets = useWindowInsetsStore();

    const innerHeight = ref(window.innerHeight);
    const visualHeight = ref(window.visualViewport?.height ?? window.innerHeight);
    // the tallest the window has been at the current width, i.e. with the keyboard closed
    let fullHeight = window.innerHeight;
    let fullHeightWidth = window.innerWidth;

    function update()
    {
        if (window.innerWidth !== fullHeightWidth)
        {
            // rotated or resized sideways: start over
            fullHeightWidth = window.innerWidth;
            fullHeight = window.innerHeight;
        }
        fullHeight = Math.max(fullHeight, window.innerHeight);
        innerHeight.value = window.innerHeight;
        visualHeight.value = window.visualViewport?.height ?? window.innerHeight;
    }

    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    onBeforeUnmount(() =>
    {
        window.removeEventListener('resize', update);
        window.visualViewport?.removeEventListener('resize', update);
    });

    const inset = computed(() =>
    {
        const shrunk = fullHeight - innerHeight.value;
        if (insets.imeBottom > 0)
            return Math.max(0, insets.imeBottom - shrunk);
        return Math.max(0, innerHeight.value - visualHeight.value);
    });

    return inset;
}
