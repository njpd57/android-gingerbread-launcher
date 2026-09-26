<script setup lang="ts">
import { computed } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

// Gingerbread's "Manage applications": a list of installed apps; tapping one opens its
// Android app info page (where it can be uninstalled, force stopped, cleared, ...)

const apps = useAppsStore();
const menu = useMenuStore();

const sortedApps = computed(() =>
    Array.from(apps.apps.values()).sort((a, b) => a.label.localeCompare(b.label)));

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'manageApps'"
        title="Administrar aplicaciones"
        @close="menu.closeAll()">

        <button
            v-for="app in sortedApps"
            :key="app.packageName"
            class="row"
            @click="Bridge.requestOpenAppInfo(app.packageName, true)">
            <img
                class="row-icon"
                :src="Bridge.getDefaultAppIconURL(app.packageName)"
                loading="lazy"
                alt="" />
            <span class="text">
                <span class="label">{{ app.label }}</span>
                <span class="package">{{ app.packageName }}</span>
            </span>
        </button>

        <div v-if="sortedApps.length === 0" class="empty">Cargando aplicaciones…</div>

        <template #buttons>
            <GbButton @click="menu.closeAll()">Cerrar</GbButton>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
.row {
    appearance: none;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 60px;
    padding: 8px 16px;
    border: none;
    border-bottom: 1px solid rgba(#fff, 0.1);
    background: none;
    color: #fff;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:active {
        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        color: #111;
    }

    > .row-icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
    }

    > .text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        > .label {
            font-size: 17px;
        }

        > .package {
            font-size: 12px;
            opacity: 0.6;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.empty {
    padding: 24px 16px;
    text-align: center;
    color: rgba(#fff, 0.7);
}
</style>
