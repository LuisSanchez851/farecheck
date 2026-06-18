package com.farecheck.app.ocr;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

/** Mapeo semáforo → color de marca + mensaje del overlay (S3-03). JUnit puro. */
public class SemaforoVisualTest {

    @Test
    public void colorPorSemaforoUsaLosHexDeMarca() {
        assertEquals(0xFF1DB87A, SemaforoVisual.colorForName("VERDE"));
        assertEquals(0xFFF5A623, SemaforoVisual.colorForName("AMARILLO"));
        assertEquals(0xFFE53935, SemaforoVisual.colorForName("ROJO"));
    }

    @Test
    public void colorEsCaseInsensitiveYNavyPorDefecto() {
        assertEquals(0xFF1DB87A, SemaforoVisual.colorForName("verde"));
        assertEquals(0xFF1A2B5E, SemaforoVisual.colorForName("OTRO"));
        assertEquals(0xFF1A2B5E, SemaforoVisual.colorForName(null));
    }

    @Test
    public void mensajePorDefectoPorSemaforo() {
        assertEquals("Buen servicio", SemaforoVisual.defaultMessage("VERDE"));
        assertEquals("Servicio regular", SemaforoVisual.defaultMessage("AMARILLO"));
        assertEquals("No rentable", SemaforoVisual.defaultMessage("ROJO"));
    }

    @Test
    public void tituloEsLaPalabraDelSemaforo() {
        assertEquals("VERDE", SemaforoVisual.titleForName("verde"));
        assertEquals("—", SemaforoVisual.titleForName("desconocido"));
    }
}
