package com.farecheck.app.ocr;

/**
 * Apps de transporte soportadas. El orden y los nombres coinciden con el catálogo
 * `plataformas` sembrado en el backend (prisma/seed.ts). UNKNOWN representa cualquier
 * app que no analizamos.
 */
public enum Platform {
    DIDI,
    UBER,
    PICAP,
    YANGO,
    INDRIVE,
    TAXIS_LIBRES,
    UNKNOWN
}
