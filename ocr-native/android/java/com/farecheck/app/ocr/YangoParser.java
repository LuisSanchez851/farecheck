package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para Yango / Yango Pro (ru.yandex.taximeter).
 *
 * Yango muestra el punto de recogida ("Punto A") y el destino ("Punto B"):
 *   "Pedido
 *    $11.000
 *    Punto A · 2,0 km · 5 min
 *    Punto B · 7,4 km · 19 min"
 *
 * Etiquetas: "Punto A"/"Recogida" para recogida, "Punto B"/"Destino" para recorrido.
 */
final class YangoParser extends BasePlatformParser {

    static final YangoParser INSTANCE = new YangoParser();

    private static final Pattern RECOGIDA  = Pattern.compile("Punto A|Recogida|A bordo", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECORRIDO = Pattern.compile("Punto B|Destino|Recorrido", Pattern.CASE_INSENSITIVE);

    private YangoParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, RECOGIDA, RECORRIDO);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.YANGO;
    }
}
