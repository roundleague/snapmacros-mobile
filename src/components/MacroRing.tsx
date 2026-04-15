import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
  size?: number;
  strokeWidth?: number;
}

export default function MacroRing({
  value, max, color, label, unit, size = 120, strokeWidth = 10,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke="#1e293b" strokeWidth={strokeWidth} fill="none"
        />
        {/* Progress */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: 'white', fontWeight: '800', fontSize: size * 0.18 }}>
          {Math.round(value)}
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: size * 0.1 }}>{unit}</Text>
      </View>
    </View>
  );
}
