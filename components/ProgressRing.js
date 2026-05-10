import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function ProgressRing({
  percent = 66,
  size = 80,
  strokeWidth = 8,
  color = '#2563EB',
  bgColor = '#E2E8F0',
  textColor = '#0F172A',
  textSubColor = '#94A3B8',
  showLabel = true,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color === '#2563EB' ? '#3B82F6' : color} stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      {showLabel && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{
            fontSize: size < 70 ? 14 : 18,
            fontWeight: '700',
            color: textColor,
            lineHeight: size < 70 ? 18 : 22,
          }}>
            {percent}%
          </Text>
        </View>
      )}
    </View>
  );
}
