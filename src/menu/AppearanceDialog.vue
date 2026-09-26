<script setup lang="ts">
import { computed } from 'vue';
import { useMenuStore } from '@/stores/useMenuStore';
import { MAX_GRID_ROWS, MIN_GRID_ROWS, useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import { MAX_ICON_SCALE, MIN_ICON_SCALE } from '@/utils/iconSize';
import { MAX_STATUS_BAR_HEIGHT, MAX_STATUS_BAR_SIDE_MARGIN, STATUS_BAR_ICONS, useSettingsStore, type StatusBarBackground, type StatusBarIcon } from '@/stores/useSettingsStore';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { useTogglesStore } from '@/stores/useTogglesStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import type { BridgeButtonVisibility } from '@bridgelauncher/api';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';
import GbRadioRow from '@/components/GbRadioRow.vue';
import GbCheckRow from '@/components/GbCheckRow.vue';

const menu = useMenuStore();
const layout = useHomeLayoutStore();
const settings = useSettingsStore();
const insets = useWindowInsetsStore();
const toggles = useTogglesStore();
const notifications = useNotificationsStore();

const statusBarKindOptions: { value: boolean; label: string }[] = [
    { value: false, label: 'Nativo' },
    { value: true, label: 'Gingerbread' },
];

const addIconOptions: { value: boolean; label: string }[] = [
    { value: true, label: 'Añadir icono' },
    { value: false, label: 'No añadir' },
];

const overscrollOptions: { value: boolean; label: string }[] = [
    { value: true, label: 'Brillo naranja' },
    { value: false, label: 'Efecto de Android' },
];

const bridgeButtonOptions: { value: BridgeButtonVisibility; label: string }[] = [
    { value: 'shown', label: 'Visible' },
    { value: 'hidden', label: 'Oculto' },
];

const statusBarOptions: { value: StatusBarBackground; label: string }[] = [
    { value: 'none', label: 'Transparente' },
    { value: 'gray', label: 'Degradado gris' },
    { value: 'blackGradient', label: 'Degradado negro' },
    { value: 'white', label: 'Blanco' },
    { value: 'black', label: 'Negro' },
];

const statusBarIconLabels: Record<StatusBarIcon, { label: string; hint?: string }> = {
    notifications: { label: 'Notificaciones' },
    bluetooth: { label: 'Bluetooth', hint: 'Cuando está encendido' },
    alarm: { label: 'Alarma', hint: 'Cuando hay una alarma puesta' },
    gps: { label: 'GPS', hint: 'Cuando la ubicación está encendida' },
    ringer: { label: 'Vibrar y silencio', hint: 'Cuando el timbre no suena' },
    dataActivity: { label: 'Actividad de datos', hint: 'Las flechas de subida y bajada' },
    wifi: { label: 'Wi-Fi' },
    signal: { label: 'Señal móvil' },
    battery: { label: 'Batería' },
};

function setStatusBarIcon(icon: StatusBarIcon, visible: boolean)
{
    settings.statusBarIcons = { ...settings.statusBarIcons, [icon]: visible };
}

const isHeightAuto = computed(() => settings.statusBarHeight < 0);

function onHeightInput(e: Event)
{
    settings.statusBarHeight = Number((e.target as HTMLInputElement).value);
}

function onIconScaleInput(e: Event)
{
    settings.iconScale = Number((e.target as HTMLInputElement).value);
}

function onSideMarginInput(e: Event)
{
    settings.statusBarSideMargin = Number((e.target as HTMLInputElement).value);
}

// 0 = automatic
const rowOptions = [0, ...Array.from({ length: MAX_GRID_ROWS - MIN_GRID_ROWS + 1 }, (_, i) => MIN_GRID_ROWS + i)];

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'appearance'"
        title="Apariencia"
        @close="menu.closeAll()">

        <div class="section-title">Barra de estado</div>

        <section class="options">
            <div class="segmented">
                <button
                    v-for="opt in statusBarKindOptions"
                    :key="opt.label"
                    :class="{ selected: settings.gingerbreadStatusBar === opt.value }"
                    @click="settings.gingerbreadStatusBar = opt.value">
                    {{ opt.label }}
                </button>
            </div>
            <div class="field-hint">
                <template v-if="settings.gingerbreadStatusBar">
                    Oculta la barra del sistema en el launcher y dibuja la de Gingerbread.
                    La hora y la batería son reales; la señal y el Wi-Fi también, con nuestro fork de Bridge
                    (si no, son decorativos).
                    <template v-if="notifications.canRead">Muestra los iconos de tus notificaciones.</template>
                    <template v-else>Los iconos de notificaciones son decorativos.</template>
                    Tócala para abrir las notificaciones.
                </template>
                <template v-else>
                    La barra del sistema, con un fondo opcional detrás. El color de sus iconos
                    se cambia en los ajustes de Bridge.
                </template>
            </div>
            <!-- only our Bridge fork can read notifications -->
            <GbButton
                v-if="settings.gingerbreadStatusBar && notifications.isSupported && !notifications.canRead"
                @click="notifications.requestAccess()">
                Mostrar notificaciones reales
            </GbButton>
        </section>

        <GbRadioRow
            v-for="opt in statusBarOptions"
            :key="opt.value"
            name="statusBarBackground"
            :value="opt.value"
            :model-value="settings.statusBarBackground"
            :label="opt.label"
            @update:model-value="settings.statusBarBackground = opt.value">
            <template #icon>
                <span class="swatch" :class="opt.value"></span>
            </template>
        </GbRadioRow>

        <section class="options">
            <div class="field-label">Altura de la barra</div>
            <div class="height-control">
                <button
                    class="auto"
                    :class="{ selected: isHeightAuto }"
                    @click="settings.statusBarHeight = -1">
                    Auto ({{ Math.round(insets.measuredStatusBarHeight) }} px)
                </button>
                <input
                    type="range"
                    min="0"
                    :max="MAX_STATUS_BAR_HEIGHT"
                    step="1"
                    :class="{ auto: isHeightAuto }"
                    :value="Math.round(insets.statusBarHeight)"
                    aria-label="Altura de la barra de estado"
                    @input="onHeightInput" />
                <span class="value">{{ Math.round(insets.statusBarHeight) }} px</span>
            </div>
            <div class="field-hint">
                Ajústala para que la barra no tape la cámara, o para que el fondo cubra justo la barra
                nativa. También mueve el contenido de las pantallas para que no quede debajo.
            </div>
        </section>

        <template v-if="settings.gingerbreadStatusBar">
            <section class="options">
                <div class="field-label">Iconos de la barra</div>
                <div class="field-hint">
                    La hora siempre se muestra. Bluetooth, alarma, GPS y modo de sonido necesitan nuestro fork de Bridge.
                </div>
            </section>
            <GbCheckRow
                v-for="icon in STATUS_BAR_ICONS"
                :key="icon"
                :label="statusBarIconLabels[icon].label"
                :hint="statusBarIconLabels[icon].hint"
                :model-value="settings.statusBarIcons[icon]"
                @update:model-value="setStatusBarIcon(icon, $event)" />
        </template>

        <section v-if="settings.gingerbreadStatusBar" class="options">
            <div class="field-label">Margen lateral de la barra</div>
            <div class="height-control">
                <input
                    type="range"
                    min="0"
                    :max="MAX_STATUS_BAR_SIDE_MARGIN"
                    step="1"
                    :value="settings.statusBarSideMargin"
                    aria-label="Margen lateral de la barra de estado"
                    @input="onSideMarginInput" />
                <span class="value">{{ settings.statusBarSideMargin }} px</span>
            </div>
            <div class="field-hint">
                Separa los iconos y la hora de los bordes, para que las esquinas redondeadas
                de la pantalla no los tapen.
            </div>
        </section>

        <div class="section-title">Pantalla de inicio</div>

        <section class="options">
            <div class="field-label">Filas por pantalla (4 columnas)</div>
            <div class="segmented rows">
                <button
                    v-for="rows in rowOptions"
                    :key="rows"
                    :class="{ selected: layout.rowsSetting === rows }"
                    @click="layout.rowsSetting = rows">
                    {{ rows === 0 ? `Auto (${layout.autoRows})` : rows }}
                </button>
            </div>
            <div class="field-hint">
                «Auto» elige las filas según el alto de tu pantalla.
                Si reduces las filas, lo que no quepa se mueve a un hueco libre.
            </div>
        </section>

        <section class="options">
            <div class="field-label">Tamaño de los iconos</div>
            <div class="height-control">
                <button
                    class="auto"
                    :class="{ selected: settings.iconScale === 100 }"
                    @click="settings.iconScale = 100">
                    Normal
                </button>
                <input
                    type="range"
                    :min="MIN_ICON_SCALE"
                    :max="MAX_ICON_SCALE"
                    step="5"
                    :value="settings.iconScale"
                    aria-label="Tamaño de los iconos"
                    @input="onIconScaleInput" />
                <span class="value">{{ settings.iconScale }} %</span>
            </div>
            <div class="field-hint">
                Cambia los iconos del escritorio, las carpetas y el cajón de aplicaciones. En el escritorio
                nunca crecen más de lo que cabe en su celda, así que con muchas filas pueden quedar más chicos.
            </div>
        </section>

        <section class="options">
            <div class="field-label">Al instalar una aplicación</div>
            <div class="segmented">
                <button
                    v-for="opt in addIconOptions"
                    :key="opt.label"
                    :class="{ selected: settings.addIconOnInstall === opt.value }"
                    @click="settings.addIconOnInstall = opt.value">
                    {{ opt.label }}
                </button>
            </div>
            <div class="field-hint">
                Pone el icono en el primer hueco libre de la pantalla central (o de las demás si está llena),
                como hacía el Market.
            </div>
        </section>

        <section class="options">
            <div class="field-label">Al llegar al final de una lista</div>
            <div class="segmented">
                <button
                    v-for="opt in overscrollOptions"
                    :key="opt.label"
                    :class="{ selected: settings.gingerbreadOverscroll === opt.value }"
                    @click="settings.gingerbreadOverscroll = opt.value">
                    {{ opt.label }}
                </button>
            </div>
            <div class="field-hint">
                «Brillo naranja» es el efecto de Gingerbread: aparece en el cajón, las carpetas, los diálogos
                y en los extremos del escritorio. Desactiva el efecto de Android mientras está elegido.
            </div>
        </section>

        <section class="options">
            <div class="field-label">Botón flotante de Bridge</div>
            <div class="segmented">
                <button
                    v-for="opt in bridgeButtonOptions"
                    :key="opt.value"
                    :class="{ selected: toggles.bridgeButtonVisibility === opt.value }"
                    @click="toggles.bridgeButtonVisibility = opt.value">
                    {{ opt.label }}
                </button>
            </div>
            <div class="field-hint">
                Ocultarlo deja libre el dock. Los ajustes de Bridge siguen en el menú de opciones (Bridge).
            </div>
        </section>

        <section class="options">
            <GbButton @click="menu.showDialog('about')">Acerca de y diagnóstico</GbButton>
            <div class="field-hint">
                Versiones, insets que informa Bridge, permisos, el último error y los últimos eventos.
                Sirve para encontrar fallos sin conectar el teléfono al ordenador.
            </div>
        </section>

        <template #buttons>
            <GbButton @click="menu.closeAll()">Listo</GbButton>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

// Gingerbread list section header: small caps text on a gray band
.section-title {
    padding: 4px 16px;
    background: linear-gradient(to bottom, #5a5a5a, #454545);
    color: #e0e0e0;
    font-size: 13px;
    font-weight: bold;
}

// small preview of each status bar style (same look as App.vue's .status-bar-bg)
.swatch {
    flex-shrink: 0;
    width: 40px;
    height: 16px;
    border: 1px solid #777;
    border-radius: 2px;

    &.none {
        background:
            linear-gradient(45deg, #444 25%, transparent 25%, transparent 75%, #444 75%) 0 0 / 8px 8px,
            linear-gradient(45deg, #444 25%, #222 25%, #222 75%, #444 75%) 4px 4px / 8px 8px;
    }

    &.gray {
        background: linear-gradient(to bottom, #f2f2f2, #c4c4c4);
    }

    &.blackGradient {
        background: linear-gradient(to bottom, #3c3c3c, #0c0c0c 70%, #000);
    }

    &.white {
        background-color: #fff;
    }

    &.black {
        background-color: #000;
    }
}

.options {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px 12px;

    > .field-label {
        font-size: 13px;
        opacity: 0.75;
    }

    > .field-hint {
        font-size: 12px;
        opacity: 0.55;
    }

    > .height-control {
        display: flex;
        align-items: center;
        gap: 10px;

        > .auto {
            appearance: none;
            flex-shrink: 0;
            min-height: 40px;
            padding: 0 10px;
            border: 1px solid #5a5a5a;
            border-radius: 5px;
            background: linear-gradient(to bottom, #4a4a4a, #333);
            color: #e8e8e8;
            font: inherit;
            font-size: 14px;
            white-space: nowrap;
            cursor: pointer;

            &.selected {
                background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                color: #111;
            }

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }

        // Gingerbread seek bar: orange progress on a dark track
        > input[type="range"] {
            flex: 1;
            min-width: 0;
            height: 32px;
            accent-color: $gingerbread-orange;

            // dimmed while following the automatic height
            &.auto {
                opacity: 0.5;
            }
        }

        > .value {
            flex-shrink: 0;
            width: 44px;
            text-align: right;
            font-size: 14px;
        }
    }

    // "Auto (n)" needs more room than the plain numbers
    > .segmented.rows > button:first-child {
        flex: 2;
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
            padding: 0 4px;
            border: none;
            border-right: 1px solid #5a5a5a;
            background: linear-gradient(to bottom, #4a4a4a, #333);
            color: #e8e8e8;
            font: inherit;
            font-size: 14px;
            white-space: nowrap;
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
}
</style>
