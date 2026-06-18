package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.Locale;

/**
 * Punto de entrada del parseo de ofertas y dueño del modelo {@link ParsedOffer}.
 *
 * Desde S3-02 el trabajo real lo hacen los parsers por plataforma
 * ({@link PlatformParser} + {@link BasePlatformParser}); esta clase solo enruta:
 *   - {@link #parse(Platform, String)} → parser específico (DiDi, Uber, …).
 *   - {@link #parse(String)}           → heurística genérica (sin plataforma).
 *
 * NOTA: el parser NO clasifica el semáforo. Solo normaliza números. La decisión
 * VERDE/AMARILLO/ROJO vive exclusivamente en el backend (semaforo.service.ts), que lee
 * los umbrales del conductor desde PostgreSQL. El cliente nunca conoce esos umbrales.
 */
public final class OfferParser {

    private OfferParser() {}

    /**
     * Resultado del parseo. Inmutable. Los campos no encontrados quedan en 0.
     * Reúne los datos que el backend espera en POST /api/v1/analisis.
     */
    public static final class ParsedOffer {
        public final int valorCop;
        public final double kmRecorrido;
        public final double kmRecogida;
        public final int tiempoTotalMin;
        public final int tiempoRecogidaMin;

        ParsedOffer(int valorCop, double kmRecorrido, double kmRecogida,
                    int tiempoTotalMin, int tiempoRecogidaMin) {
            this.valorCop = valorCop;
            this.kmRecorrido = kmRecorrido;
            this.kmRecogida = kmRecogida;
            this.tiempoTotalMin = tiempoTotalMin;
            this.tiempoRecogidaMin = tiempoRecogidaMin;
        }

        /**
         * Una oferta solo es accionable si tenemos al menos valor y distancia del
         * recorrido (lo mínimo que el backend necesita para calcular COP/km).
         */
        public boolean isValid() {
            return valorCop > 0 && kmRecorrido > 0;
        }

        @NonNull
        @Override
        public String toString() {
            return String.format(Locale.US,
                    "ParsedOffer{valorCop=%d, kmRecorrido=%.2f, kmRecogida=%.2f, tiempoTotalMin=%d, tiempoRecogidaMin=%d}",
                    valorCop, kmRecorrido, kmRecogida, tiempoTotalMin, tiempoRecogidaMin);
        }
    }

    /** Oferta vacía reutilizable (texto sin datos útiles). */
    static final ParsedOffer EMPTY = new ParsedOffer(0, 0, 0, 0, 0);

    /** Fábrica interna usada por los parsers concretos (mismo paquete). */
    @NonNull
    static ParsedOffer offer(int valorCop, double kmRecorrido, double kmRecogida,
                             int tiempoTotalMin, int tiempoRecogidaMin) {
        return new ParsedOffer(valorCop, kmRecorrido, kmRecogida, tiempoTotalMin, tiempoRecogidaMin);
    }

    /**
     * Parseo guiado por plataforma (S3-02). Usa el parser específico de la app; si la
     * plataforma es UNKNOWN, cae a la heurística genérica.
     */
    @NonNull
    public static ParsedOffer parse(@NonNull Platform platform, @Nullable String screenText) {
        return PlatformParserFactory.forPlatform(platform).parse(screenText);
    }

    /**
     * Parseo sin plataforma: heurística genérica (mayor distancia = recorrido, menor =
     * recogida). Se mantiene como fallback y para compatibilidad con S3-01.
     */
    @NonNull
    public static ParsedOffer parse(@Nullable String screenText) {
        return GenericParser.INSTANCE.parse(screenText);
    }

    // ── Helpers numéricos compartidos (usados por BasePlatformParser y tests) ──────

    /**
     * Normaliza un valor en pesos colombianos a entero. Las tarifas siempre son pesos
     * enteros (sin centavos), así que tratamos tanto el punto como la coma como
     * separadores de miles y nos quedamos solo con los dígitos. Esto cubre los dos
     * formatos que muestran las apps: "$12.500" (es-CO) y "$12,500" (estilo US).
     *   "$12.500" → 12500   "COP 6,000" → 6000   "$1.234.567" → 1234567
     */
    static int pesosAEntero(@Nullable String raw) {
        if (raw == null) return 0;
        String digitos = raw.replaceAll("[^0-9]", "");
        if (digitos.isEmpty()) return 0;
        try {
            return Integer.parseInt(digitos);
        } catch (NumberFormatException e) {
            return 0; // número fuera de rango int (irreal para una tarifa)
        }
    }

    /** Convierte "4,5" o "4.5" a double (coma = separador decimal). */
    static double aDouble(@Nullable String raw) {
        if (raw == null) return 0;
        String normal = raw.replace(',', '.');
        try {
            return Double.parseDouble(normal);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
