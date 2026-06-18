// Tipos compartidos frontend ↔ backend
// Sincronizados con farecheck-api/src/types/api.types.ts

// ── Enums ────────────────────────────────────────────────────────────────────

export type Plan = 'TRIAL' | 'MENSUAL' | 'ANUAL';
export type EstadoSuscripcion = 'ACTIVA' | 'EXPIRADA' | 'CANCELADA';
export type EstadoTurno = 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
export type Semaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

// ── Modelos ─────────────────────────────────────────────────────────────────

export interface Conductor {
  id: string;
  firebase_uid: string;
  auth_provider: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  placa_vehiculo: string | null;
  marca_vehiculo: string | null;
  modelo_vehiculo: string | null;
  foto_url: string | null;
  umbral_verde_copkm: number;
  umbral_amarillo_copkm: number;
  creado_en: string;
  actualizado_en: string;
}

export interface Suscripcion {
  id: string;
  conductor_id: string;
  plan: Plan;
  estado: EstadoSuscripcion;
  inicio: string;
  fin: string;
}

export interface Turno {
  id: string;
  conductor_id: string;
  estado: EstadoTurno;
  inicio: string;
  fin: string | null;
  total_viajes: number;
  viajes_aceptados: number;
  viajes_rechazados: number;
  ingreso_total_cop: number;
  km_totales: number;
  tiempo_activo_min: number;
  tiempo_pausa_min: number;
  creado_en: string;
  actualizado_en: string;
}

export interface Plataforma {
  id: string;
  nombre: string;
  icono_url: string | null;
}

export interface Viaje {
  id: string;
  turno_id: string;
  plataforma_id: string;
  registrado_en: string;
  valor_cop: number;
  km_recogida: number;
  km_recorrido: number;
  tiempo_recogida_min: number;
  tiempo_total_min: number;
  calificacion_pasajero: number | null;
  viajes_pasajero: number | null;
  km_total: number;
  valor_copkm: number;
  semaforo: Semaforo;
  porcentaje_vs_umbral: number;
  aceptado: boolean | null;
  // Incluida por GET /viajes y GET /turnos/activo
  plataforma?: Plataforma;
  // Incluido por GET /viajes/:id
  turno?: { id: string; estado: EstadoTurno };
}

// ── Request bodies ───────────────────────────────────────────────────────────

export interface RegistroBody {
  firebase_token: string;
  nombre: string;
  email?: string;
  telefono?: string;
  placa_vehiculo?: string;
  marca_vehiculo?: string;
  modelo_vehiculo?: string;
}

export interface LoginBody {
  firebase_token: string;
}

export interface UpdatePerfilBody {
  nombre?: string;
  foto_url?: string;
  placa_vehiculo?: string;
  marca_vehiculo?: string;
  modelo_vehiculo?: string;
}

export interface UpdateUmbralesBody {
  umbral_verde_copkm: number;
  umbral_amarillo_copkm: number;
}

export interface AnalisisBody {
  valor_cop: number;
  km_recorrido: number;
  tiempo_recogida_min: number;
  tiempo_total_min: number;
  plataforma_id: string;
  turno_id: string;
}

// ── API responses ────────────────────────────────────────────────────────────

export interface RegistroResponse {
  conductor: Conductor;
  ya_existia?: boolean;
}

export interface LoginResponse {
  conductor: Conductor;
  suscripcion: Suscripcion | null;
}

export interface ConductorResponse {
  conductor: Conductor;
}

// PUT /conductor/umbrales devuelve solo los campos actualizados
export interface UmbralesResponse {
  id: string;
  umbral_verde_copkm: number;
  umbral_amarillo_copkm: number;
}

export interface AnalisisResponse {
  viaje_id: string;
  semaforo: Semaforo;
  valor_copkm: number;
  porcentaje_vs_umbral: number;
  mensaje: string;
}

export type Decision = 'aceptado' | 'rechazado';

// PATCH /analisis/:viaje_id/decision
export interface AnalisisDecisionResponse {
  viaje_id: string;
  decision: Decision;
  semaforo_al_momento: Semaforo;
  mensaje: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

// ── Sprint 2: Turnos / Balance / Viajes ──────────────────────────────────────

// GET /turnos/activo → turno abierto con totales en vivo y sus últimos viajes, o null.
// pausa_actual_inicio: inicio de la pausa abierta (solo si estado === PAUSADO).
export type TurnoActivoResponse =
  | (Turno & { viajes: Viaje[]; pausa_actual_inicio: string | null })
  | null;

// GET /turnos/:id → turno (normalmente finalizado) con todos sus viajes
export type TurnoResumenResponse = Turno & { viajes: Viaje[] };

// GET /balance/dia
export interface BalanceDiaResponse {
  fecha: string;
  total_cop: number;
  viajes: number;
  km_total: number;
  tiempo_total_min: number;
  comparativa_ayer_pct: number;
}

// GET /balance/semana
export interface BalanceSemanaDia {
  fecha: string;
  dia: string;
  total_cop: number;
  viajes: number;
  km_total: number;
  tiempo_total_min: number;
}

export interface BalanceSemanaResponse {
  desde: string;
  hasta: string;
  total_cop: number;
  viajes: number;
  km_total: number;
  tiempo_total_min: number;
  dias: BalanceSemanaDia[];
}

// GET /viajes?page=&limit=&estado=
export type ViajesEstadoFiltro = 'todos' | 'aceptados' | 'rechazados';

export interface ViajesHistorialResponse {
  viajes: Viaje[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}
