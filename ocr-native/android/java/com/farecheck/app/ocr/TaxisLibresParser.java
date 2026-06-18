package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para Taxis Libres (com.taxislibres.driver).
 *
 * App de taxi tradicional; las carreras muestran origen y destino:
 *   "Servicio asignado
 *    $8.500
 *    Recogida: Calle 100 · 1,0 km
 *    Destino: Calle 26 · 6,8 km"
 *
 * Etiquetas: "Recogida"/"Recoger" y "Destino"/"Recorrido".
 */
final class TaxisLibresParser extends BasePlatformParser {

    static final TaxisLibresParser INSTANCE = new TaxisLibresParser();

    private static final Pattern RECOGIDA  = Pattern.compile("Recogida|Recoger", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECORRIDO = Pattern.compile("Destino|Recorrido", Pattern.CASE_INSENSITIVE);

    private TaxisLibresParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, RECOGIDA, RECORRIDO);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.TAXIS_LIBRES;
    }
}
