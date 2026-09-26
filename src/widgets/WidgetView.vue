<script setup lang="ts">
import type { WidgetKind } from '@/stores/useHomeLayoutStore';
import AnalogClock from './clock/AnalogClock.vue';
import DigitalClock from './clock/DigitalClock.vue';
import WeatherWidget from './weather/WeatherWidget.vue';
import PowerControlWidget from './power/PowerControlWidget.vue';
import SearchWidget from './search/SearchWidget.vue';
import BatteryWidget from './battery/BatteryWidget.vue';
import CalendarWidget from './calendar/CalendarWidget.vue';
import QuoteWidget from './quote/QuoteWidget.vue';
import PhotoFrameWidget from './photo/PhotoFrameWidget.vue';
import MusicPlayer from './music/MusicPlayer.vue';
import SongbirdPlayer from './music/SongbirdPlayer.vue';
import CountdownWidget from './countdown/CountdownWidget.vue';
import ForecastWidget from './forecast/ForecastWidget.vue';
import SunMoonWidget from './sunMoon/SunMoonWidget.vue';
import NoteWidget from './note/NoteWidget.vue';
import TimerWidget from './timer/TimerWidget.vue';
import CalculatorWidget from './calculator/CalculatorWidget.vue';
import TasksWidget from './tasks/TasksWidget.vue';
import RssWidget from './rss/RssWidget.vue';
import MostUsedWidget from './mostUsed/MostUsedWidget.vue';
import AgendaWidget from './agenda/AgendaWidget.vue';
import ScreenTimeWidget from './screenTime/ScreenTimeWidget.vue';
import FavContactsWidget from './favContacts/FavContactsWidget.vue';
import DirectContactWidget from './directContact/DirectContactWidget.vue';

// Renders any widget by kind, filling the grid area it's placed in.
// Used both on the home screen (HomeGrid) and for the item being dragged (DragLayer).

defineProps<{
    kind: WidgetKind;
    // the home item id, for widgets that keep per-instance data (photo frame, countdown, note, timer, tasks, feed)
    widgetId?: string;
}>();
</script>

<template>
    <div class="widget-view">
        <!-- analog clocks stay square and as large as the area allows -->
        <div v-if="kind === 'clock' || kind === 'clockLarge'" class="square">
            <AnalogClock class="clock" />
        </div>
        <DigitalClock v-else-if="kind === 'digitalClock'" />
        <WeatherWidget v-else-if="kind === 'weather'" />
        <PowerControlWidget v-else-if="kind === 'power'" />
        <SearchWidget v-else-if="kind === 'search'" />
        <BatteryWidget v-else-if="kind === 'battery'" />
        <CalendarWidget v-else-if="kind === 'calendar'" />
        <QuoteWidget v-else-if="kind === 'quote'" />
        <PhotoFrameWidget v-else-if="kind === 'photo'" :widget-id="widgetId" />
        <MusicPlayer v-else-if="kind === 'music'" variant="widget" />
        <SongbirdPlayer v-else-if="kind === 'musicSongbird'" />
        <MostUsedWidget v-else-if="kind === 'mostUsed'" />
        <AgendaWidget v-else-if="kind === 'agenda'" />
        <ScreenTimeWidget v-else-if="kind === 'screenTime'" />
        <CountdownWidget v-else-if="kind === 'countdown'" :widget-id="widgetId" />
        <ForecastWidget v-else-if="kind === 'forecast'" />
        <SunMoonWidget v-else-if="kind === 'sunMoon'" />
        <NoteWidget v-else-if="kind === 'note'" :widget-id="widgetId" />
        <TimerWidget v-else-if="kind === 'timer'" :widget-id="widgetId" />
        <CalculatorWidget v-else-if="kind === 'calculator'" />
        <TasksWidget v-else-if="kind === 'tasks'" :widget-id="widgetId" />
        <RssWidget v-else-if="kind === 'rss'" :widget-id="widgetId" />
        <FavContactsWidget v-else-if="kind === 'favContacts'" />
        <DirectContactWidget v-else-if="kind === 'directCall'" :widget-id="widgetId" mode="call" />
        <DirectContactWidget v-else-if="kind === 'directMessage'" :widget-id="widgetId" mode="message" />
    </div>
</template>

<style scoped lang="scss">
.widget-view {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;

    > * {
        width: 100%;
    }

    > .square {
        height: 100%;
        display: grid;
        place-items: center;
        container-type: size;

        > .clock {
            width: min(100cqw, 100cqh);
        }
    }
}
</style>
