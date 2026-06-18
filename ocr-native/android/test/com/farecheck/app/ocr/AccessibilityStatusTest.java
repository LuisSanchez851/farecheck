package com.farecheck.app.ocr;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Tests de la lógica de "¿está habilitado nuestro servicio de accesibilidad?".
 * JUnit puro: probamos el parseo de ENABLED_ACCESSIBILITY_SERVICES sin tocar Android.
 */
public class AccessibilityStatusTest {

    private static final String FLAT =
            "com.farecheck.app/com.farecheck.app.ocr.OfferReaderAccessibilityService";
    private static final String SHORT =
            "com.farecheck.app/.ocr.OfferReaderAccessibilityService";

    @Test
    public void enabled_cuandoNuestroServicioEstaEnLaLista() {
        String lista = "com.google.android.marvin.talkback/.TalkBackService:" + FLAT;
        assertTrue(AccessibilityStatus.isServiceListed(lista, FLAT, SHORT));
    }

    @Test
    public void enabled_reconoceElFormatoCorto() {
        assertTrue(AccessibilityStatus.isServiceListed(SHORT, FLAT, SHORT));
    }

    @Test
    public void enabled_esCaseInsensitive() {
        assertTrue(AccessibilityStatus.isServiceListed(FLAT.toLowerCase(), FLAT, SHORT));
    }

    @Test
    public void disabled_cuandoNoEstaEnLaLista() {
        String lista = "com.google.android.marvin.talkback/.TalkBackService:com.otra.app/.Servicio";
        assertFalse(AccessibilityStatus.isServiceListed(lista, FLAT, SHORT));
    }

    @Test
    public void disabled_cuandoListaVaciaOnull() {
        assertFalse(AccessibilityStatus.isServiceListed(null, FLAT, SHORT));
        assertFalse(AccessibilityStatus.isServiceListed("", FLAT, SHORT));
    }
}
