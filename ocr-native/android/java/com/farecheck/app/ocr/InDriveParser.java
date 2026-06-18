package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.util.regex.Pattern;

/**
 * Parser para InDrive (sinet.startup.inDriver).
 *
 * Particularidad: el PASAJERO propone la tarifa, así que el valor aparece destacado
 * ("Por $9.000" / "Oferta $9.000"). El maxPrecio del base ya captura ese "$".
 *   "Oferta de viaje
 *    Por $9.000
 *    Recogida a 1,5 km
 *    Destino a 5,0 km · 16 min"
 *
 * Etiquetas: "Recogida"/"Recoger" y "Destino"/"Recorrido".
 */
final class InDriveParser extends BasePlatformParser {

    static final InDriveParser INSTANCE = new InDriveParser();

    // No usar "Viaje": el encabezado "Oferta de viaje" capturaría la distancia errónea.
    private static final Pattern RECOGIDA  = Pattern.compile("Recogida|Recoger", Pattern.CASE_INSENSITIVE);
    private static final Pattern RECORRIDO = Pattern.compile("Destino|Recorrido", Pattern.CASE_INSENSITIVE);

    private InDriveParser() {}

    @NonNull
    @Override
    public OfferParser.ParsedOffer parse(@Nullable String text) {
        return parseConEtiquetas(text, RECOGIDA, RECORRIDO);
    }

    @NonNull
    @Override
    public Platform platform() {
        return Platform.INDRIVE;
    }
}
