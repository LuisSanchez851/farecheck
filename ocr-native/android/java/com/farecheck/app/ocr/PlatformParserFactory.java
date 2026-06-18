package com.farecheck.app.ocr;

import androidx.annotation.NonNull;

/**
 * Devuelve el {@link PlatformParser} adecuado para cada {@link Platform}.
 * Los parsers son singletons sin estado, así que se reutilizan. Para UNKNOWN (o
 * cualquier plataforma sin parser propio) devuelve el {@link GenericParser}.
 */
public final class PlatformParserFactory {

    private PlatformParserFactory() {}

    @NonNull
    public static PlatformParser forPlatform(@NonNull Platform platform) {
        switch (platform) {
            case DIDI:         return DiDiParser.INSTANCE;
            case UBER:         return UberParser.INSTANCE;
            case PICAP:        return PicapParser.INSTANCE;
            case YANGO:        return YangoParser.INSTANCE;
            case INDRIVE:      return InDriveParser.INSTANCE;
            case TAXIS_LIBRES: return TaxisLibresParser.INSTANCE;
            case UNKNOWN:
            default:           return GenericParser.INSTANCE;
        }
    }
}
