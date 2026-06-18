package com.farecheck.app.ocr;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Contrato de un parser de ofertas. Cada plataforma (DiDi, Uber, …) implementa esta
 * interfaz extendiendo {@link BasePlatformParser}, que ya trae los helpers de regex.
 *
 * parse(text) → ParsedOffer (nunca null; usar isValid()).
 */
public interface PlatformParser {

    @NonNull
    OfferParser.ParsedOffer parse(@Nullable String screenText);

    /** Plataforma que maneja este parser. */
    @NonNull
    Platform platform();
}
