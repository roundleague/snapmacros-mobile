import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 72 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="logo-p" x1="512" y1="152" x2="850" y2="635" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#a5b4fc"/>
          <Stop offset="1" stopColor="#4338ca"/>
        </LinearGradient>
        <LinearGradient id="logo-c" x1="824" y1="692" x2="236" y2="743" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#fde68a"/>
          <Stop offset="1" stopColor="#d97706"/>
        </LinearGradient>
        <LinearGradient id="logo-f" x1="200" y1="692" x2="450" y2="158" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#6ee7b7"/>
          <Stop offset="1" stopColor="#059669"/>
        </LinearGradient>
        <LinearGradient id="logo-s" x1="512" y1="362" x2="512" y2="662" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#ffffff"/>
          <Stop offset="1" stopColor="#dde4ff"/>
        </LinearGradient>
      </Defs>

      <Path d="M 512,152 A 360,360 0 0 1 850,635"
            stroke="url(#logo-p)" strokeWidth="76" strokeLinecap="round" fill="none"/>
      <Path d="M 824,692 A 360,360 0 0 1 236,743"
            stroke="url(#logo-c)" strokeWidth="76" strokeLinecap="round" fill="none"/>
      <Path d="M 200,692 A 360,360 0 0 1 450,158"
            stroke="url(#logo-f)" strokeWidth="76" strokeLinecap="round" fill="none"/>

      <Path d="M 512,362 L 537,487 L 662,512 L 537,537 L 512,662 L 487,537 L 362,512 L 487,487 Z"
            fill="url(#logo-s)"/>
      <Circle cx="512" cy="512" r="18" fill="#6366f1"/>
    </Svg>
  );
}
