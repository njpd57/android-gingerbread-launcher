<script setup lang="ts">
import { computed } from 'vue';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import { brightnessStep, nextBrightnessStep, type BrightnessStep } from '@/utils/brightness';
import { ringerModeIndicator } from '@/utils/indicators';
import type { BridgeRingerMode } from '@/types/bridge-fork';
import AudioIcon from '@/home/icons/AudioIcon.vue';
import { useLongPress } from '@/composables/useLongPress';
import { useMenuStore } from '@/stores/useMenuStore';

// The row of quick settings at the top of our notification panel, drawn like Gingerbread's power
// control widget (indicator bar: green = on, amber = in between, gray = off). Flashlight, brightness,
// auto-rotate, sync and ringer mode change directly (long-pressing ringer mode opens the volume panel);
// Wi-Fi and Bluetooth can only open Android's panel for them, but show whether they're on.

type Indicator = 'on' | 'mid' | 'off' | 'none';

const qs = useQuickSettingsStore();

const step = computed(() => brightnessStep(qs.brightness));

const BRIGHTNESS_INDICATORS: Record<BrightnessStep, Indicator> = { auto: 'on', low: 'off', mid: 'mid', high: 'on' };
const BRIGHTNESS_LABELS: Record<BrightnessStep, string> = { auto: 'Auto', low: 'Bajo', mid: 'Medio', high: 'Alto' };
const RINGER_LABELS: Record<BridgeRingerMode, string> = { normal: 'Sonido', vibrate: 'Vibrar', silent: 'Silencio' };

// long-pressing ringer mode opens the volume panel
const menu = useMenuStore();
const press = useLongPress<null>(() =>
{
    if (qs.supportsMusicVolume) menu.showDialog('volume');
});

function onRingerClick()
{
    if (!press.consumeLongPress())
        qs.cycleRingerMode();
}

const onOff = (on: boolean): Indicator => on ? 'on' : 'off';
// older fork builds can't read Wi-Fi and Bluetooth
const radio = (on: boolean): Indicator => qs.supportsRadioStates ? onOff(on) : 'none';
</script>

<template>
    <div class="quick-toggles">
        <button class="toggle" aria-label="Wi-Fi" @click="qs.openPanel('wifi')">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M3 12a19 19 0 0 1 26 0M7.5 16.5a13 13 0 0 1 17 0M12 21a7 7 0 0 1 8 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                <circle cx="16" cy="26" r="2.5" fill="currentColor" />
            </svg>
            <span class="label">Wi-Fi</span>
            <span class="indicator" :class="radio(qs.wifiOn)"></span>
        </button>

        <button class="toggle" aria-label="Bluetooth" @click="qs.openPanel('bluetooth')">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9 10l14 12-7 6V4l7 6L9 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />
            </svg>
            <span class="label">Bluetooth</span>
            <span class="indicator" :class="radio(qs.bluetoothOn)"></span>
        </button>

        <button
            v-if="qs.supportsRingerMode"
            class="toggle"
            :class="{ unavailable: !qs.canAccessNotificationPolicy }"
            :aria-label="RINGER_LABELS[qs.ringerMode]"
            @pointerdown="press.down(null, $event)"
            @pointermove="press.move"
            @pointerup="press.cancel"
            @pointercancel="press.cancel"
            @pointerleave="press.cancel"
            @contextmenu.prevent
            @click="onRingerClick">
            <AudioIcon :mode="qs.ringerMode" />
            <span class="label">{{ RINGER_LABELS[qs.ringerMode] }}</span>
            <span class="indicator" :class="ringerModeIndicator(qs.ringerMode)"></span>
        </button>

        <button v-if="qs.isFlashlightAvailable" class="toggle" aria-label="Linterna" @click="qs.toggleFlashlight()">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M9 3h14v5l-4 6v15h-6V14l-4-6z" fill="currentColor" />
                <rect x="15" y="17" width="2" height="4" fill="#1a1a1a" />
            </svg>
            <span class="label">Linterna</span>
            <span class="indicator" :class="onOff(qs.flashlightOn)"></span>
        </button>

        <button
            class="toggle"
            :class="{ unavailable: !qs.canWriteSystemSettings }"
            aria-label="Brillo"
            @click="qs.setBrightness(nextBrightnessStep(step))">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path
                        v-for="a in 8"
                        :key="a"
                        d="M16 2.5v4"
                        :transform="`rotate(${a * 45} 16 16)`" />
                </g>
                <circle cx="16" cy="16" r="7" fill="currentColor" />
                <text v-if="step === 'auto'" x="16" y="20" text-anchor="middle" class="auto-a">A</text>
            </svg>
            <span class="label">{{ BRIGHTNESS_LABELS[step] }}</span>
            <span class="indicator" :class="BRIGHTNESS_INDICATORS[step]"></span>
        </button>

        <button
            class="toggle"
            :class="{ unavailable: !qs.canWriteSystemSettings }"
            aria-label="Rotación automática"
            @click="qs.toggleAutoRotate()">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <rect x="10" y="6" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
                <path d="M4 12a12 12 0 0 1 5-7M28 20a12 12 0 0 1-5 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
            <span class="label">Rotación</span>
            <span class="indicator" :class="onOff(qs.autoRotateOn)"></span>
        </button>

        <button class="toggle" aria-label="Sincronización" @click="qs.toggleMasterSync()">
            <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M6 15a10 10 0 0 1 17-7l3 3M26 17a10 10 0 0 1-17 7l-3-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
                <path d="M27 5v7h-7M5 27v-7h7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="label">Sinc.</span>
            <span class="indicator" :class="onOff(qs.masterSyncOn)"></span>
        </button>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-amber: #ffb300;
$gingerbread-orange: #ffa800;

// same dark glossy cells as the power control widget
.quick-toggles {
    display: flex;
    height: 84px;
    overflow: hidden;
    border: 1px solid rgba(#fff, 0.16);
    border-radius: 6px;
    background:
        linear-gradient(to bottom, rgba(#fff, 0.1), rgba(#fff, 0.03) 50%, transparent 50%),
        linear-gradient(to bottom, #3a3a3a, #101010);

    > .toggle {
        appearance: none;
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0;
        border: none;
        border-right: 1px solid rgba(#000, 0.6);
        box-shadow: inset -1px 0 0 rgba(#fff, 0.08);
        background: none;
        color: #e6e6e6;
        font: inherit;
        cursor: pointer;

        &:last-child {
            border-right: none;
            box-shadow: none;
        }

        &.unavailable > svg {
            opacity: 0.45;
        }

        > svg {
            width: 26px;
            height: 26px;

            .auto-a {
                font-family: "Droid Sans", sans-serif;
                font-weight: bold;
                font-size: 11px;
                fill: #1a1a1a;
            }
        }

        > .label {
            max-width: 100%;
            overflow: hidden;
            font-size: 11px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &:active {
            background: linear-gradient(to bottom, rgba($gingerbread-orange, 0.85), rgba(#ff8a00, 0.85));
            color: #111;
        }

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
