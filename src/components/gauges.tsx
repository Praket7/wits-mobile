import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors } from '@/design/tokens';

export function DonutGauge({
  percent,
  size = 84,
  stroke = 10,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E5E9" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.success}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: size * 0.28, fontWeight: '700', color: colors.text }}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

export function ProgressBar({
  percent,
  color = colors.success,
  height = 8,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: '#E2E5E9', overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function CheckSquare({
  color,
  checked = true,
}: {
  color: string;
  checked?: boolean;
}) {
  return checked ? (
    <Svg width={20} height={20}>
      <Rect x={1} y={1} width={18} height={18} rx={4} fill={color} />
      <Rect x={5} y={9.5} width={3.5} height={3} fill="#FFFFFF" />
      <Rect x={7.5} y={11.5} width={3} height={3} fill="#FFFFFF" />
      <Rect x={9.5} y={7} width={3} height={7.5} fill="#FFFFFF" />
    </Svg>
  ) : (
    <Svg width={20} height={20}>
      <Rect x={1} y={1} width={18} height={18} rx={4} stroke="#C9CFD6" strokeWidth={2} fill="#FFFFFF" />
    </Svg>
  );
}

// Abstract building/school backdrop used behind Today + Course Detail heroes.
export function BuildingBackdrop({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect width={width} height={height} fill="#FFFFFF" />
      <Rect x={0} y={height * 0.62} width={width} height={height * 0.38} fill="#DCE4EA" />
      <Rect x={width * 0.1} y={height * 0.2} width={width * 0.2} height={height * 0.4} fill="#C6D2DA" opacity={0.85} />
      <Rect x={width * 0.12} y={height * 0.27} width={width * 0.16} height={height * 0.33} fill="#AEBFCA" opacity={0.7} />
      <Rect x={width * 0.38} y={height * 0.3} width={width * 0.16} height={height * 0.3} fill="#D3DDE4" />
      <Rect x={width * 0.62} y={height * 0.18} width={width * 0.26} height={height * 0.44} fill="#C6D2DA" opacity={0.8} />
      <Rect x={width * 0.66} y={height * 0.24} width={width * 0.08} height={height * 0.1} fill="#E8EEF2" />
      <Rect x={width * 0.78} y={height * 0.24} width={width * 0.08} height={height * 0.1} fill="#E8EEF2" />
    </Svg>
  );
}
