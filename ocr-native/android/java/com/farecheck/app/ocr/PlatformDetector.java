package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Identifica qué app de transporte está en pantalla a partir de su package name
 * (el que entrega AccessibilityEvent.getPackageName()).
 *
 * Los packages coinciden con la columna `package_android` del catálogo del backend
 * (prisma/seed.ts). Mantener ambos sincronizados.
 */
public final class PlatformDetector {

    private static final Map<String, Platform> POR_PACKAGE;

    static {
        Map<String, Platform> m = new HashMap<>();
        m.put("com.didiglobal.passenger", Platform.DIDI);
        m.put("com.ubercab.driver",       Platform.UBER);
        m.put("com.picap.android",        Platform.PICAP);
        m.put("ru.yandex.taximeter",      Platform.YANGO);
        m.put("sinet.startup.inDriver",   Platform.INDRIVE);
        m.put("com.taxislibres.driver",   Platform.TAXIS_LIBRES);
        POR_PACKAGE = Collections.unmodifiableMap(m);
    }

    private PlatformDetector() {}

    /** Devuelve la plataforma del package, o UNKNOWN si no es una app soportada. */
    @NonNull
    public static Platform detect(@Nullable CharSequence packageName) {
        if (packageName == null) return Platform.UNKNOWN;
        Platform p = POR_PACKAGE.get(packageName.toString());
        return p != null ? p : Platform.UNKNOWN;
    }

    /** True si el package corresponde a una app que analizamos. */
    public static boolean isSupported(@Nullable CharSequence packageName) {
        return detect(packageName) != Platform.UNKNOWN;
    }

    /** Lista de packages soportados (para android:packageNames del servicio). */
    @NonNull
    public static String packageNamesCsv() {
        return String.join(",", POR_PACKAGE.keySet());
    }
}
