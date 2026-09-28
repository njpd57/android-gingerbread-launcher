<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMenuStore } from '@/stores/useMenuStore';
import { useAppsStore, type InstalledAppInfo } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useUsageStore } from '@/stores/useUsageStore';
import { RECENT_APPS_LIMIT, recentFromUsage } from '@/utils/recentApps';
import GbDialog from '@/components/GbDialog.vue';

// Gingerbread's recent apps (idea 42): long-pressing home showed the last 8 apps, 2 rows of 4. Bridge
// doesn't get that press, so long-pressing the dock's drawer button opens it. With the fork and usage
// access it lists apps used anywhere; otherwise the ones opened from the launcher.

const BRIDGE_PACKAGE = 'com.tored.bridgelauncher';

const menu = useMenuStore();
const apps = useAppsStore();
const launcher = useAppLauncherStore();
const usageStore = useUsageStore();

const isOpen = computed(() => menu.openDialog === 'recentApps');

const fromUsage = ref<string[]>([]);

watch(isOpen, async open =>
{
    if (!open || !usageStore.canRead) return;
    const now = Date.now();
    const usage = await usageStore.fetchUsage(new Date(now - 7 * 86_400_000), new Date(now));
    fromUsage.value = recentFromUsage(usage, p => apps.apps.has(p), [BRIDGE_PACKAGE]);
}, { immediate: true });

const recentApps = computed(() =>
{
    const keys = usageStore.canRead && fromUsage.value.length > 0 ? fromUsage.value : launcher.recent;
    return keys
        .map(k => apps.apps.get(k))
        .filter((a): a is InstalledAppInfo => !!a)
        .slice(0, RECENT_APPS_LIMIT);
});

function launch(app: InstalledAppInfo)
{
    menu.closeAll();
    launcher.launch(app);
}
</script>

<template>
    <GbDialog :open="isOpen" title="Aplicaciones recientes" @close="menu.closeAll()">
        <div v-if="recentApps.length > 0" class="grid">
            <button v-for="app in recentApps" :key="app.key" class="app" @click="launch(app)">
                <img :src="apps.iconURL(app)" alt="" draggable="false" />
                <span class="label">{{ app.label }}</span>
            </button>
        </div>
        <p v-else class="empty">No hay aplicaciones recientes.</p>
    </GbDialog>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    padding: 12px 8px;

    > .app {
        appearance: none;
        border: none;
        background: none;
        padding: 6px 2px 4px;
        border-radius: 4px;
        color: inherit;
        font: inherit;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;

        > img {
            width: 48px;
            height: 48px;
        }

        > .label {
            max-width: 100%;
            font-size: 12px;
            line-height: 1.15;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &:active {
            @include gb-pressed;
        }
    }
}

.empty {
    padding: 20px 16px;
    text-align: center;
    opacity: 0.7;
}
</style>
