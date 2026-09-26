# Funciones posibles con la API de Bridge

**Estado:** las ideas 1 a 7, 9, 12, 15 a 38 ya están implementadas (marcadas con ✅), salvo la variante 4×2 de la 35. Las ideas 8, 10 y 11 quedan para más adelante (marcadas con ⏬ Baja prioridad). Las ideas 39 a 50 salen de una revisión de la API del 26/09/2026: la 39, 40, 41, 45, 49 y 50 están hechas y probadas en el teléfono (la 49 con el fork `c59ed75` o posterior); las demás, sin empezar. Las ideas 1 a 5 están probadas en un Samsung Galaxy Z Flip5 con Bridge 0.1.0alpha. Con nuestro fork de Bridge están probadas en el teléfono la 5 (con el estado de Wi-Fi, Bluetooth y el modo de sonido), la 7 (con la búsqueda web), la 16 (con eventos), la 25 y de la 30 a la 33. Todas las ideas implementadas están probadas en el teléfono. La 25, de la 30 a la 33 y de la 35 a la 37 necesitan nuestro fork.

Revisión de todo lo que ofrece `@bridgelauncher/api` v0.1.0 (la última publicada), qué usa ya el launcher y qué se podría agregar. Las ideas van ordenadas por lo bien que encajan con Gingerbread y por el esfuerzo que requieren.

## Qué usamos y qué no

| Área | Ya se usa | Sin usar |
|---|---|---|
| Apps | `getAppsURL`, `getDefaultAppIconURL`, `requestLaunchApp`, `requestAppUninstall`, `requestOpenAppInfo`, eventos `appInstalled` / `appChanged` / `appRemoved` | — |
| Fondo de pantalla | `setWallpaperOffsetSteps`, `setWallpaperOffsets`, `requestChangeSystemWallpaper`, dibujar el fondo del sistema detrás del WebView | `sendWallpaperTap` |
| Barras del sistema | Apariencia de la barra de estado (incluido ocultarla), insets de barras, del recorte de la cámara y del teclado (`getImeWindowInsets`) | Gestos (`systemGestures`, `mandatorySystemGestures`), `tappableElement`, `captionBar`, `waterfall`, `getDisplayCutoutPath`, `getDisplayShapePath` |
| Ajustes de Bridge | Botón flotante, efectos de overscroll, "dibujar el fondo del sistema detrás del WebView", modo noche del sistema (`requestSetSystemNightMode`), tema de Bridge (oscuro con la barra Gingerbread, idea 50) | — |
| Sistema | `requestExpandNotificationShade`, `requestOpenAndroidSettings`, `requestOpenBridgeSettings`, `requestLockScreen` / `getCanLockScreen`, `showToast`, `requestOpenDeveloperConsole` y `getLastErrorMessage` (diagnóstico) | `requestOpenBridgeAppDrawer` |
| Información | `getAndroidAPILevel`, `getBridgeVersionName`, `getBridgeVersionCode` (diagnóstico) | `getProjectURL` |
| Ciclo de vida | `newIntent` (botón de inicio), `beforePause`, `afterResume` | — |
| Solo en nuestro fork de Bridge | `requestSetScreenOrientation` (vertical fija), `getDefaultAppPackageName` (dock), `requestOpenUrl` (búsqueda web), notificaciones (`getNotificationsURL`, `getNotificationIconURL`, `requestOpenNotification`, `requestDismissNotification` y sus eventos: iconos reales en la barra de estado y panel de notificaciones propio), ajustes rápidos (linterna, brillo, rotación, sincronización, modo de sonido (`requestSetRingerMode`, necesita "Acceso a No molestar") y `requestOpenSystemPanel` para Wi-Fi y Bluetooth; también en el widget Control de energía), música (`getMediaSession`, `requestMediaAction`: widget "Música" y reproductor en el panel), calendario (`getCalendarEventsURL`, `requestOpenCalendarEvent`, `requestOpenCalendarAt`: widget Agenda y eventos en el calendario del mes), estado de Wi-Fi y Bluetooth (`getWifiEnabled`, `getBluetoothEnabled`), señal real (`getConnectivity`: barras, Wi-Fi y flechas de datos en la barra Gingerbread), accesos directos de apps (`getAppShortcutsURL`, `requestStartAppShortcut`), selector de archivos para `<input type="file">` (marco de fotos), contactos y llamadas (`getContactsURL`, `requestCallPhoneNumber`: contactos en la búsqueda), batería (`getBattery`, sin consumidor todavía) | `getScreenOrientation`, evento `screenOrientationChanged`; `getDefaultAppPackageName` para `sms`, `email` y `camera` (idea 44); la última vez que se usó cada app, en `getAppUsageURL` (idea 42) |

Los **packs de iconos** (`getIconPacksURL`, `getAppIconURL`…) aparecen en la API como borrador, comentados: todavía no existen en Bridge.

Nuestro [fork de Bridge](https://github.com/njpd57/bridge-launcher) añade métodos que la API publicada no tiene. Se declaran en `src/types/bridge-fork.d.ts` y el launcher los usa solo si existen, así que sigue funcionando con el Bridge original.

**Ojo:** el Bridge instalado puede no tener todos los métodos de la API. Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`; por eso los métodos opcionales se comprueban con `bridgeHas()` antes de llamarlos.

---

## Ideas muy de Gingerbread

### 1. Desinstalar arrastrando a la papelera ✅ Hecho
En Gingerbread, arrastrar una app **desde el cajón** hasta la papelera abría el diálogo de desinstalación. Ahora nuestro launcher hace lo mismo: la papelera dice "Desinstalar" cuando la app viene del cajón.
- **API:** `requestAppUninstall(packageName)`. Android pide confirmación y, si se desinstala, el evento `appRemoved` ya limpia el escritorio.
- **Esfuerzo:** bajo. Es un caso más en `applyDrop()` de `useDragStore`, y un icono de papelera distinto ("Desinstalar") cuando el arrastre viene del cajón.

### 2. "Administrar aplicaciones" e información de la app ✅ Hecho
El cajón de Gingerbread tenía "Administrar aplicaciones". Está hecho como un botón en la barra inferior del cajón, que abre la lista de apps; al tocar una se abre su ficha en Android.
- **API:** `requestOpenAppInfo(packageName)` y `requestOpenAndroidSettings()`.
- **Esfuerzo:** bajo.

### 3. Brillo naranja de overscroll ✅ Hecho
**El brillo naranja al llegar al final de una lista se estrenó justo en Gingerbread.** Bridge permite desactivar el efecto moderno de Android (el estiramiento) para dibujar el nuestro: un brillo naranja en el borde del cajón al llegar arriba o abajo, y en los extremos del escritorio al pasar de la primera o la última página.
- **API:** `requestSetOverscrollEffects('none')` y el evento `overscrollEffectsChanged`.
- **Esfuerzo:** medio. Hay que detectar el "tirón" en el borde y dibujar el brillo con un degradado.

### 4. Añadir el icono al instalar una app ✅ Hecho
El Market de la época agregaba el icono al escritorio al instalar una app. Está hecho, con una opción en Apariencia: *"Al instalar una aplicación: Añadir icono / No añadir"*.
- **API:** el evento `appInstalled`, que ya se recibe, más `findFreeSpot()` del store del escritorio.
- **Esfuerzo:** bajo.

### 5. Widget "Control de energía" ✅ Hecho
Imitar el widget clásico de 4×1 con lo que Bridge **sí** puede hacer:
  - **Bloquear pantalla** (`requestLockScreen`).
  - **Modo noche** (`requestSetSystemNightMode`). Requiere dar un permiso a Bridge una sola vez por adb: `adb shell pm grant com.tored.bridgelauncher android.permission.WRITE_SECURE_SETTINGS`.
  - **Notificaciones** (`requestExpandNotificationShade`).
  - **Ajustes** (`requestOpenAndroidSettings`).
- Cada botón se desactiva si no hay permiso, según `getCanLockScreen()` y `getCanRequestSystemNightMode()`, y reacciona a sus eventos `canLockScreenChanged` y `canRequestSystemNightModeChanged`.
- **Con nuestro fork de Bridge** el widget pasa a 5 botones: **Wi-Fi, Bluetooth, modo de sonido, sincronización y brillo** (se cambió el GPS del original de Android 2.3, que solo abría un panel, por el modo de sonido, que sí cambia de verdad). Bloquear y modo noche siguen ahí con una pulsación larga: sobre el brillo cambia el modo noche y sobre la sincronización bloquea la pantalla (esos dos botones ya no sirven para mover el widget; los otros tres sí). Sincronización, brillo y modo de sonido cambian de verdad (`requestSetRingerMode`, cicla normal → vibrar → silencio; necesita el permiso "Acceso a No molestar"); Wi-Fi y Bluetooth solo abren el panel de Android (`requestOpenSystemPanel`), porque las apps ya no pueden cambiarlos, pero **muestran su estado** (`getWifiEnabled`, `getBluetoothEnabled` y sus eventos). El panel de notificaciones también tiene un botón de modo de sonido en vez de GPS.
- **Esfuerzo:** medio. Aprovecha lo que ya existe para añadir widgets.

> Para el botón del modo noche hay que conceder el permiso una vez con `npm run grant-permissions` (ver "Permisos opcionales" en el README). Bridge 0.1.0alpha no tiene `getCanRequestSystemNightMode()`, así que el launcher intenta el cambio sin poder comprobar el permiso antes. Los permisos se vuelven a leer al volver al launcher, porque darlos por adb no genera ningún evento.

### 6. Toques al fondo animado del sistema ✅ Hecho
Si el usuario elige como fondo del sistema un fondo **animado** (live wallpaper), esos fondos reaccionan a los toques. Eso también era típico de Gingerbread, por ejemplo con el fondo "Nexus" real.
- **API:** `sendWallpaperTap(x, y)` al tocar un hueco vacío cuando el fondo es "Fondo del sistema" (`onWorkspaceClick` en `App.vue`); con nuestro fondo Nexus, el toque sigue generando pulsos. Bridge convierte las coordenadas CSS a píxeles de pantalla.
- **Esfuerzo:** muy bajo.

### 7. Widget de búsqueda de aplicaciones ✅ Hecho
Gingerbread traía de serie el widget de búsqueda de Google: una barra de 4×1 con el logo de Google, un campo de texto y el botón del micrófono. Nuestra versión tiene el mismo aspecto, pero busca **aplicaciones instaladas**; con nuestro fork de Bridge también ofrece la búsqueda web.
- Al tocar la barra se abre un panel de búsqueda a pantalla completa, al estilo de la búsqueda rápida de Gingerbread: el campo arriba con el teclado abierto y, debajo, la lista de resultados con icono y nombre, que se filtra mientras se escribe.
- La búsqueda ignora mayúsculas y tildes ("camara" encuentra "Cámara"), pone primero los nombres que empiezan por el texto y después los que lo contienen. Si hay una sola coincidencia, "Intro" en el teclado la abre.
- Se podrían mostrar las **apps usadas hace poco** cuando el campo está vacío, guardadas en localStorage, como hacía la búsqueda rápida.
- El logo de Google se sustituye por una lupa o un texto propio ("Buscar aplicaciones"), para no usar la marca.
- **API:** la lista de apps que ya carga el cajón (`getAppsURL`) y `requestLaunchApp(packageName)`. El panel se cierra con el botón de inicio (`newIntent`, a través de `useMenuStore`) y con el truco de `history.pushState` que ya usa el cajón para el botón Atrás.
- **Búsqueda web (solo con nuestro fork):** al final de los resultados aparece "Buscar «…» en la web", que abre Google con `requestOpenUrl`. "Intro" también busca en la web cuando no hay exactamente una coincidencia.
- **Limitaciones:** con el Bridge original no hay búsqueda web (no abre URLs). Tampoco hay búsqueda por voz (el WebView de Android no soporta `SpeechRecognition`), así que el botón del micrófono se omite o solo enfoca el campo. Tampoco se puede responder a la tecla física de búsqueda de los teléfonos de la época.
- **Filtrar con cada letra.** En el teléfono los resultados solo se actualizaban al pulsar espacio: el teclado de Android va "componiendo" cada palabra (la que subraya con sugerencias) y el `v-model` de Vue no actualiza el valor hasta que termina la composición. El campo de `SearchPanel.vue` usa `:value` más `@input`, porque el evento `input` llega con cada letra (probado en el teléfono).
- **Esfuerzo:** medio. Está hecho en `src/widgets/search/`, con la búsqueda en `src/utils/search.ts`. Las apps recientes salen de `useAppLauncherStore`, por donde pasan todos los lanzamientos, y el panel usa `useKeyboardInset()` para que el teclado no tape los resultados.

### 34. Los relojes abren la app Reloj ✅ Hecho
En Gingerbread, tocar el widget del reloj abría la app de alarmas. Tocar el reloj analógico (2×2 y 4×2) o el digital (4×1) abre la app Reloj del teléfono.
- **Con el Bridge original:** se lanza la primera app instalada de una lista de paquetes conocidos, igual que hace el dock con el teléfono y el navegador: `com.sec.android.app.clockpackage` (Samsung), `com.google.android.deskclock` (Google) y `com.android.deskclock` (AOSP) (`src/utils/clock.ts`, `findClockApp()`). Se comprueba en la lista de apps (`useAppsStore`) y se abre con `useAppLauncherStore().launch()`. Si no hay ninguna, el toque no hace nada.
- **Con nuestro fork:** `requestOpenAlarms()` lanza `AlarmClock.ACTION_SHOW_ALARMS`, que abre la lista de alarmas de la app de reloj que tenga el usuario, sea cual sea. Lo hace `useAlarmStore.openAlarms()`, que cae a la lista de paquetes si el método no existe o falla (hecho junto con la idea 49).
- La pulsación larga sigue moviendo el widget: `HomeGrid` ya descarta el toque que termina una pulsación larga.
- **Esfuerzo:** muy bajo en el launcher; bajo en el fork.

### 38. Más fondos animados de Gingerbread ✅ Hecho
Además de Nexus, Gingerbread traía otros fondos animados. Están recreados en canvas, con los nombres que tenían en Android 2.3 en español, y se eligen en **Fondo de pantalla**:
- **Hierba:** hierba mecida por el viento bajo un cielo que sigue la hora del día (noche con estrellas, amanecer y atardecer naranjas, día azul). Como el original, usa la salida y puesta del sol reales: las de la ciudad del widget del tiempo (`useWeatherStore`), o 7:00 y 19:30 si no hay ciudad.
- **Galaxia:** una galaxia espiral de dos brazos, un poco inclinada, que gira despacio sobre estrellas y nebulosas. Se dibuja una vez en un canvas aparte y solo se rota en cada fotograma.
- **Humo mágico:** nubes de humo de colores que se desplazan y cambian de color. Al tocar un hueco vacío sale una bocanada de humo en ese punto.
- **Reloj polar:** la hora en anillos que se llenan desde arriba en el sentido de las agujas del reloj: segundos, minutos, horas, día de la semana, día del mes y mes. El color de cada anillo cambia según lo lleno que está.
- Todos se desplazan más lento que las páginas, se pausan con el cajón abierto o el launcher en segundo plano, y usan el ajuste de fluidez (30/60/120 fps). La base común está en `src/wallpaper/useLiveWallpaper.ts`, la lista en `src/wallpaper/liveWallpapers.ts` y la lógica pura (cielo según la hora, anillos del reloj) en `src/utils/liveWallpapers.ts`, con tests.
- **API:** ninguna; son canvas del launcher.
- **Esfuerzo:** medio.

---

## Mejoras de uso

### 8. Doble toque para bloquear la pantalla ⏬ Baja prioridad
No existía en Gingerbread, pero es muy práctico. Sería opcional en Apariencia.
- **API:** `requestLockScreen()` y `getCanLockScreen()`. Requiere activar el servicio de accesibilidad de Bridge y permitir el bloqueo en sus ajustes. En Android 9 y posteriores, después de bloquear así hay que desbloquear con el PIN, no con la huella; Bridge lo advierte en su documentación.
- **Esfuerzo:** bajo.

### 9. Que el teclado no tape los campos ✅ Hecho
Al escribir la ciudad del tiempo o renombrar una carpeta, el teclado puede tapar el campo.
- **API:** `getImeWindowInsets()` y el evento `imeWindowInsetsChanged`, para subir el contenido lo que ocupa el teclado.
- El composable `useKeyboardInset()` combina la altura del teclado que da Bridge con lo que el WebView ya se encogió. Lo usan el panel de búsqueda, **`GbDialog`** (todos los diálogos se recentran sobre el teclado) y la carpeta abierta mientras se renombra.
- La ciudad del tiempo ya no se escribe dentro del widget, que puede estar abajo en el escritorio, sino en un diálogo "Ciudad del tiempo".
- Mientras hay un campo con el foco, `App.vue` no recalcula las filas automáticas: si el teclado encogiera el WebView, menos filas moverían los iconos para siempre.
- Las futuras nota adhesiva (21) y lista de tareas (24) pueden escribir en un `GbDialog` para aprovecharlo.
- **Esfuerzo:** bajo.

### 10. Cambio de página por el borde sin chocar con el gesto "Atrás" ⏬ Baja prioridad
Al arrastrar un icono al borde para pasar de página, esa zona coincide con el gesto de volver atrás de Android.
- **API:** `getSystemGesturesWindowInsets()` y `getMandatorySystemGesturesWindowInsets()`, para usar esa zona como referencia en `EDGE_PX` (`useDragStore`).
- **Esfuerzo:** bajo.

### 11. Esquivar la cámara con precisión ⏬ Baja prioridad
La barra de Gingerbread deja el centro libre "a ojo". Con la forma real del recorte se puede reservar justo ese espacio y colocar las notificaciones y los iconos a su alrededor.
- **API:** `getDisplayCutoutPath()` (Android 12+) y `getDisplayShapePath()` (Android 14+, esquinas redondeadas de la pantalla). Ambas devuelven un path SVG.
- **Esfuerzo:** medio.

### 29. Tamaño de los iconos ✅ Hecho
Un deslizante en **Apariencia → Tamaño de los iconos**, de 75 % a 130 % del tamaño de Gingerbread (48 px), con un botón "Normal" para volver al 100 %.
- Se guarda en `useSettingsStore` (`settings.iconScale`). `App.vue` lo convierte en dos variables CSS en `.launcher-root`: `--icon-size` para el escritorio, las carpetas y el icono que se arrastra (`Shortcut.vue`), y `--drawer-icon-size` para el cajón (`AppDrawer.vue`).
- En el escritorio el icono nunca crece más de lo que cabe en su celda con la etiqueta (`fittedIconSize()` en `src/utils/iconSize.ts`), así que con 7 filas en pantallas bajas puede quedar más chico que lo elegido. El cajón no tiene ese límite.
- El texto de debajo y el dock no cambian: el dock es una barra de altura fija.
- **API:** ninguna; es solo CSS y un ajuste guardado.
- **Esfuerzo:** bajo.

---

## Herramientas y mantenimiento

### 12. Pantalla "Acerca de" y diagnóstico ✅ Hecho
Un botón al final de **Apariencia** abre "Acerca de y diagnóstico" (`src/menu/AboutDialog.vue`), que muestra:
- **Versiones:** la compilación del launcher (commit y si tenía cambios sin commit, inyectados por `vite.config.ts` como `__BUILD_INFO__`), la de Bridge (`getBridgeVersionName` / `getBridgeVersionCode`, y si es nuestro fork) y la de Android (`getAndroidAPILevel`).
- **Pantalla:** tamaño de la ventana, densidad, filas y tamaño de celda.
- **Los insets que informa Bridge, en vivo,** y las alturas que el launcher usa de verdad para las barras y el teclado.
- **Permisos:** bloqueo, modo noche, notificaciones, calendario y ajustes del sistema.
- El **último error** de la API (`getLastErrorMessage`) y los **últimos 30 eventos** de Bridge (los guarda `useBridgeEventStore`).
- Un botón para abrir la **consola de desarrollo** de Bridge (`requestOpenDeveloperConsole`).
- **Ya sirvió:** al abrirla por primera vez mostró que Bridge intercambia arriba e izquierda en todos los insets (ver "Fallos de Bridge" más abajo).

### 13. Detectar funciones según la versión
Usar `getAndroidAPILevel()` para ocultar las opciones que el teléfono no soporta. Por ejemplo, la forma del recorte solo existe desde Android 12, y el modo noche "personalizado" desde Android 11.
- **Esfuerzo:** bajo, y se hace junto con las funciones que lo necesiten.

### 14. Errores con el estilo del launcher
Hoy, cuando algo falla, Bridge muestra su propio aviso (`showToastIfFailed`). Se podría pasar `false` y mostrar el error con un aviso al estilo Gingerbread, usando `getLastErrorMessage()` para el texto.
- **Esfuerzo:** bajo.

---

## Widgets nuevos

Todos son HTML y usan solo APIs web, localStorage o servicios gratuitos sin clave, así que no dependen de Bridge. Cada uno se añade en tres sitios: `WidgetKind`/`WIDGET_SIZES`, `WidgetView.vue` y `AddDialog.vue`. El widget de búsqueda está en la idea 7.

### 15. Reloj digital ✅ Hecho
Hora grande con la fecha debajo, con la tipografía y el estilo de la pantalla de bloqueo de Gingerbread. Complementa al reloj analógico que ya existe.
- **Tamaño:** 4×1 (y quizá una versión 2×1).
- **Esfuerzo:** muy bajo.

### 16. Calendario del mes ✅ Hecho
La cuadrícula del mes actual con el día de hoy resaltado en naranja y flechas para cambiar de mes.
- **Con nuestro fork de Bridge** y el permiso de calendario, los días con eventos llevan puntos del color de su calendario (hasta 3), y al tocar un día se abre la app de calendario en esa fecha (`requestOpenCalendarAt`). Con el Bridge original no muestra eventos, porque su API no puede leer el calendario.
- **Tamaño:** 4×2 o 4×3.
- **Esfuerzo:** bajo. Los nombres de meses y días salen de `Intl.DateTimeFormat('es')`.

### 17. Cuenta regresiva ✅ Hecho
Los días que faltan para una fecha elegida (un cumpleaños, un viaje), con un título: "12 días para Vacaciones", "¡Hoy!" el día mismo y "3 días desde…" después. Al tocarlo se editan el título y la fecha en un diálogo.
- Es el primer widget con datos propios por instancia: `useWidgetData()` en `src/stores/useWidgetDataStore.ts` los guarda en localStorage (`widgets.data`) bajo el id del widget y los borra al quitarlo. Los días salen de `src/utils/countdown.ts`.
- **Tamaño:** 2×1. Está en `src/widgets/countdown/`.

### 18. Pronóstico extendido ✅ Hecho
El tiempo de hoy y los 4 días siguientes (día, icono, máxima y mínima) para la ciudad del widget del tiempo. Tocarlo actualiza.
- **API:** Open-Meteo. `useWeatherStore` ahora pide 6 días (`forecast_days`) con `weather_code`, máximas, mínimas, amanecer y puesta, en la misma petición que el widget del tiempo; los datos guardados por versiones anteriores, sin días, se vuelven a pedir.
- **Tamaño:** 4×2. Está en `src/widgets/forecast/`.

### 19. Sol y luna ✅ Hecho
La fase lunar con un dibujo de la luna y su porcentaje iluminado, y las horas de salida y puesta del sol de la ciudad del tiempo.
- **API:** `sunrise`/`sunset` de Open-Meteo (los mismos datos del pronóstico). La fase se calcula localmente desde una luna nueva conocida (`src/utils/moon.ts`), y la luna se dibuja invertida en el hemisferio sur, como se ve desde allí.
- **Tamaño:** 2×1. Está en `src/widgets/sunMoon/`.

### 20. Batería ✅ Hecho
El porcentaje y un icono de batería al estilo Gingerbread (verde, amarillo o rojo, y el rayo cuando está cargando).
- **API:** la Battery API, a través de `useDeviceStatus`, que ya usa la barra de estado.
- **Tamaño:** 1×1.
- **Esfuerzo:** muy bajo.

### 21. Nota adhesiva ✅ Hecho
Una nota amarilla de papel. Al tocarla se edita el texto en un diálogo, que queda por encima del teclado (idea 9); se guarda por widget con `useWidgetData()`.
- **Tamaño:** 2×2. Está en `src/widgets/note/`.

### 22. Cronómetro y temporizador ✅ Hecho
Un solo widget con dos modos: cronómetro y temporizador. Iniciar/Pausar y Reiniciar; en el temporizador, tocar el tiempo cambia la duración. Al terminar vibra y pita tres veces (Web Audio y `navigator.vibrate`).
- Guarda la hora de inicio y no un contador, así que sigue bien aunque el launcher quede en segundo plano.
- **Limitación:** el aviso solo suena con el launcher visible; si terminó mientras usabas otra app, al volver muestra "¡Tiempo!" parpadeando, sin pitar.
- Sin vueltas por ahora: no caben en 2×1.
- **Tamaño:** 2×1. Está en `src/widgets/timer/`.

### 23. Calculadora ✅ Hecho
Una calculadora básica con el aspecto de la de Gingerbread: pantalla clara, teclas negras y pulsación naranja. Muestra el resultado mientras se escribe.
- Evalúa sin `eval`, con precedencia y números negativos (`src/utils/calculator.ts`, con tests).
- **Tamaño:** 4×3. Está en `src/widgets/calculator/`.

### 24. Lista de tareas ✅ Hecho
Una lista corta: tocar una tarea la marca como hecha (y baja al final). El "+" abre un diálogo para añadir varias seguidas y borrar las hechas; se guarda por widget con `useWidgetData()`.
- **Tamaño:** 2×2. Está en `src/widgets/tasks/`.

### 25. Marco de fotos ✅ Hecho
El clásico widget de Gingerbread: una foto con un marco blanco y ligeramente girada. Al tocarlo se elige la foto con `<input type="file">`; el Bridge original no abre el selector de archivos, nuestro fork sí (mejora 1.2). La foto se reduce a 800 px con un canvas y se guarda en IndexedDB, porque localStorage se queda corto. Cada marco tiene su propia foto. Más adelante podría ir rotando entre varias fotos.
- **Tamaño:** 2×2.
- **Esfuerzo:** medio. Está en `src/widgets/photo/`.

### 26. Apps más usadas ✅ Hecho
Una fila con las 4 apps que más se abren, cada una en su columna para que queden alineadas con los iconos del escritorio. Está en `src/widgets/mostUsed/`.
- Todos los lanzamientos pasan por `useAppLauncherStore`, que guarda las **recientes** (`launcher.recentApps`) y cuántas veces se abrió cada app (`launcher.launchCounts`).
- El orden sale de `mostUsedApps()` en `src/utils/mostUsed.ts`: primero las más abiertas; a igual cantidad, la usada más recientemente. Al principio, cuando todavía no hay cuentas, se completa con las recientes para que el widget no quede vacío.
- Las apps desinstaladas desaparecen del contador.
- **API:** `requestLaunchApp` y el evento `appRemoved`, para quitar las apps desinstaladas.
- **Tamaño:** 4×1.
- **Esfuerzo:** bajo.

### 27. Titulares RSS ✅ Hecho
Los últimos titulares de un feed RSS o Atom, en una lista que se desplaza. Tocar un titular lo abre (con nuestro fork, `requestOpenUrl`); tocar el título cambia el feed. Se actualiza cada 30 minutos y al volver al launcher.
- Viene configurado con el feed de **Cooperativa.cl**, que permite CORS. **Limitación:** el WebView solo puede leer feeds que permitan CORS, y la mayoría no lo hace (la BBC, Xataka, The Verge no; Cooperativa, hnrss.org y Wikipedia sí). El widget lo explica cuando falla. **Mejora en el fork:** un método que descargue la URL desde Bridge, sin CORS.
- La lectura de RSS y Atom está en `src/utils/rss.ts`, con tests.
- **Tamaño:** 4×2. Está en `src/widgets/rss/`.

### 28. Frase del día ✅ Hecho
Una cita que cambia cada día, elegida de una lista incluida en el proyecto (sin red), con su autor.
- **Tamaño:** 4×1.
- **Esfuerzo:** muy bajo.

### 30. Agenda ✅ Hecho
Los próximos eventos del calendario, como el widget de calendario de Android 2.x: a la izquierda el día de la semana y la fecha de hoy, y a la derecha los eventos de los próximos 14 días agrupados por día, cada uno con el color de su calendario, la hora y el título. Está en `src/widgets/agenda/`.
- **Solo con nuestro fork de Bridge:** `getCanReadCalendar`, `requestCalendarPermission`, `getCalendarEventsURL(from, to)`, `requestOpenCalendarEvent`, `requestOpenCalendarAt` y los eventos `canReadCalendarChanged` / `calendarChanged`. `useCalendarStore` lleva el permiso y vuelve a pedir los eventos cuando cambian; la agrupación por día está en `src/utils/calendar-events.ts`.
- Sin permiso, el widget dice "Toca para permitir el acceso al calendario" y al tocarlo aparece el diálogo de Android. Tocar un evento lo abre en la app de calendario, y tocar la fecha abre el calendario en hoy.
- **Tamaño:** 4×2 (caben unas 5 filas).
- **Esfuerzo:** medio, contando lo que hubo que añadir al fork.

### 31. Accesos directos de apps ✅ Hecho
Al mantener pulsada una app, en el escritorio o en el cajón, aparece un menú junto al icono con sus accesos directos ("Nuevo mensaje", "Ir a casa", "Nueva pestaña de incógnito"…) y, al final, "Información de la app". Gingerbread no los tenía (llegaron en Android 7.1), así que el menú imita sus menús contextuales: franja gris con el nombre de la app y filas claras que se ponen naranjas al pulsar.
- **Solo con nuestro fork de Bridge:** `getCanAccessAppShortcuts`, `getAppShortcutsURL`, `getAppShortcutIconURL` y `requestStartAppShortcut`. Android solo le da los accesos al launcher predeterminado.
- La misma pulsación larga inicia el arrastre: si el dedo se mueve, el menú se cierra y se arrastra la app (el cajón se cierra recién entonces); si se suelta sin moverlo, el arrastre se cancela y el menú queda abierto (`useDragStore.hasMoved`).
- Está en `src/shortcuts/` y `useAppShortcutsStore`.
- **Pendiente:** el menú en las apps de las carpetas, y cerrarlo con Atrás.

### 32. Panel de notificaciones y ajustes rápidos ✅ Hecho
Un panel propio al estilo de la cortina de Gingerbread 2.3, que baja al tocar la barra de estado Gingerbread (o el botón de notificaciones del Control de energía) en vez de abrir la de Android.
- Arriba, **ajustes rápidos** con el estilo del Control de energía: linterna, brillo (automático / bajo / medio / alto), rotación, sincronización y modo de sonido (normal / vibrar / silencio) cambian de verdad; Wi-Fi y Bluetooth muestran su estado y abren el panel de Android.
- Debajo, el reproductor de música (idea 33) y las notificaciones en "En curso" y "Notificaciones", con su icono, título, texto y hora. Al tocar una se abre; "Borrar" descarta las que se pueden descartar. Las notificaciones de los reproductores se ocultan mientras se muestra el reproductor (`isMedia`).
- **Solo con nuestro fork de Bridge:** acceso a notificaciones (`getNotificationsURL`, `requestOpenNotification`, `requestDismissNotification` y sus eventos) y ajustes rápidos (`requestSetFlashlightOn`, `requestSetScreenBrightnessAuto` / `Level`, `requestSetAutoRotateOn`, `requestSetMasterSyncOn`, `requestOpenSystemPanel`). Brillo y rotación necesitan el permiso "Modificar ajustes del sistema".
- Está en `src/notifications/`.

### 33. Música ✅ Hecho
Lo que suena en cualquier app (Spotify, YouTube Music…), con carátula, título, artista y los botones anterior / reproducir-pausa / siguiente.
- **Widget "Música"** (4×1) y el reproductor de arriba del panel de notificaciones: `widgets/music/MusicPlayer.vue`, con una barra de progreso que avanza sola.
- **Widget "Música (estilo Songbird)"** (4×1), más de Gingerbread: la carátula en un marco claro y, al lado, "Artista - Título" sobre tres botones grandes grises (`widgets/music/SongbirdPlayer.vue`).
- **Solo con nuestro fork de Bridge** y el acceso a notificaciones: `getMediaSession`, `getMediaArtURL`, `requestMediaAction`, `requestOpenMediaApp` y el evento `mediaSessionChanged`.

### 35. Contactos favoritos ✅ Hecho (solo 4×1)
Una fila (4×1) o cuadrícula (4×2) con las fotos de los contactos marcados como favoritos (con estrella) en la app de Contactos, con su nombre debajo. Al tocar una foto se abre un pequeño menú al estilo del *Quick Contact* de Gingerbread, con **Llamar**, **Mensaje** (SMS) y **Ver contacto**. Sin foto, se dibuja la silueta gris de contacto de Android 2.x.
- Implementado como el widget "Contactos favoritos" (`src/widgets/favContacts/FavContactsWidget.vue`), solo en 4×1 (hasta 4 contactos); la variante 4×2 (8 contactos) queda pendiente.
- **Simplificado:** el toque siempre abre el menú *Quick Contact*; no se implementó la configuración por contacto para que el toque llame directamente sin pasar por el menú.
- **Necesita nuestro fork de Bridge** (ver "Contactos en el fork" más abajo).
- **Esfuerzo:** medio, contando lo del fork.

### 36. Marcación directa ✅ Hecho
El acceso directo "Marcación directa" de Gingerbread (1×1): se elige un contacto y uno de sus números al añadirlo, y queda como un icono con la foto del contacto y un pequeño teléfono verde en la esquina. Al tocarlo **llama directamente** a ese número. La variante **"Mensaje directo"** abre una conversación de SMS con ese número (con un sobre en vez del teléfono).
- Ambas variantes son el mismo componente (`src/widgets/directContact/DirectContactWidget.vue`, prop `mode: 'call' | 'message'`), registradas como los widgets "Marcación directa" y "Mensaje directo".
- El contacto y el número se eligen la primera vez que se toca el icono recién añadido, en un diálogo con buscador que lista un número por fila (mismo contacto con dos números aparece dos veces). Se guardan con `useWidgetData` por el id del icono. **Para cambiar el contacto elegido hay que quitar el icono y añadirlo de nuevo** (no se implementó una forma de reconfigurarlo).
- **Necesita nuestro fork de Bridge** (ver abajo). La llamada directa necesita el permiso `CALL_PHONE`; sin él, el toque abre el marcador con el número escrito (`requestOpenUrl('tel:…')`, que ya existe) y hay que pulsar llamar.
- **Tamaño:** 1×1.
- **Esfuerzo:** bajo, una vez hecha la parte de contactos del fork.

### 37. Contactos en la búsqueda ✅ Hecho
El panel de búsqueda (idea 7) también busca **contactos**, como la búsqueda rápida de Gingerbread: debajo de las apps aparece una sección "Contactos" con la foto, el nombre y el número de los que coinciden (sin tildes ni mayúsculas, igual que las apps). **Al tocar un contacto se le llama** (directamente o abriendo el marcador, según el permiso); con una pulsación larga se ven sus otros números y "Enviar mensaje".
- También sirve escribir un número: si el texto parece un teléfono, aparece "Llamar a …".
- **Necesita nuestro fork de Bridge** (ver abajo). Los contactos se cargan al abrir la búsqueda y se filtran en el launcher (`searchContacts()` en `src/utils/search.ts`).
- **Esfuerzo:** bajo-medio en el launcher.

#### Contactos en el fork (lo que necesitan las ideas 35 a 37)
✅ Implementado en el fork de Bridge (instalado en el teléfono) y consumido en el launcher: `useContactsStore`, el widget de favoritos, marcación/mensaje directo y la búsqueda. Las tres cosas están probadas en el teléfono.
- **Permiso `READ_CONTACTS`**, pedido con el diálogo de Android: `getCanReadContacts()`, `requestContactsPermission()` y el evento `canReadContactsChanged`.
- **`getContactsURL(query?, starredOnly?, limit?)`** (parámetros posicionales, no un objeto): JSON con `id`, `lookupKey`, `name`, `starred`, `hasPhoto` y los números (`number`, `label`, `isPrimary` — el principal va primero y sin duplicados), leídos de `ContactsContract`. `query` busca por nombre y número igual que la app de Contactos (pasar `''` para no filtrar, no `undefined`); `limit` en 0 es sin límite. Evento `contactsChanged` cuando cambian.
- **`getContactPhotoURL(lookupKey)`**: la foto del contacto en alta resolución, 404 si no tiene (revisar `hasPhoto`).
- **`requestOpenContact(lookupKey)`**: abre la ficha del contacto.
- **Permiso `CALL_PHONE` aparte de `READ_CONTACTS`**, también con el diálogo de Android: `getCanCallPhone()`, `requestCallPhonePermission()` y el evento `canCallPhoneChanged`. Las ideas 35-37 necesitan pedir los dos permisos, no solo uno.
- **`requestCallPhoneNumber(number)`**: llama directamente si hay permiso `CALL_PHONE`; si no, abre el marcador con el número ya escrito (equivalente a `requestOpenUrl('tel:…')`, sin pedir el permiso). Los mensajes van con `requestOpenUrl('smsto:…')`.
- En el launcher lo usan `useContactsStore` y las ideas 35 a 37; las carpetas de contactos (idea 43) también lo usarían.

---

## Ideas nuevas (revisión de la API, 26/09/2026)

Revisión de lo que el launcher todavía no aprovecha. De la API publicada queda poco (los insets de gestos y del recorte, ya en las ideas 10 y 11); casi todo sale de nuestro fork, que ya trae batería, volumen, modo de sonido, estadísticas de uso, respuestas a notificaciones y las apps predeterminadas de mensajes, correo y cámara. Van de más a menos Gingerbread y de menos a más esfuerzo; las que dicen "solo en el launcher" funcionan también con el Bridge original.

### 39. Iconos de estado de Gingerbread en la barra ✅ Hecho
La barra de estado de 2.3 mostraba a la izquierda de la señal un icono por cada cosa activa. Nuestra barra Gingerbread ahora los dibuja, en blanco como los de 2.3 (en gris oscuro sobre las barras claras): **Bluetooth** encendido (la runa), **alarma** puesta (un despertador, idea 49), **GPS** encendido (una mira) y el timbre en **vibrar** (un teléfono entre marcas de vibración) o **silencio** (un altavoz tachado).
- **API (fork):** `getRingerMode()` / `ringerModeChanged` y `getBluetoothEnabled()` / `bluetoothEnabledChanged`, ya en `useQuickSettingsStore`; `getLocationEnabled()` / `locationEnabledChanged` volvió al store como `locationOn` (solo lectura, sin botón). Con el Bridge original no se muestran.
- Están en `statusbar/GingerbreadStatusBar.vue`, con la clase `state`.
- **Qué iconos se ven:** en Apariencia, con la barra Gingerbread elegida, "Iconos de la barra" tiene una casilla por icono (notificaciones, Bluetooth, alarma, GPS, vibrar y silencio, actividad de datos, Wi-Fi, señal y batería; la hora siempre se ve), guardadas en `settings.statusBarIcons`. Las casillas son `components/GbCheckRow.vue`, la casilla de 2.3.
- **Esfuerzo:** bajo.

### 40. Batería real y el aviso de batería baja ✅ Hecho
- **`useBatteryStore`:** con el fork lee `getBattery()` / `batteryChanged` (nivel, si carga y por dónde: `pluggedType`); con el Bridge original, la API web de batería, como antes. Lo usan la barra de estado y el widget de batería (`useDeviceStatus` ya no lee la batería).
- **Barra de estado:** el icono de USB decorativo aparece solo con un cable USB cuando el fork dice por dónde carga (con cualquier cargador en el Bridge original, que no lo sabe).
- **Widget de batería:** debajo del porcentaje, de qué está cargando: "USB", "Cargador" o "Inalámbrico" (una palabra, para que quepa en 1×1).
- **El aviso de 2.3** (`menu/LowBatteryDialog.vue`): al bajar al 15 % y otra vez al 5 %, "Conecta el cargador. La batería se está agotando: queda un X % o menos", con "Uso de la batería" (abre los ajustes de Android) y "Cerrar". No avisa mientras carga ni con la primera lectura, así que volver al launcher con 10 % no repite el aviso. La lógica está en `crossedLowBattery()` (`utils/battery.ts`), con tests.
- **Esfuerzo:** bajo.

### 41. Volumen multimedia ✅ Hecho
Gingerbread mostraba un panel con una barra al cambiar el volumen. Las teclas de volumen no llegan al WebView, pero el launcher puede cambiar el volumen multimedia él mismo.
- **Mantener pulsado el botón de modo de sonido**, en el panel de notificaciones o en el Control de energía, abre el diálogo "Volumen" (`menu/VolumeDialog.vue`) con una barra "Multimedia" y "Más ajustes", que abre el panel de volumen de Android (`requestOpenSystemPanel('volume')`).
- La barra es `components/GbSlider.vue`, el deslizador de 2.3: pista oscura hundida, la parte llena en naranja-amarillo y el botón gris brillante (naranja al arrastrarlo).
- **API (fork):** `getMusicVolume()`, `requestSetMusicVolume(0–1)` y `musicVolumeChanged`, sin permisos, en `useQuickSettingsStore`. El volumen del timbre necesitaría un método nuevo en el fork.
- No se puso una barra dentro del reproductor del panel: su diseño es una fila, y el diálogo queda a una pulsación larga del mismo panel.
- **Esfuerzo:** bajo.

### 42. Aplicaciones recientes
Manteniendo pulsado el botón de inicio, Gingerbread mostraba un diálogo con las 8 últimas apps usadas (2 filas de 4 iconos). Bridge no recibe esa pulsación, así que se abriría manteniendo pulsado el botón del cajón en el dock.
- Con el fork y "Acceso de uso", las últimas apps usadas en todo el teléfono (la última vez que se usó cada app, de `getAppUsageURL`); sin él, las abiertas desde el launcher (`useAppLauncherStore`, las mismas que muestra la búsqueda).
- **Esfuerzo:** bajo a medio.

### 43. Carpetas de contactos
En 2.3, "Añadir → Carpetas" ofrecía, además de la carpeta nueva, carpetas "vivas": **Todos los contactos**, **Contactos con número de teléfono** y **Contactos destacados**. Se abren como una carpeta, con la lista de contactos (foto con el marco de `gb-contact-photo` y nombre), y tocar uno abre el menú de llamar / mensaje / ver contacto de los favoritos.
- **API (fork):** `getContactsURL(query, starredOnly, limit)` (solo trae contactos con número, así que "Todos" y "Con número" serían la misma lista), `getContactPhotoURL` y lo demás de `useContactsStore`.
- Un nuevo tipo de elemento en `useHomeLayoutStore` (o una carpeta con un campo `source`), su icono de carpeta con la silueta de contacto y la lista en `FolderPanel`.
- **Esfuerzo:** medio.

### 44. Widget de mensajes
Las últimas conversaciones de la app de mensajes predeterminada (remitente, texto y hora), con respuesta rápida sin abrir la app.
- **API (fork):** `getDefaultAppPackageName('sms')` para saber qué notificaciones mirar (y `'email'` para una variante de correo), las notificaciones que ya lee `useNotificationsStore`, y `requestReplyToNotification` para responder (el panel ya lo usa). Solo ve los mensajes que tienen notificación sin leer: el fork no lee los SMS.
- Tamaño 4×2, con la barra "Mensajes" y la lista hundida del estilo de los widgets.
- **Esfuerzo:** medio.

### 45. Márgenes de pantalla precisos ✅ Hecho
El fork ya informaba bien los márgenes y el launcher los tomaba bien (usa el mayor `top` de varias fuentes). Lo que faltaba era el **Bridge original**, donde el `top` real llega en `left`: ahí el launcher dependía de sus alternativas (`env(safe-area-inset-top)`, un mínimo, la altura manual).
- `useWindowInsetsStore` deshace el intercambio (`unswapInsets()`, con tests) en los valores y en los eventos cuando Bridge no tiene `getWindowInsetsSwapFixed()` (todas las versiones sin el arreglo lo tienen). Con el fork arreglado no toca nada. Así el Bridge original también da la altura real de la barra y del recorte de la cámara.
- **Sin hacer:** usar `getTappableElementWindowInsets()` para distinguir la navegación por gestos de la de botones; se verá con la idea 10.
- **Esfuerzo:** bajo.

### 46. Vista previa de las pantallas
En Gingerbread, mantener pulsados los puntos de los lados del dock mostraba las 5 pantallas en miniatura para saltar a una.
- Solo en el launcher: las miniaturas se dibujan con los mismos `HomeGrid` a escala (como las vistas previas de "Añadir"), sobre un fondo oscuro.
- **Esfuerzo:** medio.

### 47. Copia de seguridad del escritorio
Todo el diseño (pantallas, carpetas, widgets y sus datos, ajustes) vive en el `localStorage` del WebView: si se borran los datos de Bridge o se reinstala, se pierde.
- En "Acerca de y diagnóstico": **Exportar**, que genera un archivo JSON con `home.*`, `widgets.data`, `settings.*`, `launcher.*` y `weather.*`, e **Importar**, que lo lee con `<input type="file">` (el fork ya abre el selector de Android) y recarga el launcher.
- Las fotos del marco de fotos (IndexedDB) irían aparte o se omitirían.
- **API:** para exportar, el WebView de Bridge no guarda descargas; habría que copiar el JSON al portapapeles o agregar al fork un método para guardar un archivo (por ejemplo `requestSaveFile(name, text)`, con el selector de Android). Importar funciona ya.
- **Esfuerzo:** medio.

### 48. Widget de marcadores
El widget "Marcadores" del navegador de 2.3: una cuadrícula de sitios con su nombre, que abre el navegador en cada uno.
- Solo en el launcher: los sitios se agregan y editan en un `WidgetDialog` y se guardan con `useWidgetData`. El icono de cada sitio sería su `favicon` (`https://sitio/favicon.ico`), con una letra de respaldo.
- **API:** `requestOpenUrl` (fork); con el Bridge original no se pueden abrir enlaces.
- **Esfuerzo:** bajo a medio.

### 49. Próxima alarma ✅ Hecho
La barra de estado de 2.3 mostraba un despertador cuando había una alarma puesta, y la pantalla de bloqueo, la hora de la próxima.
- **Fork (nuevo):** `getNextAlarm()` (JSON `{ triggerTime, packageName }` o `null`, de `AlarmManager.getNextAlarmClock()`, sin permisos), el evento `nextAlarmChanged` (del broadcast `ACTION_NEXT_ALARM_CLOCK_CHANGED`, en `AlarmHolder`) y `requestOpenAlarms()` (`AlarmClock.ACTION_SHOW_ALARMS`, con el permiso normal `SET_ALARM`), que completa la idea 34.
- **Launcher:** `useAlarmStore`; el despertador en la barra Gingerbread (idea 39) y la hora de la próxima alarma junto a la fecha del reloj digital ("7:00 AM", `formatClockTime()` en `utils/clock.ts`). Los relojes abren la lista de alarmas.
- **Esfuerzo:** bajo en los dos.

### 50. Tema de Bridge a juego ✅ Hecho
Al elegir la barra Gingerbread, el launcher pone en oscuro las pantallas propias de Bridge (ajustes, consola, su cajón), para que no destaquen al abrirlas, y al quitarla restaura el tema que había (`settings.savedBridgeTheme`, vacío si no lo cambió, para no pisar un tema oscuro que ya estaba), como hace con la barra de estado y el overscroll.
- **API:** `getBridgeTheme()` / `requestSetBridgeTheme()` (API publicada), a través de `useTogglesStore.bridgeTheme`.
- **Esfuerzo:** muy bajo.

---

## Fallos de Bridge

Fallos del propio Bridge (también del original, no solo de nuestro fork) que el launcher esquivaba.

- ✅ **Arreglado en el fork: arriba e izquierda intercambiados en todos los insets.** `WindowInsetsSnapshot` declaraba `(top, left, right, bottom)`, pero `getSnapshot()` en `WindowInsetsSnapshot.kt` le pasaba por posición `(left, top, right, bottom)`. En un Z Flip5 en vertical, el recorte de la cámara (33 px, arriba) llegaba como `left: 33, top: 0`. Corregido pasando los argumentos por nombre; afecta a los getters y a los eventos. Los builds anteriores (incluido el Bridge original) siguen con el bug: `getWindowInsetsSwapFixed()` (nuevo, comprobar con `bridgeHas`) dice si el Bridge instalado ya lo trae arreglado.
- ✅ **Arreglado en el fork: los eventos de insets no seguían los tipos de la API.** Se llamaban `ImeWindowInsetsChanged` (con mayúscula) y traían el valor en `insets`. Ahora usan el nombre en minúscula inicial (`imeWindowInsetsChanged`) y `newValue`, como documenta la API. El launcher sigue aceptando las dos formas (`parseInsetsEvent()`) por si corre sobre un Bridge sin el fix.

## Lo que la API no permite (sin ampliar Bridge)

- Widgets nativos de Android.
- Abrir intents que no sean "abrir una app" o una URL.
- Detectar el botón Atrás. Hay un truco que sí funciona: `history.pushState` al abrir el cajón o la búsqueda, porque Bridge pasa el "atrás" al historial del WebView.
- Packs de iconos: están en la API como borrador, pero todavía no los ofrece Bridge.

Todo esto requeriría ampliar Bridge en Kotlin. Nuestro [fork](https://github.com/njpd57/bridge-launcher) ya resolvió, entre otras cosas, saber las apps predeterminadas, abrir URLs, bloquear la orientación en vertical, leer notificaciones, música, calendario y la señal real, los ajustes rápidos y los accesos directos de apps (ver la tabla del principio); el plan para el resto está en la página de Confluence "Mejoras propuestas a Bridge (fork)".
