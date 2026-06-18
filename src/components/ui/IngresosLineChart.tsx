import React from 'react';
import Svg, { Polyline, Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/colors';

export interface PuntoIngreso {
  dia: string;
  total_cop: number;
}

interface Props {
  data: PuntoIngreso[];
  width: number;
  height?: number;
}

// Gráfica de línea de ingresos por día sobre react-native-svg (sin dependencias
// nativas extra — svg ya viene en Expo Go). Escala automática al máximo del rango.
export default function IngresosLineChart({ data, width, height = 170 }: Props) {
  const n = data.length;
  if (n === 0 || width <= 0) return null;

  const padX = 10;
  const padTop = 16;
  const padBottom = 24; // espacio para las etiquetas de día
  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;
  const baseY = padTop + chartH;

  const max = Math.max(...data.map((d) => d.total_cop), 1);
  const xFor = (i: number) => (n === 1 ? padX + chartW / 2 : padX + (i * chartW) / (n - 1));
  const yFor = (v: number) => padTop + (1 - v / max) * chartH;

  const puntos = data.map((d, i) => ({ x: xFor(i), y: yFor(d.total_cop), dia: d.dia }));
  const polyline = puntos.map((p) => `${p.x},${p.y}`).join(' ');
  const area =
    `M${puntos[0].x},${baseY} ` +
    puntos.map((p) => `L${p.x},${p.y}`).join(' ') +
    ` L${puntos[n - 1].x},${baseY} Z`;

  return (
    <Svg width={width} height={height}>
      {/* Línea base */}
      <Line x1={padX} y1={baseY} x2={padX + chartW} y2={baseY} stroke={colors.border} strokeWidth={1} />

      {/* Área bajo la curva */}
      <Path d={area} fill={colors.cyanLight} />

      {/* Línea de ingresos */}
      <Polyline
        points={polyline}
        fill="none"
        stroke={colors.primary}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Puntos */}
      {puntos.map((p, i) => (
        <Circle key={`p${i}`} cx={p.x} cy={p.y} r={3.5} fill={colors.white} stroke={colors.primary} strokeWidth={2} />
      ))}

      {/* Etiquetas de día */}
      {puntos.map((p, i) => (
        <SvgText key={`t${i}`} x={p.x} y={height - 6} fontSize={10} fill={colors.textSecondary} textAnchor="middle">
          {p.dia}
        </SvgText>
      ))}
    </Svg>
  );
}
