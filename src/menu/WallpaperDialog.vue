<script setup lang="ts">
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore, type Level, type NexusFps, type WallpaperKind } from '@/stores/useSettingsStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';
import GbRadioRow from '@/components/GbRadioRow.vue';

const menu = useMenuStore();
const settings = useSettingsStore();

const wallpaperOptions: { value: WallpaperKind; label: string; hint: string }[] = [
    { value: 'nexus', label: 'Nexus', hint: 'Pulsos de luz sobre una cuadrícula; tócalo para lanzar más' },
    { value: 'grass', label: 'Hierba', hint: 'Hierba mecida por el viento; el cielo sigue la hora del día' },
    { value: 'galaxy', label: 'Galaxia', hint: 'Una galaxia espiral que gira despacio' },
    { value: 'magicSmoke', label: 'Humo mágico', hint: 'Humo de colores; tócalo para removerlo' },
    { value: 'polarClock', label: 'Reloj polar', hint: 'La hora, el día y el mes en anillos de colores' },
    { value: 'system', label: 'Fondo del sistema', hint: 'La imagen elegida en Android' },
];

const densityOptions: { value: Level; label: string }[] = [
    { value: 'low', label: 'Pocos' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Muchos' },
];

const speedOptions: { value: Level; label: string }[] = [
    { value: 'low', label: 'Lenta' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Rápida' },
];

const fpsOptions: NexusFps[] = [30, 60, 120];

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'wallpaper'"
        title="Fondo de pantalla"
        @close="menu.closeAll()">

        <GbRadioRow
            v-for="opt in wallpaperOptions"
            :key="opt.value"
            name="wallpaper"
            :value="opt.value"
            :model-value="settings.wallpaper"
            :label="opt.label"
            :hint="opt.hint"
            @update:model-value="settings.wallpaper = opt.value" />

        <section v-if="settings.wallpaper !== 'system'" class="options">
            <template v-if="settings.wallpaper === 'nexus'">
                <div class="field-label">Cantidad de pulsos</div>
                <div class="segmented">
                    <button
                        v-for="opt in densityOptions"
                        :key="opt.value"
                        :class="{ selected: settings.nexusDensity === opt.value }"
                        @click="settings.nexusDensity = opt.value">
                        {{ opt.label }}
                    </button>
                </div>

                <div class="field-label">Velocidad</div>
                <div class="segmented">
                    <button
                        v-for="opt in speedOptions"
                        :key="opt.value"
                        :class="{ selected: settings.nexusSpeed === opt.value }"
                        @click="settings.nexusSpeed = opt.value">
                        {{ opt.label }}
                    </button>
                </div>
            </template>

            <div class="field-label">Fluidez (fotogramas por segundo)</div>
            <div class="segmented">
                <button
                    v-for="fps in fpsOptions"
                    :key="fps"
                    :class="{ selected: settings.nexusFps === fps }"
                    @click="settings.nexusFps = fps">
                    {{ fps }}
                </button>
            </div>
            <div class="field-hint">
                Más fluidez gasta más batería. 120 solo se nota en pantallas de 120 Hz.
            </div>
        </section>

        <section v-else class="options">
            <GbButton class="wide" @click="Bridge.requestChangeSystemWallpaper(true)">
                Elegir imagen…
            </GbButton>
        </section>

        <template #buttons>
            <GbButton @click="menu.closeAll()">Listo</GbButton>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
.options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 8px;

    > .field-label {
        font-size: 13px;
        opacity: 0.75;
    }

    > .field-hint {
        font-size: 12px;
        opacity: 0.55;
    }

    > .segmented {
        display: flex;
        border: 1px solid #5a5a5a;
        border-radius: 5px;
        overflow: hidden;

        > button {
            appearance: none;
            flex: 1;
            min-height: 40px;
            border: none;
            border-right: 1px solid #5a5a5a;
            background: linear-gradient(to bottom, #4a4a4a, #333);
            color: #e8e8e8;
            font: inherit;
            font-size: 14px;
            cursor: pointer;

            &:last-child {
                border-right: none;
            }

            &.selected {
                background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                color: #111;
            }

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }
    }

    > .wide {
        width: 100%;
    }
}
</style>
