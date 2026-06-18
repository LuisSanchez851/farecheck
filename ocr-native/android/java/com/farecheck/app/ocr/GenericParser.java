package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Parser sin etiquetas: pura heurística (mayor distancia = recorrido, menor = recogida).
 * Es el fallback cuando la plataforma es UNKNOWN o cuando un parser específico no
 * reconoce el formato. Equivale al comportamiento original de OfferParser en S3-01.
 */
final class GenericParser extends BasePlatformParser {

    static final GenericParser INSTANCE = new GenericParser();

    private GenericParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        if (text == null || text.isEmpty()) return OfferParser.EMPTY;

        int valorCop = maxPrecio(text);
        double[] km = distanciasGenericas(allKm(text));
        int[] min = tiemposGenericos(allMin(text));

        return OfferParser.offer(valorCop, km[0], km[1], min[0], min[1]);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.UNKNOWN;
    }
}
