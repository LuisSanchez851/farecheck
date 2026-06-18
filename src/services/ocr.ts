import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

import { analisisClient } from './api.client';
import type { AnalisisBody, AnalisisResponse, AnalisisDecisionResponse, Decision } from '../types/api.types';

// Módulo nativo expuesto por OcrBridgeModule.java. Solo existe en Android dentro de un
// development build / build de producción (NO en Expo Go), de ahí los guards.
const FareCheckOcr = NativeModules.FareCheckOcr as
  | {
      checkAccessibilityEnabled: () => Promise<boolean>;
      openAccessibilitySettings: () => void;
      canDrawOverlays: () => Promise<boolean>;
      openOverlaySettings: () => void;
      showOverlay: (semaforo: string, mensaje: string, viajeId: string) => void;
      hideOverlay: () => void;
    }
  | undefined;

const EVENT_OFFER_DETECTED = 'onOfferDetected';
const EVENT_OVERLAY_DECISION = 'onOverlayDecision';

/** Oferta detectada por el OCR (payload emitido desde OcrBridgeModule.emitOffer). */
export interface DetectedOffer {
  package_android: string;
  valor_cop: number;
  km_recorrido: number;
  km_recogida: number;
  tiempo_total_min: number;
  tiempo_recogida_min: number;
}

export interface OcrSubscription {
  remove: () => void;
}

interface StartOptions {
  /** Turno activo al que se asocian los viajes analizados. */
  turnoId: string;
  /** Mapea el package de la app (com.didiglobal.passenger…) al id de plataforma en BD. */
  resolvePlataformaId: (packageAndroid: string) => string | undefined;
  /** Resultado del backend (semáforo) para una oferta. */
  onResult?: (offer: DetectedOffer, analisis: AnalisisResponse) => void;
  /** Error al analizar (red, validación, etc.). */
  onError?: (offer: DetectedOffer, error: unknown) => void;
  /** Decisión del conductor desde el overlay, ya registrada en el backend. */
  onDecisionRecorded?: (result: AnalisisDecisionResponse) => void;
  /**
   * Mostrar automáticamente el overlay flotante con el semáforo al recibir el análisis.
   * Por defecto true. Requiere permiso SYSTEM_ALERT_WINDOW (ver canDrawOverlays).
   */
  showOverlay?: boolean;
}

/** ¿El módulo nativo OCR está disponible en este binario? */
export function isOcrAvailable(): boolean {
  return Platform.OS === 'android' && !!FareCheckOcr;
}

/** ¿El usuario habilitó el servicio de accesibilidad de FareCheck? */
export async function isAccessibilityEnabled(): Promise<boolean> {
  if (!FareCheckOcr) return false;
  return FareCheckOcr.checkAccessibilityEnabled();
}

/** Abre Ajustes → Accesibilidad para que el usuario active el servicio. */
export function openAccessibilitySettings(): void {
  FareCheckOcr?.openAccessibilitySettings();
}

/** ¿Tenemos permiso para dibujar el overlay sobre otras apps (SYSTEM_ALERT_WINDOW)? */
export async function canDrawOverlays(): Promise<boolean> {
  if (!FareCheckOcr) return false;
  return FareCheckOcr.canDrawOverlays();
}

/** Abre Ajustes → "Mostrar sobre otras apps" para conceder el permiso del overlay. */
export function openOverlaySettings(): void {
  FareCheckOcr?.openOverlaySettings();
}

/** Muestra el overlay flotante del semáforo manualmente. */
export function showOverlay(semaforo: string, mensaje: string, viajeId: string): void {
  FareCheckOcr?.showOverlay(semaforo, mensaje, viajeId);
}

/** Oculta el overlay flotante. */
export function hideOverlay(): void {
  FareCheckOcr?.hideOverlay();
}

/**
 * Empieza a escuchar ofertas detectadas por el OCR. Por cada oferta válida llama a
 * POST /api/v1/analisis y entrega el semáforo resultante por `onResult`.
 *
 * Pipeline: AccessibilityService → OfferParser → evento nativo → ESTA función →
 * analisisClient.analizar() → backend (semaforo.service) → VERDE/AMARILLO/ROJO.
 *
 * Devuelve una suscripción; llamar `.remove()` al desmontar / finalizar el turno.
 */
export function startOcrAnalysis(opts: StartOptions): OcrSubscription {
  if (!FareCheckOcr) {
    return { remove: () => {} };
  }

  const emitter = new NativeEventEmitter(FareCheckOcr as unknown as never);
  const mostrarOverlay = opts.showOverlay !== false;

  const offerSub = emitter.addListener(EVENT_OFFER_DETECTED, async (offer: DetectedOffer) => {
    const plataforma_id = opts.resolvePlataformaId(offer.package_android);
    if (!plataforma_id) return; // app no soportada o catálogo aún no cargado

    const body: AnalisisBody = {
      valor_cop: offer.valor_cop,
      km_recorrido: offer.km_recorrido,
      tiempo_recogida_min: offer.tiempo_recogida_min,
      tiempo_total_min: offer.tiempo_total_min,
      plataforma_id,
      turno_id: opts.turnoId,
    };

    try {
      const { data } = await analisisClient.analizar(body);
      opts.onResult?.(offer, data);
      // Muestra el chip del semáforo sobre la app de transporte.
      if (mostrarOverlay) FareCheckOcr!.showOverlay(data.semaforo, data.mensaje, data.viaje_id);
    } catch (error) {
      opts.onError?.(offer, error);
    }
  });

  // El conductor toca Aceptar/Rechazar en el overlay → registramos la decisión.
  const decisionSub = emitter.addListener(
    EVENT_OVERLAY_DECISION,
    async (e: { viaje_id: string; decision: Decision }) => {
      try {
        const result = await recordDecision(e.viaje_id, e.decision);
        opts.onDecisionRecorded?.(result);
      } catch {
        /* el overlay ya se cerró en nativo; el reintento queda a cargo del caller */
      }
    },
  );

  return {
    remove: () => {
      offerSub.remove();
      decisionSub.remove();
    },
  };
}

/**
 * Registra la decisión del conductor sobre una oferta analizada (aceptada/rechazada).
 * Llama a PATCH /api/v1/analisis/:viaje_id/decision y devuelve la confirmación.
 */
export async function recordDecision(
  viajeId: string,
  decision: Decision,
): Promise<AnalisisDecisionResponse> {
  const { data } = await analisisClient.marcarDecision(viajeId, decision);
  return data;
}
