<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { ANKH, egyptianArcanumOfTheDay } from './egyptianTarot';
import DailyCardWidget from '@/widgets/tarot/DailyCardWidget.vue';

// Egyptian tarot arcanum of the day (4x2). No scans here: the card is drawn on papyrus, with the
// arcanum's number, its hieroglyph and its name.

defineProps<{
    widgetId?: string;
}>();

const now = useNow({ interval: 60_000 });
const arcanum = computed(() => egyptianArcanumOfTheDay(now.value));
const heading = computed(() => `Arcano ${arcanum.value.roman} · ${arcanum.value.name}`);
</script>

<template>
    <DailyCardWidget :widget-id="widgetId" title="Tarot egipcio · arcano del día" :reading-title="heading">
        <template #back>
            <div class="egyptian-back">
                <span class="glyph">{{ ANKH }}</span>
            </div>
        </template>

        <template #face>
            <div class="egyptian-face">
                <span class="number">{{ arcanum.roman }}</span>
                <span class="glyph">{{ arcanum.glyph }}</span>
                <span class="name">{{ arcanum.name }}</span>
            </div>
        </template>

        <template #info>
            <div class="name">{{ arcanum.name }}</div>
            <div class="alias">Arcano {{ arcanum.roman }} · {{ arcanum.alias }}</div>
            <p class="message">{{ arcanum.message }}</p>
        </template>

        <template #reading>
            <div class="reading-card egyptian-face">
                <span class="number">{{ arcanum.roman }}</span>
                <span class="glyph">{{ arcanum.glyph }}</span>
                <span class="name">{{ arcanum.name }}</span>
            </div>
            <p class="reading-alias">{{ arcanum.alias }}</p>
            <p>{{ arcanum.message }}</p>
        </template>
    </DailyCardWidget>
</template>

<style scoped lang="scss">
$gold: #c9a24a;
$lapis: #1d3a78;

.glyph {
    font-family: "Noto Sans Egyptian Hieroglyphs", serif;
    line-height: 1;
}

// the back: lapis lazuli with a gold frame and an ankh
.egyptian-back {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 3px solid $gold;
    border-radius: 5px;
    background: radial-gradient(circle at 50% 40%, #2d5199, $lapis 70%, #0f2048);

    > .glyph {
        font-size: 44px;
        color: $gold;
        text-shadow: 0 1px 2px #000;
    }
}

// the face: papyrus inside a gold and lapis border, like a painted tomb panel
.egyptian-face {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 6px 4px;
    border: 3px solid $gold;
    border-radius: 5px;
    outline: 2px solid $lapis;
    outline-offset: -6px;
    background: linear-gradient(to bottom, #efdcae, #d9bc80);
    color: #3b2a12;
    text-shadow: none;

    > .number {
        font-size: 13px;
        font-weight: bold;
    }

    > .glyph {
        font-size: 46px;
        color: #2a1c0a;
    }

    > .name {
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
    }
}

.name {
    font-size: 16px;
    font-weight: bold;
}

.alias {
    font-size: 12px;
    color: rgba(#fff, 0.6);
    font-style: italic;
}

.message {
    margin: 2px 0 0;
    font-size: 14px;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.reading-card {
    width: 120px;
    height: 204px;
    margin: 0 auto 12px;

    > .glyph {
        font-size: 64px;
    }

    > .name {
        font-size: 11px;
    }
}

.reading-alias {
    font-style: italic;
    opacity: 0.7;
    text-align: center;
}
</style>
