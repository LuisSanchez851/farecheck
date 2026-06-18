package com.farecheck.app.ocr;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

/**
 * Tests de los parsers por plataforma con texto realista de cada app. JUnit puro.
 * Verifican los campos que el backend necesita: valor (COP) y distancia del recorrido
 * (para COP/km) + la distancia de recogida cuando la app la etiqueta.
 *
 * Para activarlos: copiar a android/app/src/test/java/com/farecheck/app/ocr/ (ver README).
 */
public class PlatformParserTest {

    private static final double EPS = 0.001;

    @Test
    public void didi_etiquetasRecogidaYRecorrido() {
        String text = "Nuevo viaje\n$12.500\nRecogida: 1,2 km · 4 min\nRecorrido: 4,3 km · 14 min";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.DIDI, text);
        assertEquals(12500, o.valorCop);
        assertEquals(4.3, o.kmRecorrido, EPS);
        assertEquals(1.2, o.kmRecogida, EPS);
        assertEquals(14, o.tiempoTotalMin);
        assertEquals(4, o.tiempoRecogidaMin);
        assertTrue(o.isValid());
    }

    @Test
    public void uber_pickupYTripEnIngles() {
        String text = "Exclusive\n$15.000\nPickup 3 min (1.5 km) away\nTrip 22 min (6.2 km)";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.UBER, text);
        assertEquals(15000, o.valorCop);
        assertEquals(6.2, o.kmRecorrido, EPS);
        assertEquals(1.5, o.kmRecogida, EPS);
        assertEquals(22, o.tiempoTotalMin);
    }

    @Test
    public void picap_unaSolaDistancia() {
        String text = "Nuevo servicio\n$6.000\nDestino: 3,5 km";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.PICAP, text);
        assertEquals(6000, o.valorCop);
        assertEquals(3.5, o.kmRecorrido, EPS);
        assertEquals(0.0, o.kmRecogida, EPS); // no hay etiqueta de recogida
        assertTrue(o.isValid());
    }

    @Test
    public void yango_puntoAYPuntoB() {
        String text = "Pedido\n$11.000\nPunto A · 2,0 km · 5 min\nPunto B · 7,4 km · 19 min";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.YANGO, text);
        assertEquals(11000, o.valorCop);
        assertEquals(7.4, o.kmRecorrido, EPS);
        assertEquals(2.0, o.kmRecogida, EPS);
        assertEquals(19, o.tiempoTotalMin);
    }

    @Test
    public void indrive_tarifaPropuestaPorElPasajero() {
        String text = "Oferta de viaje\nPor $9.000\nRecogida a 1,5 km\nDestino a 5,0 km · 16 min";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.INDRIVE, text);
        assertEquals(9000, o.valorCop);
        assertEquals(5.0, o.kmRecorrido, EPS);
        assertEquals(1.5, o.kmRecogida, EPS);
    }

    @Test
    public void taxisLibres_origenYDestino() {
        String text = "Servicio asignado\n$8.500\nRecogida: Calle 100 · 1,0 km\nDestino: Calle 26 · 6,8 km";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.TAXIS_LIBRES, text);
        assertEquals(8500, o.valorCop);
        assertEquals(6.8, o.kmRecorrido, EPS);
        assertEquals(1.0, o.kmRecogida, EPS);
    }

    @Test
    public void plataformaUnknownUsaParserGenerico() {
        // Sin etiquetas: mayor distancia = recorrido, menor = recogida.
        String text = "$10.000\n2 km\n8 km";
        OfferParser.ParsedOffer o = OfferParser.parse(Platform.UNKNOWN, text);
        assertEquals(10000, o.valorCop);
        assertEquals(8.0, o.kmRecorrido, EPS);
        assertEquals(2.0, o.kmRecogida, EPS);
    }

    @Test
    public void factoryDevuelveElParserCorrecto() {
        assertEquals(Platform.DIDI,    PlatformParserFactory.forPlatform(Platform.DIDI).platform());
        assertEquals(Platform.UBER,    PlatformParserFactory.forPlatform(Platform.UBER).platform());
        assertEquals(Platform.UNKNOWN, PlatformParserFactory.forPlatform(Platform.UNKNOWN).platform());
    }
}
