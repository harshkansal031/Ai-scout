import React from 'react';
import { View, Text } from 'react-native';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekDots({ days = [], activeColor = '#2563EB', inactiveColor = '#E2E8F0', textColor = '#94A3B8' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
      {DAY_LABELS.map((label, idx) => (
        <View key={idx} style={{ alignItems: 'center', gap: 4 }}>
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: days[idx] ? activeColor : inactiveColor,
          }} />
          <Text style={{ fontSize: 10, color: textColor, fontWeight: '500' }}>{label}</Text>
        </View>
      ))}
    </View>
  );
}
