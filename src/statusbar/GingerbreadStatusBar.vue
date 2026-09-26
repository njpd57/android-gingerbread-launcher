<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { useSettingsStore, type StatusBarBackground } from '@/stores/useSettingsStore';
import { useDeviceStatus } from './useDeviceStatus';
import { useSimulatedSignal } from './useSimulatedSignal';
import NotificationIcons from './NotificationIcons.vue';
import LiveNotificationIcons from './LiveNotificationIcons.vue';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useConnectivityStore } from '@/stores/useConnectivityStore';
import { useBatteryStore } from '@/stores/useBatteryStore';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import { useAlarmStore } from '@/stores/useAlarmStore';
import { dataActivityArrows, wifiArcs } from '@/utils/connectivity';

const props = defineProps<{
    background: StatusBarBackground;
    // side padding in CSS px, to keep clear of rounded screen corners
    sideMargin: number;
}>();

const now = useNow({ interval: 1000 });
// which icons to show (Appearance); the clock always shows
const settings = useSettingsStore();
const show = computed(() => settings.statusBarIcons);
const device = useDeviceStatus();
const notifications = useNotificationsStore();
const menu = useMenuStore();

// with our Bridge fork, our own panel (it also holds the quick settings); otherwise Android's shade
function openNotifications()
{
    if (notifications.isSupported)
        menu.isNotificationPanelOpen ? menu.closeAll() : menu.showNotificationPanel();
    else
        Bridge.requestExpandNotificationShade(true);
}

// Wi-Fi has 3 arcs, the cell signal 4 bars. Our Bridge fork reports the real levels; on stock Bridge
// neither is readable, so both drift believably
const conn = useConnectivityStore();
const real = computed(() => conn.connectivity);
const wifi = useSimulatedSignal(3, device.online, device.effectiveType);
const cell = useSimulatedSignal(4, device.online, device.effectiveType);

const wifiLevel = computed(() => real.value ? wifiArcs(real.value.wifiLevel) : wifi.level.value);
const cellLevel = computed(() => real.value ? (real.value.cellularLevel ?? 0) : cell.level.value);
const isOffline = computed(() => real.value ? real.value.type === 'none' : !device.online.value);

// Gingerbread's status bar clock: 12-hour, with a smaller AM/PM ("11:02 AM")
const clock = computed(() =>
{
    const h = now.value.getHours();
    const m = now.value.getMinutes();
    return {
        time: `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`,
        ampm: h < 12 ? 'AM' : 'PM',
    };
});

// 2.3 drew green icons on its black bar; 2.2's light gray bar had dark ones
const isLight = computed(() => props.background === 'gray' || props.background === 'white');

// on mobile data there's no Wi-Fi icon, and the signal gets a "3G" tag and the activity arrows
const onWifi = computed(() => real.value ? real.value.type !== 'cellular' : device.connectionType.value !== 'cellular');

// the fork measures the device's real traffic (on any network); stock Bridge gets simulated arrows
const activity = computed(() =>
{
    if (real.value)
        return dataActivityArrows(real.value.dataActivity);
    const simulated = onWifi.value ? wifi : cell;
    return { in: simulated.activityIn.value, out: simulated.activityOut.value };
});

// our Bridge fork reports the real battery; stock Bridge the web API, and a full battery without it
const battery = useBatteryStore();
const batteryLevel = computed(() => battery.level ?? 1);
const batteryFillHeight = computed(() => Math.max(1, Math.round(batteryLevel.value * 14)));
const isBatteryLow = computed(() => battery.level !== null && batteryLevel.value <= 0.15 && !battery.charging);
// Gingerbread's state icons left of the signal, from our Bridge fork: Bluetooth on, an alarm set, GPS
// on, and the ringer in vibrate or silent
const qs = useQuickSettingsStore();
// and an alarm clock while an alarm is set
const alarm = useAlarmStore();

// Gingerbread's USB icon: only for a USB cable when the fork says how it's plugged in, on any
// charger otherwise
const usbConnected = computed(() => battery.charging && (battery.pluggedType === null || battery.pluggedType === 'usb'));

</script>

<template>
    <div
        class="gb-status-bar"
        :class="[background, { light: isLight, offline: isOffline }]"
        :style="{ '--side-margin': `${sideMargin}px` }"
        role="button"
        aria-label="Abrir notificaciones"
        @click="openNotifications">

        <!-- real icons when Bridge can read notifications, decorative ones otherwise -->
        <LiveNotificationIcons v-if="show.notifications && notifications.canRead" class="notifications" />
        <NotificationIcons v-else-if="show.notifications" class="notifications" :usb="usbConnected" />

        <div class="icons">
            <!-- Bluetooth on: the rune -->
            <svg v-if="show.bluetooth && qs.supportsRadioStates && qs.bluetoothOn" class="icon state" viewBox="0 0 12 18" aria-hidden="true">
                <path d="M2.5 5.5l7 6.5-3.5 3.3V2.7L9.5 6l-7 6.5" class="line" />
            </svg>

            <!-- an alarm is set: the alarm clock -->
            <svg v-if="show.alarm && alarm.nextAlarm" class="icon state" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="10" r="6" class="line" />
                <path d="M9 6.8v3.5l2.2 1.4M2.5 4.5l2.8-2.3M15.5 4.5l-2.8-2.3" class="line" />
            </svg>

            <!-- GPS on: a crosshair -->
            <svg v-if="show.gps && qs.supportsLocationState && qs.locationOn" class="icon state" viewBox="0 0 18 18" aria-hidden="true">
                <circle cx="9" cy="9" r="5" class="line" />
                <circle cx="9" cy="9" r="1.8" class="solid" />
                <path d="M9 1v3M9 14v3M1 9h3M14 9h3" class="line" />
            </svg>

            <!-- vibrate: a phone between shake marks -->
            <svg v-if="show.ringer && qs.supportsRingerMode && qs.ringerMode === 'vibrate'" class="icon state" viewBox="0 0 18 18" aria-hidden="true">
                <rect x="5.5" y="2" width="7" height="14" rx="1" class="solid" />
                <rect x="7" y="4" width="4" height="8" class="hole" />
                <path d="M3 5.5v7M1 7.5v3M15 5.5v7M17 7.5v3" class="line" />
            </svg>

            <!-- silent: a speaker with a slash -->
            <svg v-if="show.ringer && qs.supportsRingerMode && qs.ringerMode === 'silent'" class="icon state" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M2 7h3l4-3.5v11L5 11H2z" class="solid" />
                <path d="M11 6l5 6M16 6l-5 6" class="line" />
            </svg>

            <!-- data activity: down (in) and up (out) arrows, lit while "transferring" -->
            <svg v-if="show.dataActivity" class="icon activity" viewBox="0 0 8 18" aria-hidden="true">
                <path d="M4 17L0.8 12.5h6.4z" :class="{ on: activity.in }" />
                <path d="M4 1L7.2 5.5H0.8z" :class="{ on: activity.out }" />
            </svg>

            <!-- Wi-Fi: a wedge and two arcs, lit up to the current level (1..3) -->
            <svg v-if="show.wifi && onWifi" class="icon wifi" viewBox="0 0 20 18" aria-hidden="true">
                <path d="M10 16.5l2.4-2.9a3.8 3.8 0 0 0-4.8 0z" :class="{ on: wifiLevel >= 1 }" />
                <path d="M5.8 11.4a6.6 6.6 0 0 1 8.4 0l1.7-2.1a9.4 9.4 0 0 0-11.8 0z" :class="{ on: wifiLevel >= 2 }" />
                <path d="M2.3 7.2a12 12 0 0 1 15.4 0l1.7-2.1a14.8 14.8 0 0 0-18.8 0z" :class="{ on: wifiLevel >= 3 }" />
            </svg>

            <span v-else-if="!onWifi && show.signal" class="network-tag">3G</span>

            <!-- signal: four rising bars, lit up to the current level -->
            <svg v-if="show.signal" class="icon signal" viewBox="0 0 18 18" aria-hidden="true">
                <rect x="1" y="12" width="3" height="5" :class="{ on: cellLevel >= 1 }" />
                <rect x="5.5" y="9" width="3" height="8" :class="{ on: cellLevel >= 2 }" />
                <rect x="10" y="5.5" width="3" height="11.5" :class="{ on: cellLevel >= 3 }" />
                <rect x="14.5" y="1.5" width="3" height="15.5" :class="{ on: cellLevel >= 4 }" />
            </svg>

            <!-- battery: level fills from the bottom, bolt while charging -->
            <svg v-if="show.battery" class="icon battery" :class="{ low: isBatteryLow }" viewBox="0 0 10 18" aria-hidden="true">
                <rect x="3" y="0.5" width="4" height="2" class="cap" />
                <rect x="0.75" y="2.25" width="8.5" height="15" rx="1" class="shell" />
                <rect
                    x="2"
                    :y="16.5 - batteryFillHeight"
                    width="6"
                    :height="batteryFillHeight"
                    class="fill" />
                <path v-if="battery.charging" d="M5.8 5L2.8 10.4h2l-.6 3.6 3-5.4h-2z" class="bolt" />
            </svg>
        </div>

        <span class="clock">{{ clock.time }}<small>{{ clock.ampm }}</small></span>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;
$gb-dim-dark: rgba(#fff, 0.22);
$gb-dim-light: rgba(#000, 0.2);

.gb-status-bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;

    // notifications on the left, status icons and clock on the right
    > .notifications {
        margin-right: auto;
    }
    gap: 5px;
    // the center stays clear for the camera cutout; the side padding (a setting) keeps
    // the notification icons and the clock clear of rounded screen corners
    padding: 0 max(var(--side-margin), env(safe-area-inset-right)) 0 max(var(--side-margin), env(safe-area-inset-left));
    color: #fff;
    cursor: pointer;

    // same backgrounds as the strip behind the system bar (App.vue .status-bar-bg)
    &.gray {
        background: linear-gradient(to bottom, #f2f2f2, #c4c4c4);
        border-bottom: 1px solid #8a8a8a;
    }

    &.blackGradient {
        background: linear-gradient(to bottom, #3c3c3c, #0c0c0c 70%, #000);
        border-bottom: 1px solid #2a2a2a;
    }

    &.white {
        background-color: #fff;
    }

    &.black {
        background-color: #000;
    }

    > .icons {
        display: flex;
        align-items: center;
        gap: 3px;

        > .icon {
            height: 16px;
            width: auto;

            // unlit parts stay visible but dim, like Gingerbread's empty bars
            > path,
            > rect {
                fill: $gb-dim-dark;
                transition: fill 0.3s;

                &.on {
                    fill: $gb-green;
                }
            }

            &.activity {
                width: 6px;

                > path.on {
                    fill: #fff;
                }
            }

            &.wifi {
                width: 18px;
            }

            // state icons are drawn in white, like 2.3's, not green
            &.state {
                width: auto;

                > .solid,
                > .solid.on {
                    fill: #e8e8e8;
                }

                > .line {
                    fill: none;
                    stroke: #e8e8e8;
                    stroke-width: 1.6;
                    stroke-linecap: round;
                    stroke-linejoin: round;
                }

                > .hole {
                    fill: #000;
                }
            }

            &.signal {
                width: 16px;
            }

            &.battery {
                width: 9px;
                margin-left: 2px;

                > .cap {
                    fill: #d8d8d8;
                }

                > .shell {
                    fill: none;
                    stroke: #d8d8d8;
                    stroke-width: 1.2;
                }

                > .fill {
                    fill: $gb-green;
                }

                > .bolt {
                    fill: #fff;
                    stroke: #333;
                    stroke-width: 0.4;
                }

                &.low > .fill {
                    fill: #e53935;
                }
            }
        }

        > .network-tag {
            font-family: "Droid Sans", sans-serif;
            font-weight: bold;
            font-size: 9px;
            line-height: 1;
            color: $gb-green;
            align-self: flex-end;
            margin-bottom: 3px;
        }
    }

    // the clock in Droid Sans Bold, with a smaller AM/PM
    > .clock {
        margin-left: 4px;
        font-family: "Droid Sans", sans-serif;
        font-weight: bold;
        font-size: 15px;
        letter-spacing: -0.2px;
        white-space: nowrap;
        -webkit-font-smoothing: antialiased;

        > small {
            margin-left: 2px;
            font-size: 11px;
        }
    }

    // light bars (2.2 style): dark icons and text
    &.light {
        color: #222;

        > .notifications {
            color: #3a3a3a;

            :deep(rect.solid + .stroke) {
                stroke: #e8e8e8;
            }
        }

        > .icons > .icon {
            > path,
            > rect {
                fill: $gb-dim-light;

                &.on {
                    fill: #3a3a3a;
                }
            }

            &.activity > path.on {
                fill: #111;
            }

            &.state {
                > .solid {
                    fill: #3a3a3a;
                }

                > .line {
                    stroke: #3a3a3a;
                }

                > .hole {
                    fill: #e8e8e8;
                }
            }

            &.battery {
                > .cap {
                    fill: #555;
                }

                > .shell {
                    stroke: #555;
                }

                > .fill {
                    fill: $gb-green;
                }
            }
        }

        > .icons > .network-tag {
            color: #3a3a3a;
        }
    }

    &.offline > .icons > .icon:not(.battery) > .on {
        fill: $gb-dim-dark;
    }

    &.light.offline > .icons > .icon:not(.battery) > .on {
        fill: $gb-dim-light;
    }
}
</style>
