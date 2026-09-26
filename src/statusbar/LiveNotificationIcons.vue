<script setup lang="ts">
import { useNotificationsStore } from '@/stores/useNotificationsStore';

// The real notification icons (our Bridge fork, with notification access), one per app. Android's
// small icons are white silhouettes, so they're used as masks and painted in the bar's icon color.

const notifications = useNotificationsStore();

function iconStyle(key: string)
{
    const url = `url("${Bridge.getNotificationIconURL(key)}")`;
    return { maskImage: url, webkitMaskImage: url };
}
</script>

<template>
    <div class="notification-icons">
        <span
            v-for="n in notifications.statusBarNotifications"
            :key="n.key"
            class="icon"
            :style="iconStyle(n.key)"
            aria-hidden="true"></span>
    </div>
</template>

<style scoped lang="scss">
.notification-icons {
    display: flex;
    align-items: center;
    gap: 5px;
    // light bars override this through the parent's `color`
    color: #cfcfcf;

    > .icon {
        width: 16px;
        height: 16px;
        background-color: currentColor;
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-size: contain;
        -webkit-mask-repeat: no-repeat;
        -webkit-mask-position: center;
    }
}
</style>
