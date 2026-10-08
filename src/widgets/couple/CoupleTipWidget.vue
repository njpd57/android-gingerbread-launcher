<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { coupleTipOfTheDay } from './coupleTips';

// A relationship tip that changes every day (4x1), from a list bundled with the launcher.

const now = useNow({ interval: 60_000 });
const tip = computed(() => coupleTipOfTheDay(now.value));
</script>

<template>
    <div class="couple-tip-widget">
        <svg class="heart" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.5 1.2 4.4 2.6.9-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" />
        </svg>
        <div class="text">
            <div class="title">Consejo de pareja</div>
            <p class="tip">{{ tip }}</p>
        </div>
    </div>
</template>

<style scoped lang="scss">
.couple-tip-widget {
    @include gb-widget-glossy;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 6px 12px;

    // a glossy red heart, like the emblems of the time
    > .heart {
        flex-shrink: 0;
        width: 34px;
        height: 34px;
        fill: #d8283a;
        stroke: #ff8a93;
        stroke-width: 0.8;
        filter: drop-shadow(0 1px 2px #000);
    }

    > .text {
        flex: 1;
        min-width: 0;
        text-shadow: 0 1px 2px #000;

        > .title {
            font-size: 12px;
            color: #ff8a93;
        }

        > .tip {
            margin: 2px 0 0;
            font-size: 14px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
}
</style>
