package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para Picap (com.picap.android) — domicilios y moto-taxi.
 *
 * Picap suele mostrar una sola distancia (el servicio) y a veces la de recogida:
 *   "Nuevo servicio
 *    $6.000
 *    Recoger en: Cra 7 · 0,8 km
 *    Destino: 3,5 km"
 *
 * Etiquetas: "Recoger" para recogida, "Destino"/"Recorrido" para el recorrido. Si solo
 * hay una distancia, el base la asigna al recorrido (la relevante para COP/km).
 */
final class PicapParser extends BasePlatformParser {

    static final PicapParser INSTANCE = new PicapParser();

    private static final Pattern RECOGIDA  = Pattern.compile("Recoger|Recogida", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECORRIDO = Pattern.compile("Destino|Recorrido", Pattern.CASE_INSENSITIVE);

    private PicapParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, RECOGIDA, RECORRIDO);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.PICAP;
    }
}
