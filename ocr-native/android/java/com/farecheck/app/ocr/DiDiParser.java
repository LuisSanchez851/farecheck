package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para DiDi (com.didiglobal.passenger).
 *
 * Formato típico de la tarjeta de oferta (es-CO):
 *   "Nuevo viaje
 *    $12.500
 *    Recogida: 1,2 km · 4 min
 *    Recorrido: 4,3 km · 14 min"
 *
 * DiDi etiqueta explícitamente "Recogida" y "Recorrido", así que leemos los km/min
 * junto a cada etiqueta. Si cambia el copy, el base cae a la heurística genérica.
 */
final class DiDiParser extends BasePlatformParser {

    static final DiDiParser INSTANCE = new DiDiParser();

    // OJO: no usar "Viaje" como etiqueta — el encabezado suele decir "Nuevo viaje" y
    // capturaría la distancia equivocada. DiDi etiqueta el tramo como "Recorrido".
    private static final Pattern RECOGIDA  = Pattern.compile("Recogida", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECORRIDO = Pattern.compile("Recorrido", Pattern.CASE_INSENSITIVE);

    private DiDiParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, RECOGIDA, RECORRIDO);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.DIDI;
    }
}
