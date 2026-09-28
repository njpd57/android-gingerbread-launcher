import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type LauncherDialog = 'wallpaper' | 'add' | 'appearance' | 'manageApps' | 'about' | 'volume' | 'recentApps' | 'screens';

export interface AddAnchor
{
    page: number;
    x: number;
    y: number;
}

export const useMenuStore = defineStore('menu', () =>
{
    const isOptionsMenuOpen = ref(false);
    const openDialog = ref<LauncherDialog | null>(null);
    const openFolderId = ref<string | null>(null);
    const isSearchOpen = ref(false);
    const isNotificationPanelOpen = ref(false);
    // while a finger pulls the notification panel (useShadePull): how many px of it show, and
    // whether the finger is still down (it follows the finger) or it's settling (it animates)
    const notificationPull = ref<number | null>(null);
    const notificationPullDragging = ref(false);

    // the cell that was long-pressed to open the menu; "Añadir" places new items there if it can
    const addAnchor = ref<AddAnchor | null>(null);

    const isAnythingOpen = computed(() =>
        isOptionsMenuOpen.value || openDialog.value !== null || openFolderId.value !== null || isSearchOpen.value
        || isNotificationPanelOpen.value);

    function showOptionsMenu(anchor: AddAnchor | null = null)
    {
        addAnchor.value = anchor;
        isOptionsMenuOpen.value = true;
    }

    function showFolder(id: string)
    {
        closeAll();
        openFolderId.value = id;
    }

    // like the drawer, the search panel pushes a history entry so the back button closes it
    function showSearch()
    {
        closeAll();
        isSearchOpen.value = true;
        history.pushState({ search: true }, '');
    }

    // our own notification panel (Bridge fork), also closed by the back button
    function showNotificationPanel()
    {
        closeAll();
        isNotificationPanelOpen.value = true;
        history.pushState({ notificationPanel: true }, '');
    }

    window.addEventListener('popstate', () =>
    {
        isSearchOpen.value = false;
        isNotificationPanelOpen.value = false;
    });

    function showDialog(dialog: LauncherDialog)
    {
        isOptionsMenuOpen.value = false;
        openDialog.value = dialog;
    }

    function closeAll()
    {
        isOptionsMenuOpen.value = false;
        openDialog.value = null;
        openFolderId.value = null;
        if (isSearchOpen.value)
        {
            isSearchOpen.value = false;
            if (history.state?.search)
                history.back();
        }
        if (isNotificationPanelOpen.value)
        {
            isNotificationPanelOpen.value = false;
            if (history.state?.notificationPanel)
                history.back();
        }
    }

    return {
        isOptionsMenuOpen,
        openDialog,
        openFolderId,
        isSearchOpen,
        isNotificationPanelOpen,
        notificationPull,
        notificationPullDragging,
        addAnchor,
        isAnythingOpen,
        showOptionsMenu,
        showFolder,
        showSearch,
        showNotificationPanel,
        showDialog,
        closeAll,
    };
});
