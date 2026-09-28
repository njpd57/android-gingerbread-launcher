<script setup lang="ts">
import { computed } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { setAppHidden } from '@/utils/drawerApps';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';
import GbCheckRow from '@/components/GbCheckRow.vue';

// Appearance → "Apps ocultas": every app with a check box; checked ones stay out of the drawer

const apps = useAppsStore();
const menu = useMenuStore();
const settings = useSettingsStore();

const sortedApps = computed(() =>
    Array.from(apps.apps.values()).sort((a, b) => a.label.localeCompare(b.label)));

</script>

<template>
    <GbDialog
        :open="menu.openDialog === 'hiddenApps'"
        title="Apps ocultas"
        @close="menu.showDialog('appearance')">

        <div class="hint">Las apps marcadas no aparecen en el cajón. La búsqueda las sigue encontrando.</div>

        <GbCheckRow
            v-for="app in sortedApps"
            :key="app.key"
            :icon="apps.iconURL(app)"
            :label="app.label"
            :hint="app.isWork ? 'Trabajo' : undefined"
            :model-value="settings.hiddenApps.includes(app.key)"
            @update:model-value="settings.hiddenApps = setAppHidden(settings.hiddenApps, app.key, $event)" />

        <div v-if="sortedApps.length === 0" class="hint">Cargando aplicaciones…</div>

        <template #buttons>
            <GbButton @click="menu.showDialog('appearance')">Listo</GbButton>
        </template>

    </GbDialog>
</template>

<style scoped lang="scss">
.hint {
    padding: 12px 16px;
    font-size: 13px;
    opacity: 0.65;
}
</style>
