import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Line, Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

function ArrowLine({ x1, y1, x2, y2, color = '#4B5563' }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;
  const arrowSize = 8;
  const ax = x2 - nx * arrowSize;
  const ay = y2 - ny * arrowSize;
  const perpX = -ny * arrowSize * 0.5;
  const perpY = nx * arrowSize * 0.5;

  return (
    <>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeDasharray="4,3" />
      <Path
        d={`M${x2},${y2} L${ax + perpX},${ay + perpY} L${ax - perpX},${ay - perpY} Z`}
        fill={color}
      />
    </>
  );
}

function Node({ x, y, width = 80, height = 32, label, bg = '#1E2540', textColor = '#94A3B8', borderColor = '#2D3A58' }) {
  return (
    <>
      <Rect x={x - width / 2} y={y - height / 2} width={width} height={height} rx={8} fill={bg} stroke={borderColor} strokeWidth={1} />
      <SvgText x={x} y={y + 5} textAnchor="middle" fill={textColor} fontSize={11} fontWeight="600">{label}</SvgText>
    </>
  );
}

export default function RAGDiagram({ onPlay }) {
  const W = 320;
  const H = 180;

  const queryX = 55, nodeY = 60;
  const retrieverX = 165, retrieverY = 60;
  const llmX = 275, llmY = 60;
  const kbX = 165, kbY = 130;

  return (
    <View style={{
      backgroundColor: '#0D1120',
      borderRadius: 16,
      padding: 16,
      marginVertical: 12,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Svg width={W} height={H} style={{ alignSelf: 'center' }}>
        {/* Connections */}
        <ArrowLine x1={queryX + 40} y1={nodeY} x2={retrieverX - 40} y2={retrieverY} color="#3B82F6" />
        <ArrowLine x1={retrieverX + 40} y1={retrieverY} x2={llmX - 40} y2={llmY} color="#3B82F6" />
        <ArrowLine x1={kbX} y1={kbY - 22} x2={retrieverX} y2={retrieverY + 16} color="#059669" />

        {/* Nodes */}
        <Node x={queryX} y={nodeY} width={78} height={34} label="Query" bg="#1A2540" textColor="#94A3B8" borderColor="#2D3A58" />
        <Node x={retrieverX} y={retrieverY} width={90} height={34} label="Retriever" bg="#1E3A5F" textColor="#3B82F6" borderColor="#2563EB" />
        <Node x={llmX} y={llmY} width={72} height={34} label="LLM" bg="#1A2540" textColor="#94A3B8" borderColor="#2D3A58" />

        {/* Knowledge Base */}
        <Rect x={kbX - 55} y={kbY - 22} width={110} height={40} rx={8} fill="#0F2214" stroke="#059669" strokeWidth={1} />
        <SvgText x={kbX} y={kbY - 6} textAnchor="middle" fill="#10B981" fontSize={10} fontWeight="600">Knowledge</SvgText>
        <SvgText x={kbX} y={kbY + 8} textAnchor="middle" fill="#10B981" fontSize={10} fontWeight="600">Base</SvgText>
      </Svg>

      {/* Play button overlay */}
      <TouchableOpacity
        onPress={onPlay}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#2563EB',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Ionicons name="play" size={20} color="#FFFFFF" style={{ marginLeft: 3 }} />
      </TouchableOpacity>
    </View>
  );
}
