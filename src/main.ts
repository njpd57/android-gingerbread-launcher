import '@/assets/styles/page.scss';
import '@/assets/styles/base.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import injectBridgeMockInDev from './mock/injectBridgeMockInDev';
import App from './App.vue';
import { bridgeHas } from './utils/bridge-utils';

injectBridgeMockInDev();

const app = createApp(App);

app.config.globalProperties.Bridge = Bridge;
app.use(createPinia());

app.mount('#app');

// a launcher is a portrait app. Our Bridge fork can lock the home screen natively; otherwise fall back
// to the web API, which the WebView will most likely reject (the grid copes with landscape anyway).
if (bridgeHas('requestSetScreenOrientation'))
{
    Bridge.requestSetScreenOrientation('portrait', false);
}
else
{
    (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })
        ?.lock?.('portrait')
        .catch(() => { /* not allowed here */ });
}
