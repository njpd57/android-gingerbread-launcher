<script setup lang="ts">
import { useMenuStore } from '@/stores/useMenuStore';
import SearchGlyph from './SearchGlyph.vue';

// Gingerbread's Google search bar (4x1), searching installed apps instead of the web:
// a blue badge on the left and a light field; tapping it opens the search panel.

const menu = useMenuStore();
</script>

<template>
    <button class="search-widget" aria-label="Buscar aplicaciones" @click="menu.showSearch()">
        <span class="badge">
            <SearchGlyph />
            <span class="caret"></span>
        </span>
        <span class="field">Buscar aplicaciones</span>
    </button>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.search-widget {
    appearance: none;
    display: flex;
    align-items: stretch;
    width: 100%;
    height: 52px;
    padding: 4px;
    border: 1px solid rgba(#000, 0.5);
    border-radius: 6px;
    background: linear-gradient(to bottom, #f4f4f4, #cfcfcf);
    box-shadow: 0 3px 8px rgba(#000, 0.5), inset 0 1px 0 rgba(#fff, 0.8);
    font: inherit;
    cursor: pointer;

    // the blue square on the left, where Gingerbread had the Google "g"
    > .badge {
        position: relative;
        display: grid;
        place-items: center;
        width: 44px;
        margin-right: 4px;
        border: 1px solid #1f4f99;
        border-radius: 4px;
        background: linear-gradient(to bottom, #6fa0e8, #2f67c5);
        color: #fff;

        > :deep(svg) {
            width: 26px;
            height: 26px;
            filter: drop-shadow(0 1px 1px rgba(#000, 0.4));
        }

        // the small triangle under the badge that opened Gingerbread's search source menu
        > .caret {
            position: absolute;
            right: 4px;
            bottom: 3px;
            border: 3px solid transparent;
            border-top-color: rgba(#fff, 0.8);
            border-right-color: rgba(#fff, 0.8);
            transform: rotate(135deg);
        }
    }

    > .field {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 0 12px;
        border: 1px solid #9a9a9a;
        border-radius: 3px;
        background: linear-gradient(to bottom, #e8e8e8, #fff 30%);
        box-shadow: inset 0 1px 2px rgba(#000, 0.25);
        color: #9a9a9a;
        font-size: 18px;
        text-align: left;
    }

    &:active > .field {
        border-color: $gingerbread-orange;
        box-shadow: 0 0 0 2px rgba($gingerbread-orange, 0.6), inset 0 1px 2px rgba(#000, 0.25);
    }
}
</style>
