<script setup lang="ts">
import { computed } from 'vue';
import { useTogglesStore } from '@/stores/useTogglesStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useDeviceStatus } from '@/statusbar/useDeviceStatus';
import { useLongPress } from '@/composables/useLongPress';
import { brightnessStep, nextBrightnessStep } from '@/utils/brightness';
import { brightnessIndicator, nightModeIndicator, onOffIndicator, ringerModeIndicator, type Indicator } from '@/utils/indicators';
import type { BridgeRingerMode } from '@/types/bridge-fork';
import WifiIcon from '@/home/icons/WifiIcon.vue';
import BluetoothIcon from '@/home/icons/BluetoothIcon.vue';
import AudioIcon from '@/home/icons/AudioIcon.vue';
import SyncIcon from '@/home/icons/SyncIcon.vue';
import BrightnessIcon from '@/home/icons/BrightnessIcon.vue';
import LockIcon from '@/home/icons/LockIcon.vue';
import NightModeIcon from '@/home/icons/NightModeIcon.vue';
import NotificationsIcon from '@/home/icons/NotificationsIcon.vue';
import SettingsIcon from '@/home/icons/SettingsIcon.vue';

// Android 2.x's "Power control" widget: a row of buttons, each with an indicator bar underneath.
// With our Bridge fork it's Wi-Fi, Bluetooth, ringer mode, sync and brightness (swapping the original's
// GPS, which only ever opened a panel, for ringer mode, which changes for real). Wi-Fi and Bluetooth
// only open Android's panels (apps can't toggle them), but show whether they're on. Stock Bridge can
// toggle none of those, so it gets the actions it can do instead. With the fork, long-pressing
// brightness toggles night mode and long-pressing sync locks the screen.

const RINGER_LABELS: Record<BridgeRingerMode, string> = { normal: 'Sonido', vibrate: 'Vibrar', silent: 'Silencio' };

const toggles = useTogglesStore();
const notifications = useNotificationsStore();
const qs = useQuickSettingsStore();
const menu = useMenuStore();
const device = useDeviceStatus();

const step = computed(() => brightnessStep(qs.brightness));

// older fork builds can't tell whether Wi-Fi is on, but a Wi-Fi connection means it is (hidden when
// the WebView doesn't report the connection type)
const wifiIndicator = computed<Indicator>(() =>
{
    if (qs.supportsRadioStates) return onOffIndicator(qs.wifiOn);
    return device.connectionType.value === null ? 'none' : onOffIndicator(device.connectionType.value === 'wifi');
});
const bluetoothIndicator = computed<Indicator>(() => qs.supportsRadioStates ? onOffIndicator(qs.bluetoothOn) : 'none');

// these buttons stop the press from reaching HomeGrid, whose long press would start dragging the widget
// (the other buttons still move it)
const press = useLongPress<'night' | 'lock' | 'volume'>(action =>
{
    if (action === 'night')
        toggles.toggleNightMode();
    else if (action === 'lock')
        toggles.lockScreen();
    else if (qs.supportsMusicVolume)
        menu.showDialog('volume');
});

function onRingerClick()
{
    if (!press.consumeLongPress())
        qs.cycleRingerMode();
}

function onSyncClick()
{
    if (!press.consumeLongPress())
        qs.toggleMasterSync();
}

function onBrightnessClick()
{
    if (!press.consumeLongPress())
        qs.setBrightness(nextBrightnessStep(step.value));
}

// our own notification panel with the Bridge fork, Android's shade otherwise
function openNotifications()
{
    if (notifications.isSupported)
        menu.showNotificationPanel();
    else
        Bridge.requestExpandNotificationShade(true);
}

</script>

<template>
    <div v-if="qs.isSupported" class="power-control">
        <button class="toggle" aria-label="Wi-Fi" @click="qs.openPanel('wifi')">
            <WifiIcon />
            <span class="indicator" :class="wifiIndicator"></span>
        </button>

        <button class="toggle" aria-label="Bluetooth" @click="qs.openPanel('bluetooth')">
            <BluetoothIcon />
            <span class="indicator" :class="bluetoothIndicator"></span>
        </button>

        <button
            v-if="qs.supportsRingerMode"
            class="toggle"
            :class="{ unavailable: !qs.canAccessNotificationPolicy }"
            :aria-label="RINGER_LABELS[qs.ringerMode]"
            @pointerdown.stop="press.down('volume', $event)"
            @pointermove="press.move"
            @pointerup="press.cancel"
            @pointercancel="press.cancel"
            @pointerleave="press.cancel"
            @contextmenu.prevent
            @click="onRingerClick">
            <AudioIcon :mode="qs.ringerMode" />
            <span class="indicator" :class="ringerModeIndicator(qs.ringerMode)"></span>
        </button>

        <button
            class="toggle"
            aria-label="Sincronización (mantén pulsado para bloquear la pantalla)"
            @pointerdown.stop="press.down('lock', $event)"
            @pointermove="press.move"
            @pointerup="press.cancel"
            @pointercancel="press.cancel"
            @pointerleave="press.cancel"
            @contextmenu.prevent
            @click="onSyncClick">
            <SyncIcon />
            <span class="indicator" :class="onOffIndicator(qs.masterSyncOn)"></span>
        </button>

        <button
            class="toggle"
            :class="{ unavailable: !qs.canWriteSystemSettings }"
            aria-label="Brillo (mantén pulsado para el modo noche)"
            @pointerdown.stop="press.down('night', $event)"
            @pointermove="press.move"
            @pointerup="press.cancel"
            @pointercancel="press.cancel"
            @pointerleave="press.cancel"
            @contextmenu.prevent
            @click="onBrightnessClick">
            <BrightnessIcon :step="step" />
            <span class="indicator" :class="brightnessIndicator(step)"></span>
        </button>
    </div>

    <div v-else class="power-control">
        <button class="toggle" :class="{ unavailable: !toggles.canLockScreen }" aria-label="Bloquear pantalla" @click="toggles.lockScreen()">
            <LockIcon />
            <span class="indicator" :class="onOffIndicator(toggles.canLockScreen)"></span>
        </button>

        <button class="toggle" :class="{ unavailable: !toggles.canRequestSystemNightMode }" aria-label="Modo noche" @click="toggles.toggleNightMode()">
            <NightModeIcon />
            <span class="indicator" :class="nightModeIndicator(toggles.systemNightMode, toggles.canRequestSystemNightMode)"></span>
        </button>

        <button class="toggle" aria-label="Notificaciones" @click="openNotifications">
            <NotificationsIcon />
            <span class="indicator none"></span>
        </button>

        <button class="toggle" aria-label="Ajustes" @click="Bridge.requestOpenAndroidSettings(true)">
            <SettingsIcon />
            <span class="indicator none"></span>
        </button>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-amber: #ffb300;
$gingerbread-orange: #ffa800;

// dark glossy panel split into equal cells by thin dividers
.power-control {
    display: flex;
    width: 100%;
    height: 72px;
    overflow: hidden;
    border: 1px solid rgba(#fff, 0.16);
    border-radius: 6px;
    background:
        linear-gradient(to bottom, rgba(#fff, 0.1), rgba(#fff, 0.03) 50%, transparent 50%),
        linear-gradient(to bottom, rgba(#3a3a3a, 0.8), rgba(#101010, 0.9));
    box-shadow: 0 3px 8px rgba(#000, 0.5);

    > .toggle {
        appearance: none;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0;
        border: none;
        border-right: 1px solid rgba(#000, 0.6);
        box-shadow: inset -1px 0 0 rgba(#fff, 0.08);
        background: none;
        color: #e6e6e6;
        cursor: pointer;

        &:last-child {
            border-right: none;
            box-shadow: none;
        }

        &.unavailable > svg {
            opacity: 0.45;
        }

        > svg {
            width: 28px;
            height: 28px;
        }

        &:active {
            background: linear-gradient(to bottom, rgba($gingerbread-orange, 0.85), rgba(#ff8a00, 0.85));
            color: #111;
        }

        // the status bar under each button
        > .indicator {
            width: 60%;
            height: 4px;
            border-radius: 2px;
            background-color: #4a4a4a;

            &.on {
                background-color: $gb-green;
                box-shadow: 0 0 4px rgba($gb-green, 0.7);
            }

            &.mid {
                background-color: $gb-amber;
                box-shadow: 0 0 4px rgba($gb-amber, 0.7);
            }

            &.none {
                visibility: hidden;
            }
        }
    }
}
</style>
