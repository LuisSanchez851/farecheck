package com.farecheck.app.ocr;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/** Mapeo package → Platform (debe coincidir con el catálogo del backend). */
public class PlatformDetectorTest {

    @Test
    public void identificaCadaAppPorSuPackage() {
        assertEquals(Platform.DIDI,         PlatformDetector.detect("com.didiglobal.passenger"));
        assertEquals(Platform.UBER,         PlatformDetector.detect("com.ubercab.driver"));
        assertEquals(Platform.PICAP,        PlatformDetector.detect("com.picap.android"));
        assertEquals(Platform.YANGO,        PlatformDetector.detect("ru.yandex.taximeter"));
        assertEquals(Platform.INDRIVE,      PlatformDetector.detect("sinet.startup.inDriver"));
        assertEquals(Platform.TAXIS_LIBRES, PlatformDetector.detect("com.taxislibres.driver"));
    }

    @Test
    public void appNoSoportadaOnullEsUnknown() {
        assertEquals(Platform.UNKNOWN, PlatformDetector.detect("com.whatsapp"));
        assertEquals(Platform.UNKNOWN, PlatformDetector.detect(null));
    }

    @Test
    public void isSupportedCoincideConDetect() {
        assertTrue(PlatformDetector.isSupported("com.didiglobal.passenger"));
        assertFalse(PlatformDetector.isSupported("com.instagram.android"));
    }
}
