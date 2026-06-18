package com.farecheck.app.ocr;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Tests unitarios del parser de ofertas. JUnit puro (sin Android), por lo que corren
 * rápido en `./gradlew testDebugUnitTest`.
 *
 * Para activarlos: el config plugin solo copia las fuentes de producción; copia este
 * archivo a android/app/src/test/java/com/farecheck/app/ocr/ (ver README).
 */
public class OfferParserTest {

    @Test
    public void extraeValorKmYTiempoDeUnaOfertaTipica() {
        OfferParser.ParsedOffer o = OfferParser.parse("Nuevo viaje\n$12.500\n4,3 km · 14 min\nRecoger a 1,2 km");
        assertEquals(12500, o.valorCop);
        assertEquals(4.3, o.kmRecorrido, 0.001);
        assertEquals(1.2, o.kmRecogida, 0.001); // la menor de las dos distancias
        assertEquals(14, o.tiempoTotalMin);
        assertTrue(o.isValid());
    }

    @Test
    public void manejaSeparadorDeMilesConPuntoYConComa() {
        assertEquals(12500, OfferParser.pesosAEntero("12.500"));
        assertEquals(6000, OfferParser.pesosAEntero("6,000"));
        assertEquals(15000, OfferParser.pesosAEntero("15,000"));
        assertEquals(1234567, OfferParser.pesosAEntero("1.234.567"));
    }

    @Test
    public void tomaElPrecioMayorCuandoHayVarios() {
        // El número grande es la tarifa; cifras pequeñas (p.ej. "$0" de promo) se ignoran.
        OfferParser.ParsedOffer o = OfferParser.parse("Tarifa base $2.000\nTotal $9.000\n3 km");
        assertEquals(9000, o.valorCop);
    }

    @Test
    public void convierteMetrosAKmCuandoNoHayValorEnKm() {
        OfferParser.ParsedOffer o = OfferParser.parse("$6.000\n850 m");
        assertEquals(0.85, o.kmRecorrido, 0.001);
    }

    @Test
    public void ofertaSinDatosUtilesNoEsValida() {
        assertFalse(OfferParser.parse("Buscando viajes cercanos…").isValid());
        assertFalse(OfferParser.parse("").isValid());
        assertFalse(OfferParser.parse(null).isValid());
    }

    @Test
    public void sinDistanciaNoEsValidaAunqueHayaPrecio() {
        // Sin km no se puede calcular COP/km, así que el backend no debe analizarla.
        assertFalse(OfferParser.parse("$10.000").isValid());
    }
}
