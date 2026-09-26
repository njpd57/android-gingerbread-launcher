<script setup lang="ts">
import { useBatteryStore } from '@/stores/useBatteryStore';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

// Gingerbread's low battery warning, shown when the level drops to 15 % and again at 5 %
// (useBatteryStore decides when).

const battery = useBatteryStore();

function openBatterySettings()
{
    battery.dismissLowBatteryWarning();
    Bridge.requestOpenAndroidSettings(true);
}
</script>

<template>
    <GbDialog
        :open="battery.lowBatteryWarning !== null"
        title="Conecta el cargador"
        @close="battery.dismissLowBatteryWarning()">
        <div class="message">
            <p>La batería se está agotando:</p>
            <p>queda un {{ battery.lowBatteryWarning }} % o menos.</p>
        </div>
        <template #buttons>
            <GbButton @click="openBatterySettings">Uso de la batería</GbButton>
            <GbButton @click="battery.dismissLowBatteryWarning()">Cerrar</GbButton>
        </template>
    </GbDialog>
</template>

<style scoped lang="scss">
.message {
    padding: 14px 16px 10px;
    font-size: 16px;
    line-height: 1.4;

    > p {
        margin: 0;
    }
}
</style>
