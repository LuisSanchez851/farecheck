// Formato monetario colombiano: $255.647 (separador de miles con punto, sin decimales).
// Implementado a mano para no depender de Intl (Hermes lo soporta parcialmente).
export function formatCOP(value: number): string {
  const n = Math.round(value);
  const sep = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '-' : ''}$${sep}`;
}

// Minutos → "H:MM" (ej. 135 → "2:15")
export function formatDuracion(totalMin: number): string {
  const min = Math.max(0, Math.round(totalMin));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// ISO → hora local "h:mm a. m./p. m." (ej. "2:05 p. m.")
export function formatHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  const h12 = h % 12 || 12;
  const meridiano = h < 12 ? 'a. m.' : 'p. m.';
  return `${h12}:${String(m).padStart(2, '0')} ${meridiano}`;
}

// Distancia → "12,4 km" (un decimal, coma decimal colombiana)
export function formatKm(km: number): string {
  return `${km.toFixed(1).replace('.', ',')} km`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// ISO → "17 jun 2026"
export function formatFecha(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

// Segundos → cronómetro "HH:MM:SS" (para el timer del turno activo)
export function formatCronometro(totalSeg: number): string {
  const s = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return [h, m, seg].map((n) => String(n).padStart(2, '0')).join(':');
}
