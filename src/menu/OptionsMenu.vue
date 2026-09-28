<script setup lang="ts">
import { useMenuStore } from '@/stores/useMenuStore';
import { bridgeRequest } from '@/utils/toast';

const menu = useMenuStore();

function run(action: () => void)
{
    menu.closeAll();
    action();
}

</script>

<template>
    <Transition name="menu">
        <div v-if="menu.isOptionsMenuOpen" class="menu-overlay" @click.self="menu.closeAll()">
            <nav
                class="options-menu"
                :style="{ 'padding-bottom': 'var(--nav-bar-height)' }">

                <button class="item" @click="menu.showDialog('add')">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M16 5v22M5 16h22" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
                    </svg>
                    <span>Añadir</span>
                </button>

                <button class="item" @click="menu.showDialog('wallpaper')">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <rect x="3" y="6" width="26" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                        <path d="M6 23l6-8 5 6 3-3 6 5z" fill="currentColor" />
                        <circle cx="22" cy="12" r="2.5" fill="currentColor" />
                    </svg>
                    <span>Fondo de pantalla</span>
                </button>

                <button class="item" @click="menu.showDialog('appearance')">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <g fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="5" y="4" width="22" height="24" rx="2" />
                            <path d="M5 9h22" stroke-width="3" />
                            <path d="M5 16h22M5 22h22M12.3 12v16M19.7 12v16" stroke-width="1.5" />
                        </g>
                    </svg>
                    <span>Apariencia</span>
                </button>

                <button class="item" @click="run(() => bridgeRequest(t => Bridge.requestExpandNotificationShade(t)))">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <rect x="5" y="4" width="22" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                        <path d="M9 9h14M9 13h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M11 22l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <span>Notificaciones</span>
                </button>

                <button class="item" @click="run(() => bridgeRequest(t => Bridge.requestOpenAndroidSettings(t)))">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <g fill="currentColor">
                            <rect
                                v-for="a in 8"
                                :key="a"
                                x="14" y="3" width="4" height="7" rx="1"
                                :transform="`rotate(${a * 45} 16 16)`" />
                        </g>
                        <circle cx="16" cy="16" r="8.5" fill="currentColor" />
                        <circle cx="16" cy="16" r="3.5" fill="#262626" />
                    </svg>
                    <span>Ajustes</span>
                </button>

                <button class="item" @click="run(() => bridgeRequest(t => Bridge.requestOpenBridgeSettings(t)))">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M2 14h28M2 24h28" stroke="currentColor" stroke-width="2" />
                        <path d="M4 24c0-9 5-14 12-14s12 5 12 14" fill="none" stroke="currentColor" stroke-width="2.5" />
                        <path d="M10 14v10M16 10v14M22 14v10" stroke="currentColor" stroke-width="1.5" />
                    </svg>
                    <span>Bridge</span>
                </button>

            </nav>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.menu-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

// Gingerbread's options menu: a dark panel of icon + label cells with thin dividers, 3 per row
.options-menu {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid #8a8a8a;
    background: linear-gradient(to bottom, #3a3a3a, #1c1c1c);
    box-shadow: 0 -4px 16px rgba(#000, 0.6);

    > .item {
        appearance: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 76px;
        padding: 10px 4px;
        border: none;
        border-right: 1px solid rgba(#fff, 0.12);
        border-bottom: 1px solid rgba(#fff, 0.12);
        background: none;
        color: #e8e8e8;
        font: inherit;
        font-size: 13px;
        cursor: pointer;

        &:nth-child(3n) {
            border-right: none;
        }

        > svg {
            width: 32px;
            height: 32px;
        }

        &:active {
            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
            color: #111;
        }
    }
}

.menu-enter-active,
.menu-leave-active {
    transition: opacity 0.15s;

    > .options-menu {
        transition: transform 0.15s $ease-mat-decel;
    }
}

.menu-enter-from,
.menu-leave-to {
    opacity: 0;

    > .options-menu {
        transform: translateY(100%);
    }
}
</style>
