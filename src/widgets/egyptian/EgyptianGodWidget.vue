<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { egyptianGodOfTheDay } from './egyptianGods';
import WidgetDialog from '@/components/WidgetDialog.vue';

// Message of the day from a god of ancient Egypt (4x1): its hieroglyph in a gold cartouche, and what
// it says. Tapping shows the whole message.

defineProps<{
    widgetId?: string;
}>();

const now = useNow({ interval: 60_000 });
const god = computed(() => egyptianGodOfTheDay(now.value));
const open = ref(false);
</script>

<template>
    <div class="egyptian-god-widget" @click="widgetId && (open = true)">
        <div class="cartouche"><span class="glyph">{{ god.glyph }}</span></div>
        <div class="text">
            <div class="who"><strong>{{ god.name }}</strong> · {{ god.domain }}</div>
            <p class="message">«{{ god.message }}»</p>
        </div>

        <WidgetDialog :open="open" :title="`${god.name}, ${god.domain}`" @close="open = false">
            <div class="reading">
                <div class="cartouche big"><span class="glyph">{{ god.glyph }}</span></div>
                <p>«{{ god.message }}»</p>
            </div>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
$gold: #c9a24a;

.egyptian-god-widget {
    @include gb-widget-glossy;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 6px 10px;
    cursor: pointer;

    > .text {
        flex: 1;
        min-width: 0;
        text-shadow: 0 1px 2px #000;

        > .who {
            overflow: hidden;
            font-size: 12px;
            color: $gold;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        > .message {
            margin: 2px 0 0;
            font-size: 14px;
            font-style: italic;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    }
}

// a cartouche: the rounded frame around royal and divine names, on papyrus
.cartouche {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 44px;
    height: 60px;
    border: 2px solid $gold;
    border-radius: 22px;
    background: linear-gradient(to bottom, #efdcae, #d9bc80);
    box-shadow: 0 1px 3px rgba(#000, 0.6);

    > .glyph {
        font-family: "Noto Sans Egyptian Hieroglyphs", serif;
        font-size: 30px;
        line-height: 1;
        color: #2a1c0a;
    }

    &.big {
        width: 70px;
        height: 100px;
        margin: 0 auto 12px;
        border-radius: 35px;

        > .glyph {
            font-size: 50px;
        }
    }
}

.reading {
    padding: 12px 16px 4px;
    font-size: 17px;
    font-style: italic;
    text-align: center;
}
</style>
