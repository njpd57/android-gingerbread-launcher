<script setup lang="ts">
import { computed } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { isGingerbreadWallpaper, wallpaperImageLayout, wallpaperURL } from '@/utils/gingerbreadWallpapers';

// One of Android 2.3's still wallpapers, scrolling across its width as the pages go by, like the
// live wallpapers do (without their canvas: it's an image moved with a transform).

const settings = useSettingsStore();
const workspace = useWorkspaceStore();
const windowSize = useWindowSize();

const src = computed(() => wallpaperURL(isGingerbreadWallpaper(settings.imageWallpaper) ? settings.imageWallpaper : 'electric'));
const layout = computed(() => wallpaperImageLayout(windowSize.width.value, windowSize.height.value));
const style = computed(() => ({
    width: `${layout.value.width}px`,
    height: `${layout.value.height}px`,
    transform: `translate(${-workspace.scrollProgress * layout.value.scrollRange}px, ${layout.value.top}px)`,
}));
</script>

<template>
    <div class="image-wallpaper" aria-hidden="true">
        <img :src="src" :style="style" alt="" draggable="false" />
    </div>
</template>

<style scoped lang="scss">
.image-wallpaper {
    position: absolute;
    inset: 0;
    overflow: hidden;

    > img {
        position: absolute;
        top: 0;
        left: 0;
        display: block;
        will-change: transform;
    }
}
</style>
