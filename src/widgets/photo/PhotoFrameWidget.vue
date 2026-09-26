<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import { loadPhoto, prunePhotos, savePhoto } from './photo-storage';
import { shrinkImage } from './resize';

// Gingerbread's photo frame (2x2): a photo with a white border, slightly tilted. Tapping it picks a
// photo with <input type="file">, which only opens Android's picker on our Bridge fork (improvement 1.2).
// The photo is shrunk and kept in IndexedDB under the widget's id.

const props = defineProps<{
    widgetId?: string;
}>();

const layout = useHomeLayoutStore();

const inputEl = ref<HTMLInputElement>();
const photoUrl = ref<string | null>(null);
const isLoading = ref(false);

function showPhoto(photo: Blob | null)
{
    if (photoUrl.value)
        URL.revokeObjectURL(photoUrl.value);
    photoUrl.value = photo ? URL.createObjectURL(photo) : null;
}

onMounted(async () =>
{
    if (props.widgetId)
        showPhoto(await loadPhoto(props.widgetId).catch(() => null));

    // removing a widget doesn't know about its photo, so leftovers are cleaned up here
    const frameIds = layout.items
        .filter(i => i.type === 'widget' && i.widget === 'photo')
        .map(i => i.id);
    prunePhotos(frameIds).catch(() => { /* best effort */ });
});

onBeforeUnmount(() => showPhoto(null));

function pickPhoto()
{
    if (!isLoading.value)
        inputEl.value?.click();
}

async function onPicked()
{
    const input = inputEl.value;
    const file = input?.files?.[0];
    if (input) input.value = '';
    if (!file || !props.widgetId) return;

    isLoading.value = true;
    try
    {
        const photo = await shrinkImage(file);
        await savePhoto(props.widgetId, photo);
        showPhoto(photo);
    }
    catch
    {
        Bridge.showToast('No se pudo cargar la foto.');
    }
    finally
    {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="photo-frame-widget">
        <button
            type="button"
            class="frame"
            :class="{ empty: !photoUrl, loading: isLoading }"
            :aria-label="photoUrl ? 'Cambiar foto' : 'Elegir foto'"
            @click="pickPhoto">
            <img v-if="photoUrl" :src="photoUrl" alt="" draggable="false" />
            <span v-else class="hint">{{ isLoading ? 'Cargando…' : 'Toca para elegir una foto' }}</span>
        </button>
        <input ref="inputEl" type="file" accept="image/*" hidden @change="onPicked" />
    </div>
</template>

<style scoped lang="scss">
.photo-frame-widget {
    display: grid;
    place-items: center;
    height: 100%;
    container-type: size;

    > .frame {
        appearance: none;
        display: grid;
        place-items: center;
        // square, leaving room for the tilt and the shadow
        width: min(84cqw, 84cqh);
        aspect-ratio: 1;
        padding: 5%;
        border: none;
        border-radius: 2px;
        background: #fafafa;
        box-shadow: 0 4px 10px rgba(#000, 0.6);
        transform: rotate(-4deg);
        cursor: pointer;
        transition: filter 0.1s;

        > img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
        }

        &.empty {
            background: linear-gradient(to bottom, #fafafa, #e6e6e6);
        }

        > .hint {
            padding: 0 8%;
            color: #666;
            font: inherit;
            font-size: 14px;
            line-height: 1.3;
            text-align: center;
        }

        &.loading {
            opacity: 0.7;
        }

        // Gingerbread's orange pressed glow
        &:active {
            filter: drop-shadow(0 0 6px #ffa800) drop-shadow(0 0 3px #ffa800);
        }
    }
}
</style>
