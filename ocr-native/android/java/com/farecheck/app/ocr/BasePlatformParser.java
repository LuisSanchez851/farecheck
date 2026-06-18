package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Base con toda la maquinaria de extracción reutilizable por los parsers concretos:
 * regex de precio/km/min, normalización de números y, sobre todo, extracción
 * GUIADA POR ETIQUETAS (p.ej. tomar los km que aparecen junto a "Recogida:").
 *
 * Estrategia: cada parser concreto aporta las etiquetas propias de su app; este base
 * intenta leer los valores junto a esas etiquetas y, si alguna falta, rellena con una
 * heurística genérica (mayor distancia = recorrido, menor = recogida). Así un cambio
 * de copy en la app degrada con gracia en vez de romper.
 */
abstract class BasePlatformParser implements PlatformParser {

    /** Valor monetario: "$9.000", "$ 12.500", "COP 9000", "$15,000". */
    protected static final Pattern PRECIO = Pattern.compile(
            "(?:\\$|COP)\\s*([0-9][0-9.,]*)", Pattern.CASE_INSENSITIVE);

    /** Distancia en km: "4 km", "4,5 km", "12.3 km". */
    protected static final Pattern KM = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*km", Pattern.CASE_INSENSITIVE);

    /** Distancia en metros: "850 m". */
    protected static final Pattern METROS = Pattern.compile(
            "([0-9]+(?:[.,][0-9]+)?)\\s*m\\b", Pattern.CASE_INSENSITIVE);

    /** Tiempo: "18 min", "8 minutos". */
    protected static final Pattern MIN = Pattern.compile(
            "([0-9]+)\\s*min", Pattern.CASE_INSENSITIVE);

    /** Cuántos caracteres tras una etiqueta miramos para encontrar su valor. */
    private static final int VENTANA_ETIQUETA = 40;

    /**
     * Parseo guiado por etiquetas. Los parsers concretos llaman a este método con sus
     * propias etiquetas de recogida y recorrido. tiempoLabel puede ser null (se usa la
     * heurística genérica de minutos).
     */
    @NonNull
    protected OfferParser.ParsedOffer parseConEtiquetas(
            @Nullable String text,
            @NonNull Pattern etiquetaRecogida,
            @NonNull Pattern etiquetaRecorrido) {

        if (text == null || text.isEmpty()) return OfferParser.EMPTY;

        final int valorCop = maxPrecio(text);

        // Distancias por etiqueta (−1 = no encontrada).
        double kmRecogida = kmAfterLabel(text, etiquetaRecogida);
        double kmRecorrido = kmAfterLabel(text, etiquetaRecorrido);

        // Relleno con heurística genérica si faltó alguna.
        if (kmRecorrido < 0 || kmRecogida < 0) {
            double[] gen = distanciasGenericas(allKm(text));
            if (kmRecorrido < 0) kmRecorrido = gen[0];
            if (kmRecogida < 0) kmRecogida = gen[1];
        }
        if (kmRecorrido < 0) kmRecorrido = 0;
        if (kmRecogida < 0) kmRecogida = 0;

        // Tiempos por etiqueta + relleno genérico.
        int tiempoRecogida = minAfterLabel(text, etiquetaRecogida);
        int tiempoTotal = minAfterLabel(text, etiquetaRecorrido);
        if (tiempoTotal < 0 || tiempoRecogida < 0) {
            int[] gen = tiemposGenericos(allMin(text));
            if (tiempoTotal < 0) tiempoTotal = gen[0];
            if (tiempoRecogida < 0) tiempoRecogida = gen[1];
        }
        if (tiempoTotal < 0) tiempoTotal = 0;
        if (tiempoRecogida < 0) tiempoRecogida = 0;

        return OfferParser.offer(valorCop, kmRecorrido, kmRecogida, tiempoTotal, tiempoRecogida);
    }

    // ── Extracción por etiqueta ────────────────────────────────────────────────

    /** km que aparecen dentro de la ventana posterior a la etiqueta, o −1 si no hay. */
    protected double kmAfterLabel(@NonNull String text, @NonNull Pattern etiqueta) {
        String sub = ventanaTrasEtiqueta(text, etiqueta);
        if (sub == null) return -1;
        Matcher km = KM.matcher(sub);
        if (km.find()) return OfferParser.aDouble(km.group(1));
        Matcher m = METROS.matcher(sub);
        if (m.find()) return OfferParser.aDouble(m.group(1)) / 1000.0;
        return -1;
    }

    /** minutos que aparecen tras la etiqueta, o −1 si no hay. */
    protected int minAfterLabel(@NonNull String text, @NonNull Pattern etiqueta) {
        String sub = ventanaTrasEtiqueta(text, etiqueta);
        if (sub == null) return -1;
        Matcher m = MIN.matcher(sub);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) { /* cae a −1 */ }
        }
        return -1;
    }

    @Nullable
    private String ventanaTrasEtiqueta(@NonNull String text, @NonNull Pattern etiqueta) {
        Matcher lm = etiqueta.matcher(text);
        if (!lm.find()) return null;
        int start = lm.end();
        int end = Math.min(text.length(), start + VENTANA_ETIQUETA);
        return text.substring(start, end);
    }

    // ── Helpers genéricos (compartidos) ─────────────────────────────────────────

    /** Mayor valor monetario del texto (la tarifa suele ser el número grande). */
    protected static int maxPrecio(@NonNull String text) {
        int max = 0;
        Matcher m = PRECIO.matcher(text);
        while (m.find()) {
            int v = OfferParser.pesosAEntero(m.group(1));
            if (v > max) max = v;
        }
        return max;
    }

    /** Todas las distancias en km (convierte metros→km solo si no hubo cifras en km). */
    protected static List<Double> allKm(@NonNull String text) {
        List<Double> out = new ArrayList<>();
        Matcher km = KM.matcher(text);
        while (km.find()) {
            double v = OfferParser.aDouble(km.group(1));
            if (v > 0) out.add(v);
        }
        if (out.isEmpty()) {
            Matcher m = METROS.matcher(text);
            while (m.find()) {
                double v = OfferParser.aDouble(m.group(1)) / 1000.0;
                if (v > 0) out.add(v);
            }
        }
        return out;
    }

    protected static List<Integer> allMin(@NonNull String text) {
        List<Integer> out = new ArrayList<>();
        Matcher m = MIN.matcher(text);
        while (m.find()) {
            try {
                out.add(Integer.parseInt(m.group(1)));
            } catch (NumberFormatException ignored) { /* salta */ }
        }
        return out;
    }

    /** [recorrido, recogida] = [mayor, menor] de la lista de km. */
    protected static double[] distanciasGenericas(@NonNull List<Double> kms) {
        if (kms.isEmpty()) return new double[]{0, 0};
        if (kms.size() == 1) return new double[]{kms.get(0), 0};
        double max = kms.get(0), min = kms.get(0);
        for (double k : kms) {
            if (k > max) max = k;
            if (k < min) min = k;
        }
        return new double[]{max, min};
    }

    /** [total, recogida] = [mayor, menor] de la lista de minutos. */
    protected static int[] tiemposGenericos(@NonNull List<Integer> mins) {
        if (mins.isEmpty()) return new int[]{0, 0};
        if (mins.size() == 1) return new int[]{mins.get(0), 0};
        int max = mins.get(0), min = mins.get(0);
        for (int t : mins) {
            if (t > max) max = t;
            if (t < min) min = t;
        }
        return new int[]{max, min};
    }
}
