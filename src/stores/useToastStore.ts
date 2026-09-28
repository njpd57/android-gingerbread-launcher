import { defineStore } from "pinia";
import { ref } from "vue";

// Android's Toast.LENGTH_SHORT and LENGTH_LONG
const SHORT_MS = 2000;
const LONG_MS = 3500;

/** The launcher's own toast (`components/GbToast.vue`), in Gingerbread's style instead of Bridge's. */
export const useToastStore = defineStore('toast', () =>
{
    const message = ref<string | null>(null);
    // bumped per toast, so the same text shown twice restarts the animation
    const id = ref(0);
    let timer = 0;

    function show(text: string, long = false)
    {
        message.value = text;
        id.value++;
        clearTimeout(timer);
        timer = window.setTimeout(() => message.value = null, long ? LONG_MS : SHORT_MS);
    }

    return {
        message,
        id,
        show,
    };
});
