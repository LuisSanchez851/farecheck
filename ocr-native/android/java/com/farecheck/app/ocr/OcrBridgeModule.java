package com.farecheck.app.ocr;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * Puente React Native ↔ Android para el módulo OCR.
 *
 * Expone el módulo nativo "FareCheckOcr" a JavaScript y, sobre todo, sirve de canal
 * para que {@link OfferReaderAccessibilityService} (que vive fuera del ciclo de vida
 * de React) entregue las ofertas detectadas al JS mediante un evento.
 *
 * El servicio de accesibilidad no tiene acceso directo al ReactContext, así que
 * guardamos una referencia estática al contexto activo y emitimos el evento por ahí.
 */
public class OcrBridgeModule extends ReactContextBaseJavaModule {

    public static final String NAME = "FareCheckOcr";
    public static final String EVENT_OFFER_DETECTED = "onOfferDetected";
    public static final String EVENT_OVERLAY_DECISION = "onOverlayDecision";

    @Nullable
    private static ReactApplicationContext reactContextRef;

    public OcrBridgeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContextRef = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return NAME;
    }

    /**
     * Llamado por el AccessibilityService cuando detecta una oferta válida.
     * Empaqueta el ParsedOffer y lo emite a JS como evento "onOfferDetected".
     * El payload coincide con el body de POST /api/v1/analisis (faltan plataforma_id
     * y turno_id, que JS añade desde el estado de la app).
     */
    public static void emitOffer(@NonNull String packageName, @NonNull OfferParser.ParsedOffer offer) {
        final ReactApplicationContext ctx = reactContextRef;
        if (ctx == null || !ctx.hasActiveReactInstance()) {
            return; // la app JS aún no está lista para recibir eventos
        }

        WritableMap payload = Arguments.createMap();
        payload.putString("package_android", packageName);
        payload.putInt("valor_cop", offer.valorCop);
        payload.putDouble("km_recorrido", offer.kmRecorrido);
        payload.putDouble("km_recogida", offer.kmRecogida);
        payload.putInt("tiempo_total_min", offer.tiempoTotalMin);
        payload.putInt("tiempo_recogida_min", offer.tiempoRecogidaMin);

        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_OFFER_DETECTED, payload);
    }

    /**
     * Llamado por {@link FloatingOverlayService} cuando el conductor toca Aceptar/Rechazar.
     * Reenvía la decisión a JS, que hace el PATCH /analisis/:viaje_id/decision.
     */
    public static void emitDecision(@Nullable String viajeId, @NonNull String decision) {
        final ReactApplicationContext ctx = reactContextRef;
        if (ctx == null || !ctx.hasActiveReactInstance() || viajeId == null) return;

        WritableMap payload = Arguments.createMap();
        payload.putString("viaje_id", viajeId);
        payload.putString("decision", decision);

        ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(EVENT_OVERLAY_DECISION, payload);
    }

    // ── Métodos llamables desde JS ───────────────────────────────────────────

    /**
     * Indica si el servicio de accesibilidad de FareCheck está habilitado por el usuario.
     * Lee Settings.Secure vía {@link OfferReaderAccessibilityService#isAccessibilityEnabled}.
     */
    @ReactMethod
    public void checkAccessibilityEnabled(Promise promise) {
        try {
            promise.resolve(
                    OfferReaderAccessibilityService.isAccessibilityEnabled(getReactApplicationContext()));
        } catch (Exception e) {
            promise.reject("accessibility_check_failed", e);
        }
    }

    /** Abre los ajustes de Accesibilidad para que el usuario habilite el servicio. */
    @ReactMethod
    public void openAccessibilitySettings() {
        final ReactApplicationContext ctx = getReactApplicationContext();
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    }

    // ── Overlay del semáforo (S3-03) ──────────────────────────────────────────

    /** ¿Tenemos permiso para dibujar sobre otras apps (SYSTEM_ALERT_WINDOW)? */
    @ReactMethod
    public void canDrawOverlays(Promise promise) {
        promise.resolve(Settings.canDrawOverlays(getReactApplicationContext()));
    }

    /** Abre los ajustes para conceder el permiso de "mostrar sobre otras apps". */
    @ReactMethod
    public void openOverlaySettings() {
        final ReactApplicationContext ctx = getReactApplicationContext();
        Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(intent);
    }

    /**
     * Muestra (o actualiza) el overlay flotante con el resultado del semáforo.
     * @param semaforo "VERDE" | "AMARILLO" | "ROJO"
     * @param mensaje  texto a mostrar (si viene vacío, el servicio usa uno por defecto)
     * @param viajeId  id del viaje analizado, para reportar la decisión del conductor
     */
    @ReactMethod
    public void showOverlay(String semaforo, String mensaje, String viajeId) {
        final ReactApplicationContext ctx = getReactApplicationContext();
        Intent intent = new Intent(ctx, FloatingOverlayService.class)
                .setAction(FloatingOverlayService.ACTION_SHOW)
                .putExtra(FloatingOverlayService.EXTRA_SEMAFORO, semaforo)
                .putExtra(FloatingOverlayService.EXTRA_MENSAJE, mensaje)
                .putExtra(FloatingOverlayService.EXTRA_VIAJE_ID, viajeId);
        ctx.startService(intent);
    }

    /** Oculta el overlay y detiene el servicio. */
    @ReactMethod
    public void hideOverlay() {
        final ReactApplicationContext ctx = getReactApplicationContext();
        Intent intent = new Intent(ctx, FloatingOverlayService.class)
                .setAction(FloatingOverlayService.ACTION_HIDE);
        ctx.startService(intent);
    }

    // Requeridos por NativeEventEmitter en el lado JS (evita warnings).
    @ReactMethod
    public void addListener(String eventName) { /* no-op */ }

    @ReactMethod
    public void removeListeners(double count) { /* no-op */ }
}
