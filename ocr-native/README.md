# FareCheck OCR — Módulo nativo Android (S3-01)

Lectura pasiva de la pantalla de las apps de transporte (DiDi/Uber/Picap…) mediante un
**AccessibilityService**, para detectar ofertas de viaje y analizarlas con el backend.

> ⚠️ Solo lee texto. No hace clics ni acciones automáticas.
> ⚠️ La clasificación VERDE/AMARILLO/ROJO **NO** vive aquí: el cliente solo extrae
> `$` y `km` y los envía al backend, que aplica los umbrales del conductor. Ver
> `farecheck-api/src/services/semaforo.service.ts`.

## Pipeline completo

```
[Pantalla DiDi/Uber]
   │  (texto en pantalla)
   ▼
OfferReaderAccessibilityService.java   ← lee el árbol de nodos
   ▼
OfferParser.java                       ← extrae valor_cop, km, min (lógica pura)
   ▼
OcrBridgeModule.java  ──emit("onOfferDetected")──►  src/services/ocr.ts (JS)
                                                        │
                                                        ▼
                                          analisisClient.analizar()  → POST /api/v1/analisis
                                                        │
                                                        ▼
                              backend semaforo.service → { semaforo, valor_copkm, … }
                                                        ▼
                                          overlay VERDE/AMARILLO/ROJO (S3-03)
```

## Archivos

| Archivo | Rol |
|---|---|
| `android/java/.../OfferReaderAccessibilityService.java` | Lee la pantalla, detecta la plataforma y dispara el parser. |
| `android/java/.../PlatformDetector.java` | package name → `Platform` (DIDI, UBER, …). |
| `android/java/.../Platform.java` | Enum de plataformas soportadas. |
| `android/java/.../PlatformParser.java` | Interfaz `parse(text) → ParsedOffer`. |
| `android/java/.../BasePlatformParser.java` | Maquinaria compartida: regex + extracción por etiqueta + fallback. |
| `android/java/.../{DiDi,Uber,Picap,Yango,InDrive,TaxisLibres}Parser.java` | Parsers concretos por app (S3-02). |
| `android/java/.../GenericParser.java` | Fallback heurístico (sin plataforma). |
| `android/java/.../PlatformParserFactory.java` | `Platform` → parser concreto. |
| `android/java/.../AccessibilityStatus.java` | Lógica pura: ¿está nuestro servicio en la lista de habilitados? |
| `android/java/.../OfferParser.java` | Punto de entrada + modelo `ParsedOffer`. Enruta a los parsers. |
| `android/java/.../FloatingOverlayService.java` | Overlay flotante del semáforo (SYSTEM_ALERT_WINDOW). |
| `android/java/.../SemaforoVisual.java` | Lógica pura: semáforo → color de marca + mensaje. |
| `android/java/.../OcrBridgeModule.java` | Puente RN: ofertas, estado de accesibilidad y control del overlay. |
| `android/java/.../OcrBridgePackage.java` | Registra el módulo nativo. |
| `android/res/xml/accessibility_service_config.xml` | Config del servicio (eventos, apps objetivo). |
| `android/res/layout/semaforo_overlay.xml` + `res/drawable/overlay_*.xml` | UI del overlay. |
| `android/test/.../*Test.java` | Tests JUnit (parser, detector, accesibilidad, semáforo). |
| `../plugins/withFareCheckOcr.js` | Config plugin: inyecta todo lo anterior en `prebuild`. |
| `../src/services/ocr.ts` | Wrapper TS: escucha ofertas → llama al backend. |

### Cómo añadir una plataforma nueva
1. Añade el valor al enum `Platform` y el package en `PlatformDetector`.
2. Crea `XxxParser extends BasePlatformParser` con las etiquetas de esa app.
3. Regístralo en `PlatformParserFactory`.
4. Añade el package a `accessibility_service_config.xml` (`android:packageNames`).
5. Añade un caso de texto real en `PlatformParserTest`.

## Por qué un config plugin

Expo **regenera** la carpeta `android/` en cada `expo prebuild`, así que el código nativo
se perdería si viviera ahí. La fuente de verdad es `ocr-native/`, y `withFareCheckOcr.js`
la copia + cablea el manifest y `MainApplication` durante el prebuild. Ya está registrado
en `app.json` → `expo.android.plugins`.

## Cómo construir y probar (requiere dispositivo/emulador — fuera de S3-01)

```bash
# 1. Generar el proyecto nativo con el plugin aplicado
npx expo prebuild -p android --clean

# 2. Compilar e instalar en un dispositivo (Expo Go NO sirve: es código nativo)
npx expo run:android

# 3. En el dispositivo: Ajustes → Accesibilidad → FareCheck → Activar
#    (desde la app: openAccessibilitySettings() en src/services/ocr.ts)

# 4. Tests unitarios del parser (tras copiarlo a app/src/test, ver abajo)
cd android && ./gradlew testDebugUnitTest
```

### Activar los tests del parser
El plugin solo copia las fuentes de producción. Para correr los tests JUnit:
```bash
mkdir -p android/app/src/test/java/com/farecheck/app/ocr
cp ocr-native/android/test/com/farecheck/app/ocr/*.java \
   android/app/src/test/java/com/farecheck/app/ocr/
```
(o añadir un `withDangerousMod` análogo en el plugin si se quiere automatizar).

## Uso desde JS

```ts
import {
  startOcrAnalysis, isAccessibilityEnabled, openAccessibilitySettings,
  canDrawOverlays, openOverlaySettings,
} from './services/ocr';

// 1. Permisos: accesibilidad (leer pantalla) + overlay (dibujar encima).
if (!(await isAccessibilityEnabled())) openAccessibilitySettings();
if (!(await canDrawOverlays()))        openOverlaySettings();

// 2. Inicia el análisis. El overlay del semáforo se muestra automáticamente al recibir
//    la respuesta de /analisis, y la decisión del conductor (Aceptar/Rechazar en el
//    overlay) se registra sola vía PATCH /analisis/:id/decision.
const sub = startOcrAnalysis({
  turnoId: turno.id,
  resolvePlataformaId: (pkg) => plataformasPorPackage[pkg],
  onResult: (offer, analisis) => console.log('Semáforo', analisis.semaforo),
  onDecisionRecorded: (r) => console.log('Decisión registrada', r.decision),
  onError: (offer, err) => console.warn('No se pudo analizar', err),
  // showOverlay: false,  // si prefieres renderizar el resultado en React
});

// Al finalizar el turno / desmontar:
sub.remove();
```

> El overlay también se puede controlar manualmente: `showOverlay(semaforo, mensaje, viajeId)`,
> `hideOverlay()`, y `recordDecision(viajeId, 'aceptado'|'rechazado')`.

## Pendiente (siguientes tickets)

- **S3-02 ✅**: parsers por plataforma con etiquetas (recogida vs recorrido). Hecho.
- **S3-02b ✅**: estado real del servicio de accesibilidad (`Settings.Secure`) +
  `PATCH /analisis/:viaje_id/decision` + `recordDecision()` en el bridge. Hecho.
- **S3-03 ✅**: overlay flotante (SYSTEM_ALERT_WINDOW) con el semáforo, arrastrable y
  minimizable, con botones Aceptar/Rechazar cableados al backend. Hecho.
- **iOS**: no permite leer pantallas de terceros → se evaluará captura + OCR manual.
