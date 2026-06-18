package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Lógica PURA para decidir si nuestro servicio de accesibilidad está en la lista de
 * servicios habilitados del sistema. Separada de {@link OfferReaderAccessibilityService}
 * (que depende de Android) para poder testearla con JUnit sin emulador.
 *
 * El sistema guarda los servicios habilitados en
 * Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES como una lista separada por ':',
 * p.ej. "com.otra/.Servicio:com.farecheck.app/com.farecheck.app.ocr.OfferReaderAccessibilityService".
 */
final class AccessibilityStatus {

    private AccessibilityStatus() {}

    /**
     * @param enabledServices valor crudo de ENABLED_ACCESSIBILITY_SERVICES (puede ser null).
     * @param flatName        ComponentName.flattenToString() del servicio (paquete completo).
     * @param shortName       ComponentName.flattenToShortString() (con clase relativa ".Xxx").
     * @return true si el servicio aparece en la lista (comparación case-insensitive).
     */
    static boolean isServiceListed(@Nullable String enabledServices,
                                   @NonNull String flatName,
                                   @NonNull String shortName) {
        if (enabledServices == null || enabledServices.isEmpty()) return false;
        for (String component : enabledServices.split(":")) {
            String c = component.trim();
            if (c.equalsIgnoreCase(flatName) || c.equalsIgnoreCase(shortName)) {
                return true;
            }
        }
        return false;
    }
}
