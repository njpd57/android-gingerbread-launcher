<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useNow } from '@vueuse/core';
import { useMenuStore } from '@/stores/useMenuStore';
import { useBridgeEventStore } from '@/stores/useBridgeEventStore';
import { useWindowInsetsStore } from '@/stores/useWindowInsetsStore';
import { useHomeLayoutStore } from '@/stores/useHomeLayoutStore';
import { useTogglesStore } from '@/stores/useTogglesStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import { useHomeGridSize } from '@/composables/useHomeGridSize';
import { useKeyboardInset } from '@/composables/useKeyboardInset';
import { bridgeHas } from '@/utils/bridge-utils';
import { formatInsets } from '@/utils/diagnostics';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

// "Acerca de y diagnóstico": versions, the screen, the insets Bridge reports (live), permissions, the
// last API error and the last Bridge events. Made for finding bugs on the phone without adb.

const menu = useMenuStore();
const bridgeEvents = useBridgeEventStore();
const insets = useWindowInsetsStore();
const layout = useHomeLayoutStore();
const toggles = useTogglesStore();
const notifications = useNotificationsStore();
const calendar = useCalendarStore();
const qs = useQuickSettingsStore();
const grid = useHomeGridSize();
const keyboardInset = useKeyboardInset();

const isOpen = computed(() => menu.openDialog === 'about');

const build = __BUILD_INFO__;
const buildLabel = `${build.commit}${build.dirty ? ' + cambios sin commit' : ''}`;
const buildDate = new Date(build.date).toLocaleString('es');

// read once: they don't change while the launcher runs
const bridgeVersion = bridgeHas('getBridgeVersionName')
    ? `${Bridge.getBridgeVersionName()} (${Bridge.getBridgeVersionCode()})`
    : 'desconocida';
const androidApi = bridgeHas('getAndroidAPILevel') ? String(Bridge.getAndroidAPILevel()) : 'desconocido';
// requestOpenUrl only exists in our fork
const hasFork = bridgeHas('requestOpenUrl');

const lastError = ref<string | null>(null);
function readLastError()
{
    lastError.value = bridgeHas('getLastErrorMessage') ? Bridge.getLastErrorMessage() : null;
}
watch(isOpen, open =>
{
    if (open) readLastError();
});

const now = useNow({ interval: 1000 });

// summarized only while the dialog shows them
const recentEvents = computed(() => bridgeEvents.recentEvents());

const screenRows = computed(() => [
    ['Ventana', `${grid.windowSize.width.value} × ${grid.windowSize.height.value} px (×${window.devicePixelRatio})`],
    ['Cuadrícula', `${layout.rows} filas, celda ${Math.round(grid.cellWidth.value)} × ${Math.round(grid.cellHeight.value)} px`],
]);

const INSET_NAMES = [
    ['statusBars', 'Barra de estado'],
    ['statusBarsIgnoringVisibility', 'Barra de estado (oculta o no)'],
    ['navigationBars', 'Barra de navegación'],
    ['navigationBarsIgnoringVisibility', 'Barra de navegación (oculta o no)'],
    ['systemBars', 'Barras del sistema'],
    ['displayCutout', 'Recorte de la cámara'],
    ['ime', 'Teclado'],
] as const;

const insetRows = computed(() => [
    ...INSET_NAMES.map(([key, label]) => [label, formatInsets(insets.insets[key])]),
    ['Alto usado: barra de estado', `${Math.round(insets.statusBarHeight)} px`],
    ['Alto usado: navegación', `${Math.round(insets.navigationBarHeight)} px`],
    ['Hueco para el teclado', `${Math.round(keyboardInset.value)} px`],
]);

const yesNo = (v: boolean) => v ? 'sí' : 'no';
const permissionRows = computed(() => [
    ['Bloquear pantalla', toggles.supportsLockScreen ? yesNo(toggles.canLockScreen) : 'no disponible'],
    ['Modo noche', toggles.supportsNightMode ? yesNo(toggles.canRequestSystemNightMode) : 'no disponible'],
    ['Notificaciones', notifications.isSupported ? yesNo(notifications.canRead) : 'no disponible'],
    ['Calendario', calendar.isSupported ? yesNo(calendar.canRead) : 'no disponible'],
    ['Modificar ajustes del sistema', qs.isSupported ? yesNo(qs.canWriteSystemSettings) : 'no disponible'],
]);

function ago(time: number)
{
    const s = Math.max(0, Math.round((now.value.getTime() - time) / 1000));
    return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min`;
}

function openConsole()
{
    menu.closeAll();
    Bridge.requestOpenDeveloperConsole(true);
}
</script>

<template>
    <GbDialog :open="isOpen" title="Acerca de y diagnóstico" @close="menu.closeAll()">
        <div class="section-title">Versiones</div>
        <dl class="rows">
            <dt>Launcher</dt><dd>{{ buildLabel }}<br /><small>compilado el {{ buildDate }}</small></dd>
            <dt>Bridge</dt><dd>{{ bridgeVersion }}{{ hasFork ? ' · nuestro fork' : '' }}</dd>
            <dt>Android</dt><dd>API {{ androidApi }}</dd>
        </dl>

        <div class="section-title">Pantalla</div>
        <dl class="rows">
            <template v-for="[label, value] in screenRows" :key="label">
                <dt>{{ label }}</dt><dd>{{ value }}</dd>
            </template>
        </dl>

        <div class="section-title">Insets de Bridge (arriba derecha abajo izquierda)</div>
        <dl class="rows">
            <template v-for="[label, value] in insetRows" :key="label">
                <dt>{{ label }}</dt><dd class="mono">{{ value }}</dd>
            </template>
        </dl>

        <div class="section-title">Permisos</div>
        <dl class="rows">
            <template v-for="[label, value] in permissionRows" :key="label">
                <dt>{{ label }}</dt><dd>{{ value }}</dd>
            </template>
        </dl>

        <div class="section-title">Último error de Bridge</div>
        <p class="text" :class="{ none: !lastError }">{{ lastError ?? 'Ninguno' }}</p>

        <div class="section-title">Últimos eventos de Bridge</div>
        <ol v-if="recentEvents.length > 0" class="events">
            <li v-for="(ev, i) in recentEvents" :key="`${ev.time}-${i}`">
                <span class="when">{{ ago(ev.time) }}</span>
                <span class="name">{{ ev.name }}</span>
                <span v-if="ev.detail" class="detail mono">{{ ev.detail }}</span>
            </li>
        </ol>
        <p v-else class="text none">Todavía no llegó ninguno.</p>

        <template #buttons>
            <GbButton v-if="bridgeHas('requestOpenDeveloperConsole')" @click="openConsole">Consola</GbButton>
            <GbButton @click="menu.closeAll()">Cerrar</GbButton>
        </template>
    </GbDialog>
</template>

<style scoped lang="scss">
.section-title {
    padding: 4px 16px;
    background: linear-gradient(to bottom, #5a5a5a, #454545);
    color: #e0e0e0;
    font-size: 13px;
    font-weight: bold;
}

.mono {
    font-family: monospace;
}

// label on the left, value on the right
.rows {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    margin: 0;
    padding: 8px 16px;
    font-size: 13px;

    > dt {
        opacity: 0.7;
    }

    > dd {
        margin: 0;
        text-align: right;
        word-break: break-word;

        small {
            opacity: 0.6;
        }
    }
}

.text {
    padding: 8px 16px;
    font-size: 13px;
    word-break: break-word;

    &.none {
        opacity: 0.6;
    }
}

.events {
    margin: 0;
    padding: 6px 16px 8px;
    list-style: none;
    font-size: 12px;

    > li {
        display: grid;
        grid-template-columns: 44px 1fr;
        column-gap: 8px;
        padding: 3px 0;
        border-bottom: 1px solid rgba(#fff, 0.06);

        > .when {
            grid-row: span 2;
            opacity: 0.55;
            text-align: right;
        }

        > .name {
            font-weight: bold;
        }

        > .detail {
            grid-column: 2;
            opacity: 0.7;
            word-break: break-all;
        }
    }
}
</style>
