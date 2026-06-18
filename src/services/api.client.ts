import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';

import { auth } from './firebase';
import { useAuthStore } from '../store/auth.store';
import type {
  RegistroBody,
  LoginBody,
  CrearConductorBody,
  CrearConductorResponse,
  UpdatePerfilBody,
  UpdateUmbralesBody,
  AnalisisBody,
  RegistroResponse,
  LoginResponse,
  Conductor,
  UmbralesResponse,
  AnalisisResponse,
  AnalisisDecisionResponse,
  Decision,
  Turno,
  Viaje,
  TurnoActivoResponse,
  TurnoResumenResponse,
  BalanceDiaResponse,
  BalanceSemanaResponse,
  ViajesHistorialResponse,
  ViajesEstadoFiltro,
} from '../types/api.types';

// Android emulator no puede acceder a localhost del host — usa 10.0.2.2
const getBaseUrl = (): string => {
  // EXPO_PUBLIC_API_BASE_URL es el nombre canónico; se mantiene el fallback al antiguo.
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api/v1'
    : 'http://localhost:3000/api/v1';
};

// ── Error tipado ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Cliente Axios ─────────────────────────────────────────────────────────────

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// UID del conductor de desarrollo (debe coincidir con el sembrado en el backend y
// con el conductor inyectado en AppNavigator). Solo se usa cuando no hay sesión
// Firebase real (auth bypasseado en desarrollo).
const DEV_AUTH_UID = process.env.EXPO_PUBLIC_DEV_AUTH_UID ?? 'smoke-conductor-a';

// Adjunta JWT de Firebase antes de cada request.
// En desarrollo sin sesión Firebase, envía el UID de dev como Bearer (el backend
// con AUTH_DEV_BYPASS=true lo acepta como firebase_uid).
apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  } else if (__DEV__ && DEV_AUTH_UID) {
    config.headers.Authorization = `Bearer ${DEV_AUTH_UID}`;
  }
  return config;
});

// Manejo de errores: reintento en token_expirado, logout en conductor_no_encontrado
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;

    const status = error.response?.status ?? 0;
    const code: string = error.response?.data?.error ?? 'error_desconocido';
    const message: string = error.response?.data?.message ?? error.message;
    const config = error.config as RetryableConfig | undefined;

    // 401 token_expirado — refrescar y reintentar UNA vez
    if (status === 401 && code === 'token_expirado' && config && !config._retry) {
      config._retry = true;
      const user = auth.currentUser;
      if (user) {
        const freshToken = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${freshToken}`;
        return apiClient(config);
      }
    }

    // 401 conductor no registrado — limpiar sesión local
    if (status === 401 && code === 'conductor_no_encontrado') {
      useAuthStore.getState().reset();
    }

    // 402 suscripción vencida — marcar para mostrar paywall
    if (status === 402) {
      useAuthStore.getState().setSubscriptionExpired(true);
    }

    throw new ApiError(code, message, status);
  },
);

// ── authClient ────────────────────────────────────────────────────────────────

export const authClient = {
  registro: (body: RegistroBody) =>
    apiClient.post<RegistroResponse>('/auth/registro', body),

  login: (body: LoginBody) =>
    apiClient.post<LoginResponse>('/auth/login', body),
};

// ── conductorClient ───────────────────────────────────────────────────────────

export const conductorClient = {
  // Registro de un conductor nuevo (público). El backend deriva el uid del token.
  crear: (body: CrearConductorBody) =>
    apiClient.post<CrearConductorResponse>('/conductor/crear', body),

  // El backend devuelve el Conductor directamente (no envuelto en { conductor })
  getPerfil: () =>
    apiClient.get<Conductor>('/conductor/perfil'),

  updatePerfil: (body: UpdatePerfilBody) =>
    apiClient.put<Conductor>('/conductor/perfil', body),

  updateUmbrales: (verde: number, amarillo: number) =>
    apiClient.put<UmbralesResponse>('/conductor/umbrales', {
      umbral_verde_copkm: verde,
      umbral_amarillo_copkm: amarillo,
    } satisfies UpdateUmbralesBody),
};

// ── turnosClient (Sprint 2) ───────────────────────────────────────────────────

export const turnosClient = {
  // El backend no requiere plataforma — el turno es agnóstico a la app
  iniciar: () =>
    apiClient.post<Turno>('/turnos/iniciar'),

  pausar: (turno_id: string) =>
    apiClient.put<Turno>(`/turnos/${turno_id}/pausar`),

  reanudar: (turno_id: string) =>
    apiClient.put<Turno>(`/turnos/${turno_id}/reanudar`),

  finalizar: (turno_id: string) =>
    apiClient.put<Turno>(`/turnos/${turno_id}/finalizar`),

  getActivo: () =>
    apiClient.get<TurnoActivoResponse>('/turnos/activo'),

  getById: (turno_id: string) =>
    apiClient.get<TurnoResumenResponse>(`/turnos/${turno_id}`),
};

// ── analisisClient (Sprint 3 — OCR) ──────────────────────────────────────────

export const analisisClient = {
  analizar: (body: AnalisisBody) =>
    apiClient.post<AnalisisResponse>('/analisis', body),

  marcarDecision: (viaje_id: string, decision: Decision) =>
    apiClient.patch<AnalisisDecisionResponse>(`/analisis/${viaje_id}/decision`, { decision }),
};

// ── viajesClient (Sprint 2) ───────────────────────────────────────────────────

export const viajesClient = {
  getHistorial: (params?: { page?: number; limit?: number; estado?: ViajesEstadoFiltro }) =>
    apiClient.get<ViajesHistorialResponse>('/viajes', { params }),

  getById: (viaje_id: string) =>
    apiClient.get<Viaje>(`/viajes/${viaje_id}`),
};

// ── balanceClient (Sprint 2) ──────────────────────────────────────────────────

export const balanceClient = {
  getDia: () => apiClient.get<BalanceDiaResponse>('/balance/dia'),
  getSemana: () => apiClient.get<BalanceSemanaResponse>('/balance/semana'),
};

// ── suscripcionClient (Sprint 4) ──────────────────────────────────────────────

export const suscripcionClient = {
  getEstado: () =>
    apiClient.get('/suscripcion/estado'),

  checkout: (plan: 'MENSUAL' | 'ANUAL') =>
    apiClient.post('/suscripcion/checkout', { plan }),

  cancelar: () =>
    apiClient.delete('/suscripcion'),
};
