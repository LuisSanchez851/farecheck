package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para Uber Driver (com.ubercab.driver).
 *
 * Uber mezcla inglés/español y muestra la recogida ("Pickup") y el viaje ("Trip"):
 *   "Exclusive
 *    $15.000
 *    Pickup  3 min (1.5 km) away
 *    Trip    22 min (6.2 km)"
 *
 * Etiquetas: Pickup/Recogida para la recogida; Trip/Dropoff/Destino para el recorrido.
 */
final class UberParser extends BasePlatformParser {

    static final UberParser INSTANCE = new UberParser();

    private static final Pattern PICKUP = Pattern.compile("Pickup|Recogida", Pattern.CASE_INSENSITIVE);
    private static final Pattern TRIP   = Pattern.compile("Trip|Dropoff|Destino", Pattern.CASE_INSENSITIVE);

    private UberParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, PICKUP, TRIP);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.UBER;
    }
}
