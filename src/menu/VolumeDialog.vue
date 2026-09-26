<script setup lang="ts">
import { computed } from 'vue';
import { useMenuStore } from '@/stores/useMenuStore';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';
import GbSlider from '@/components/GbSlider.vue';
import AudioIcon from '@/home/icons/AudioIcon.vue';

// Gingerbread's volume panel, opened by long-pressing the ringer mode button (quick toggles and the
// power widget). Our Bridge fork can set the media volume; the ringer's is left to Android's panel.

const menu = useMenuStore();
const qs = useQuickSettingsStore();

const percent = computed(() => Math.round(qs.musicVolume * 100));

function openAndroidVolume()
{
    menu.closeAll();
    qs.openPanel('volume');
}
</script>

<template>
    <GbDialog :open="menu.openDialog === 'volume'" title="Volumen" @close="menu.closeAll()">
        <div class="volume">
            <div class="row">
                <span class="label">Multimedia</span>
                <span class="value">{{ percent }} %</span>
            </div>
            <div class="slider-row">
                <AudioIcon class="icon" :mode="qs.musicVolume > 0 ? 'normal' : 'silent'" />
                <GbSlider
                    label="Volumen multimedia"
                    :model-value="qs.musicVolume"
                    @update:model-value="qs.setMusicVolume" />
            </div>
            <p class="hint">El volumen del timbre y de las notificaciones se cambia en Android.</p>
        </div>
        <template #buttons>
            <GbButton @click="openAndroidVolume">Más ajustes</GbButton>
            <GbButton @click="menu.closeAll()">Listo</GbButton>
        </template>
    </GbDialog>
</template>

<style scoped lang="scss">
.volume {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px 10px;

    > .row {
        display: flex;
        justify-content: space-between;
        font-size: 15px;

        > .value {
            opacity: 0.7;
        }
    }

    > .slider-row {
        display: flex;
        align-items: center;
        gap: 10px;

        > .icon {
            flex-shrink: 0;
            width: 26px;
            height: 26px;
        }
    }

    > .hint {
        margin: 4px 0 0;
        font-size: 12px;
        opacity: 0.6;
    }
}
</style>
