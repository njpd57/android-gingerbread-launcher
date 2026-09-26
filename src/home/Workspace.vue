<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { PAGE_COUNT, useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import OverscrollGlow from '@/components/OverscrollGlow.vue';

const workspace = useWorkspaceStore();
const settings = useSettingsStore();

const el = ref<HTMLElement>();

const glow = useOverscrollGlow(el, 'x', () => settings.gingerbreadOverscroll);

function scrollToPage(page: number, smooth: boolean)
{
    if (!el.value) return;
    el.value.scrollTo({
        left: page * el.value.clientWidth,
        behavior: smooth ? 'smooth' : 'instant',
    });
}

function onScroll()
{
    if (!el.value || el.value.clientWidth === 0) return;
    const { scrollLeft, scrollWidth, clientWidth } = el.value;
    workspace.currentPage = Math.round(scrollLeft / clientWidth);
    const maxScroll = scrollWidth - clientWidth;
    workspace.scrollProgress = maxScroll > 0 ? scrollLeft / maxScroll : 0.5;
}

onMounted(() => scrollToPage(workspace.currentPage, false));

// keep the current page in place when the screen size changes (e.g. rotation)
useResizeObserver(el, () => scrollToPage(workspace.currentPage, false));

watch(() => workspace.pendingPage, page =>
{
    if (page === null) return;
    scrollToPage(page, true);
    workspace.pendingPage = null;
});

</script>

<template>
    <div class="workspace-frame">
        <div class="inner">
            <div class="scroller" ref="el" @scroll.passive="onScroll">
                <section
                    v-for="i in PAGE_COUNT"
                    :key="i"
                    class="page">
                    <slot :page="i - 1"></slot>
                </section>
            </div>
            <OverscrollGlow edge="left" :intensity="glow.start.value" :pulling="glow.pulling.value" />
            <OverscrollGlow edge="right" :intensity="glow.end.value" :pulling="glow.pulling.value" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.workspace-frame {
    width: 100%;
    height: 100%;

    > .inner {
        position: relative;
        width: 100%;
        height: 100%;
    }
}

.scroller {
    display: flex;
    width: 100%;
    height: 100%;
    overflow-x: auto;
    overscroll-behavior-x: none;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }

    > .page {
        flex: 0 0 100%;
        height: 100%;
        scroll-snap-align: start;
        scroll-snap-stop: always;
    }
}
</style>
