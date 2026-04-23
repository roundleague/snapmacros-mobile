import { useEffect, useRef } from 'react';
import { Animated, Modal, View, Text } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { triggerHaptic } from '../lib/feedback';

function getReinforcementText(type: 'food' | 'exercise'): string {
  const h = new Date().getHours();
  if (type === 'exercise') return 'Keep up the great work!';
  if (h < 10) return 'Breakfast logged!';
  if (h < 14) return 'Lunch logged!';
  if (h < 20) return 'Dinner logged!';
  return 'Snack logged!';
}

interface Props {
  visible: boolean;
  type: 'food' | 'exercise';
  primaryText: string;
  secondaryText?: string;
  onDone: () => void;
}

export default function SuccessOverlay({ visible, type, primaryText, secondaryText, onDone }: Props) {
  const scale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(14)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!visible) return;

    triggerHaptic();
    scale.setValue(0);
    checkOpacity.setValue(0);
    textY.setValue(14);
    textOpacity.setValue(0);

    Animated.spring(scale, { toValue: 1, tension: 180, friction: 12, useNativeDriver: true }).start();

    const c = setTimeout(() =>
      Animated.timing(checkOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start()
    , 150);

    const tx = setTimeout(() =>
      Animated.parallel([
        Animated.timing(textY, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start()
    , 300);

    const done = setTimeout(() => onDoneRef.current(), 1500);
    return () => { clearTimeout(c); clearTimeout(tx); clearTimeout(done); };
  }, [visible]);

  if (!visible) return null;

  const color = type === 'food' ? '#6366f1' : '#059669';
  const reinforcement = getReinforcementText(type);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.88)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Svg width={96} height={96} viewBox="0 0 96 96">
              <Circle cx={48} cy={48} r={44} fill={color} />
            </Svg>
          </Animated.View>
          <Animated.View style={{ position: 'absolute', opacity: checkOpacity }}>
            <Svg width={96} height={96} viewBox="0 0 96 96">
              <Polyline
                points="28,49 41,62 68,34"
                fill="none"
                stroke="white"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>

        <Animated.Text style={{
          color: 'white', fontSize: 30, fontWeight: '700', marginTop: 24,
          transform: [{ translateY: textY }], opacity: textOpacity,
        }}>
          {primaryText}
        </Animated.Text>
        {secondaryText && (
          <Animated.Text style={{
            color: '#94a3b8', fontSize: 15, fontWeight: '500', marginTop: 4,
            transform: [{ translateY: textY }], opacity: textOpacity,
          }}>
            {secondaryText}
          </Animated.Text>
        )}
        <Animated.Text style={{
          color: '#64748b', fontSize: 13, marginTop: 10,
          transform: [{ translateY: textY }], opacity: textOpacity,
        }}>
          {reinforcement}
        </Animated.Text>
      </View>
    </Modal>
  );
}

export function ShimmerLoader({ label, subLabel }: { label: string; subLabel?: string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>{label}</Text>
        {subLabel && <Text style={{ color: '#64748b', fontSize: 13 }}>{subLabel}</Text>}
      </View>
      <View style={{ width: '100%', gap: 10 }}>
        {[1, 0.85, 0.92].map((w, i) => (
          <Animated.View
            key={i}
            style={{
              height: 40, borderRadius: 12, backgroundColor: '#1e293b',
              width: `${w * 100}%`, opacity,
            }}
          />
        ))}
      </View>
    </View>
  );
}
