package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Locale;

/**
 * Mapeo PURO semáforo → color de marca + mensaje por defecto, usado por el overlay.
 * Sin dependencias de Android → testeable con JUnit. Los HEX son los oficiales de
 * FareCheck (verde #1DB87A, ámbar #F5A623, rojo #E53935, navy #1A2B5E).
 */
final class SemaforoVisual {

    static final int VERDE    = 0xFF1DB87A;
    static final int AMARILLO = 0xFFF5A623;
    static final int ROJO     = 0xFFE53935;
    static final int NAVY     = 0xFF1A2B5E; // fallback / texto

    private SemaforoVisual() {}

    /** Color ARGB para el semáforo (NAVY si es desconocido/null). */
    static int colorForName(@Nullable String semaforo) {
        if (semaforo == null) return NAVY;
        switch (semaforo.toUpperCase(Locale.ROOT)) {
            case "VERDE":    return VERDE;
            case "AMARILLO": return AMARILLO;
            case "ROJO":     return ROJO;
            default:         return NAVY;
        }
    }

    /** Mensaje por defecto si JS no envía uno (frases de S3-03). */
    @NonNull
    static String defaultMessage(@Nullable String semaforo) {
        if (semaforo == null) return "";
        switch (semaforo.toUpperCase(Locale.ROOT)) {
            case "VERDE":    return "Buen servicio";
            case "AMARILLO": return "Servicio regular";
            case "ROJO":     return "No rentable";
            default:         return "";
        }
    }

    /** Etiqueta corta (la palabra del semáforo en mayúsculas) para el título grande. */
    @NonNull
    static String titleForName(@Nullable String semaforo) {
        if (semaforo == null) return "—";
        switch (semaforo.toUpperCase(Locale.ROOT)) {
            case "VERDE":    return "VERDE";
            case "AMARILLO": return "AMARILLO";
            case "ROJO":     return "ROJO";
            default:         return "—";
        }
    }
}
