package com.farecheck.app.ocr;

import android.accessibilityservice.AccessibilityService;
import android.content.ComponentName;
import android.content.Context;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.annotation.Nullable;

/**
 * Servicio de accesibilidad que LEE el contenido de la pantalla de las apps de
 * transporte para detectar ofertas de viaje en tiempo real. No interactúa ni hace
 * clics: solo lee texto (lectura pasiva), identifica la plataforma con
 * {@link PlatformDetector}, lo pasa al parser específico vía {@link OfferParser} y, si
 * obtiene una oferta válida, la reenvía a JavaScript vía {@link OcrBridgeModule}.
 *
 * Flujo completo del producto:
 *   [Pantalla DiDi/Uber] → AccessibilityService (lee) → PlatformDetector + parser por
 *     plataforma (extrae $/km) → OcrBridgeModule (evento a JS) → analisisClient.analizar()
 *     → POST /api/v1/analisis → semaforo.service (backend) → VERDE/AMARILLO/ROJO → overlay.
 *
 * La configuración (qué eventos/paquetes escucha) está en
 * res/xml/accessibility_service_config.xml y se declara en el AndroidManifest. La lista
 * de packages objetivo vive en {@link PlatformDetector} (única fuente de verdad).
 */
public class OfferReaderAccessibilityService extends AccessibilityService {

    private static final String TAG = "FareCheckOcr";

    /** Debounce: no reprocesar la misma pantalla más de una vez cada N ms. */
    private static final long DEBOUNCE_MS = 600;

    private long ultimoProcesoMs = 0;
    private String ultimaFirma = "";

    @Override
    public void onAccessibilityEvent(@Nullable AccessibilityEvent event) {
        if (event == null) return;

        final int tipo = event.getEventType();
        if (tipo != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
                && tipo != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED) {
            return;
        }

        final CharSequence pkg = event.getPackageName();
        final Platform platform = PlatformDetector.detect(pkg);
        if (platform == Platform.UNKNOWN) {
            return; // ignora cualquier app que no sea de transporte soportada
        }

        final long ahora = SystemClock.uptimeMillis();
        if (ahora - ultimoProcesoMs < DEBOUNCE_MS) return;
        ultimoProcesoMs = ahora;

        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;

        try {
            final StringBuilder sb = new StringBuilder();
            recolectarTexto(root, sb);
            final String screenText = sb.toString();
            if (screenText.isEmpty()) return;

            final OfferParser.ParsedOffer offer = OfferParser.parse(platform, screenText);
            if (!offer.isValid()) return;

            // Evita emitir la misma oferta repetidamente mientras no cambie en pantalla.
            final String firma = offer.valorCop + "|" + offer.kmRecorrido + "|" + offer.tiempoTotalMin;
            if (firma.equals(ultimaFirma)) return;
            ultimaFirma = firma;

            Log.d(TAG, "Oferta detectada en " + pkg + " → " + offer);
            OcrBridgeModule.emitOffer(pkg.toString(), offer);
        } finally {
            root.recycle();
        }
    }

    @Override
    public void onInterrupt() {
        // Requerido por la interfaz; no hay trabajo en curso que interrumpir.
    }

    /**
     * ¿El usuario habilitó este servicio de accesibilidad? Lee
     * Settings.Secure.ACCESSIBILITY_ENABLED y ENABLED_ACCESSIBILITY_SERVICES y comprueba
     * que nuestro componente esté en la lista. Estático para poder llamarlo desde el
     * bridge RN sin que el servicio esté corriendo.
     */
    public static boolean isAccessibilityEnabled(@Nullable Context context) {
        if (context == null) return false;

        int accesibilidadActiva;
        try {
            accesibilidadActiva = Settings.Secure.getInt(
                    context.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED);
        } catch (Settings.SettingNotFoundException e) {
            accesibilidadActiva = 0;
        }
        if (accesibilidadActiva != 1) return false;

        final String habilitados = Settings.Secure.getString(
                context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);

        final ComponentName self = new ComponentName(context, OfferReaderAccessibilityService.class);
        return AccessibilityStatus.isServiceListed(
                habilitados, self.flattenToString(), self.flattenToShortString());
    }

    /** Recorre el árbol de nodos en profundidad y concatena todo el texto visible. */
    private void recolectarTexto(@Nullable AccessibilityNodeInfo node, StringBuilder out) {
        if (node == null) return;

        final CharSequence text = node.getText();
        if (text != null && text.length() > 0) {
            out.append(text).append('\n');
        }
        final CharSequence desc = node.getContentDescription();
        if (desc != null && desc.length() > 0) {
            out.append(desc).append('\n');
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo child = node.getChild(i);
            if (child != null) {
                recolectarTexto(child, out);
                child.recycle();
            }
        }
    }
}
