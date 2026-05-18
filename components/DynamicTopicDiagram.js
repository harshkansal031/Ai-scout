import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path, Rect, Circle, Text as SvgText } from 'react-native-svg';

function ArrowLine({ x1, y1, x2, y2, color = '#4B5563', dashed = true }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;
  const arrowSize = 8;
  const ax = x2 - nx * arrowSize;
  const ay = y2 - ny * arrowSize;
  const perpX = -ny * arrowSize * 0.4;
  const perpY = nx * arrowSize * 0.4;

  return (
    <>
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={dashed ? "4,3" : undefined}
      />
      <Path
        d={`M${x2},${y2} L${ax + perpX},${ay + perpY} L${ax - perpX},${ay - perpY} Z`}
        fill={color}
      />
    </>
  );
}

/**
 * Lecture flowchart: template is chosen only by **field_slug** (broad category),
 * not by the daily topic title. Same category ⇒ same SVG until the topic’s field changes.
 */
function DiagramFrame({ diagramTitle, svg }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{diagramTitle}</Text>
      {svg}
    </View>
  );
}

function Node({ x, y, width = 80, height = 30, label, bg = '#1A2540', textColor = '#94A3B8', borderColor = '#2D3A58' }) {
  return (
    <>
      <Rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={6}
        fill={bg}
        stroke={borderColor}
        strokeWidth={1}
      />
      <SvgText
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill={textColor}
        fontSize={10}
        fontWeight="700"
      >
        {label}
      </SvgText>
    </>
  );
}

export default function DynamicTopicDiagram({ fieldSlug }) {
  const W = 320;
  const H = 160;

  // Resolve category slug
  const slug = String(fieldSlug || '').toLowerCase();

  // 1. LLMs & GENERATIVE AI / NLP
  if (slug === 'llms-generative-ai' || slug === 'nlp') {
    return (
      <DiagramFrame
        diagramTitle="LLM Token Inference Pipeline"
        svg={
          <Svg width={W} height={H} style={styles.svg}>
          <ArrowLine x1={65} y1={60} x2={110} y2={60} color="#3B82F6" />
          <ArrowLine x1={180} y1={60} x2={225} y2={60} color="#3B82F6" />
          
          <Node x={40} y={60} width={65} label="Prompt" bg="#1E3A5F" textColor="#3B82F6" borderColor="#2563EB" />
          <Node x={145} y={60} width={80} label="Attention Layer" bg="#1A2540" textColor="#94A3B8" borderColor="#2D3A58" />
          <Node x={265} y={60} width={75} label="Next Token" bg="#1D3A2F" textColor="#10B981" borderColor="#059669" />

          {/* Context vector stack */}
          <Rect x={110} y={105} width={70} height={20} rx={4} fill="#2D1B4E" stroke="#7C3AED" strokeWidth={1} />
          <SvgText x={145} y={118} textAnchor="middle" fill="#A78BFA" fontSize={9} fontWeight="600">Embedding</SvgText>
          <ArrowLine x1={145} y1={100} x2={145} y2={80} color="#7C3AED" />
          </Svg>
        }
      />
    );
  }

  // 2. COMPUTER VISION / MULTIMODAL
  if (slug === 'computer-vision' || slug === 'multimodal') {
    return (
      <DiagramFrame
        diagramTitle="Vision Bounding Viewport"
        svg={
          <Svg width={W} height={H} style={styles.svg}>
          {/* Grid lines */}
          <Line x1={40} y1={20} x2={280} y2={20} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <Line x1={40} y1={70} x2={280} y2={70} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          <Line x1={40} y1={120} x2={280} y2={120} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
          
          {/* Bounding box (Dog/Object) */}
          <Rect x={50} y={30} width={90} height={90} rx={6} fill="rgba(16,185,129,0.08)" stroke="#10B981" strokeWidth={1.5} />
          <Rect x={50} y={15} width={65} height={16} rx={3} fill="#10B981" />
          <SvgText x={82} y={27} textAnchor="middle" fill="#FFFFFF" fontSize={9} fontWeight="800">OBJECT 98%</SvgText>

          {/* Focal anchor lines */}
          <Line x1={160} y1={10} x2={160} y2={140} stroke="rgba(239,68,68,0.3)" strokeWidth={1} strokeDasharray="2,2" />
          <Circle cx={160} cy={75} r={4} fill="#EF4444" />
          <Circle cx={160} cy={75} r={10} stroke="#EF4444" strokeWidth={1} fill="none" />

          {/* Feature maps */}
          <Rect x={210} y={40} width={50} height={50} rx={4} fill="#1E293B" stroke="#475569" strokeWidth={1} />
          <Rect x={220} y={50} width={50} height={50} rx={4} fill="rgba(30,41,59,0.8)" stroke="#475569" strokeWidth={1} />
          <ArrowLine x1={145} y1={75} x2={205} y2={75} color="#3B82F6" />
          </Svg>
        }
      />
    );
  }

  // 3. REINFORCEMENT LEARNING / ROBOTICS
  if (slug === 'reinforcement-learning' || slug === 'robotics-embodied') {
    return (
      <DiagramFrame
        diagramTitle="Agent-Environment Loop"
        svg={
          <Svg width={W} height={H} style={styles.svg}>
          <Node x={70} y={75} width={75} label="Agent" bg="#1E3A5F" textColor="#3B82F6" borderColor="#2563EB" />
          <Node x={250} y={75} width={85} label="Environment" bg="#1D3A2F" textColor="#10B981" borderColor="#059669" />

          {/* Upper Action arrow */}
          <Path d="M110,55 Q160,35 210,55" fill="none" stroke="#F59E0B" strokeWidth={1.5} />
          <Path d="M210,55 L202,51 L206,58 Z" fill="#F59E0B" />
          <SvgText x={160} y={38} textAnchor="middle" fill="#F59E0B" fontSize={9} fontWeight="700">Action (a)</SvgText>

          {/* Lower Reward & State arrow */}
          <Path d="M210,95 Q160,115 110,95" fill="none" stroke="#10B981" strokeWidth={1.5} />
          <Path d="M110,95 L118,99 L114,92 Z" fill="#10B981" />
          <SvgText x={160} y={124} textAnchor="middle" fill="#10B981" fontSize={9} fontWeight="700">State (s) + Reward (r)</SvgText>
          </Svg>
        }
      />
    );
  }

  // 4. ML FUNDAMENTALS / DEEP LEARNING / FRAMEWORKS
  if (slug === 'ml-fundamentals' || slug === 'deep-learning' || slug === 'frameworks') {
    return (
      <DiagramFrame
        diagramTitle="Neural Net Topology"
        svg={
          <Svg width={W} height={H} style={styles.svg}>
          {/* Layer 1 Nodes (Input) */}
          <Circle cx={60} cy={40} r={10} fill="#1E293B" stroke="#475569" strokeWidth={1} />
          <Circle cx={60} cy={80} r={10} fill="#1E293B" stroke="#475569" strokeWidth={1} />
          <Circle cx={60} cy={120} r={10} fill="#1E293B" stroke="#475569" strokeWidth={1} />

          {/* Layer 2 Nodes (Hidden) */}
          <Circle cx={160} cy={40} r={10} fill="#1E3A5F" stroke="#2563EB" strokeWidth={1.5} />
          <Circle cx={160} cy={80} r={10} fill="#1E3A5F" stroke="#2563EB" strokeWidth={1.5} />
          <Circle cx={160} cy={120} r={10} fill="#1E3A5F" stroke="#2563EB" strokeWidth={1.5} />

          {/* Layer 3 Node (Output) */}
          <Circle cx={260} cy={80} r={10} fill="#1D3A2F" stroke="#10B981" strokeWidth={1.5} />

          {/* Fully connected lines */}
          {/* L1 to L2 */}
          <Line x1={70} y1={40} x2={150} y2={40} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={40} x2={150} y2={80} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={80} x2={150} y2={40} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={80} x2={150} y2={80} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={80} x2={150} y2={120} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={120} x2={150} y2={80} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <Line x1={70} y1={120} x2={150} y2={120} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

          {/* L2 to Output */}
          <Line x1={170} y1={40} x2={250} y2={80} stroke="#3B82F6" strokeWidth={1} />
          <Line x1={170} y1={80} x2={250} y2={80} stroke="#3B82F6" strokeWidth={1.2} />
          <Line x1={170} y1={120} x2={250} y2={80} stroke="#3B82F6" strokeWidth={1} />

          <SvgText x={60} y={150} textAnchor="middle" fill="#64748B" fontSize={8} fontWeight="700">Inputs</SvgText>
          <SvgText x={160} y={150} textAnchor="middle" fill="#64748B" fontSize={8} fontWeight="700">Weights</SvgText>
          <SvgText x={260} y={150} textAnchor="middle" fill="#10B981" fontSize={8} fontWeight="700">Loss / Out</SvgText>
          </Svg>
        }
      />
    );
  }

  // 5. MLOPS / PRODUCTION
  if (slug === 'mlops') {
    return (
      <DiagramFrame
        diagramTitle="Production MLOps Pipeline"
        svg={
          <Svg width={W} height={H} style={styles.svg}>
          <ArrowLine x1={70} y1={65} x2={110} y2={65} color="#4B5563" />
          <ArrowLine x1={190} y1={65} x2={230} y2={65} color="#3B82F6" />
          
          <Node x={40} y={65} width={55} label="Code / Git" bg="#1A2540" textColor="#94A3B8" borderColor="#2D3A58" />
          <Node x={150} y={65} width={75} label="CI/CD Build" bg="#1A2540" textColor="#94A3B8" borderColor="#2D3A58" />
          <Node x={270} y={65} width={75} label="REST Server" bg="#1D3A2F" textColor="#10B981" borderColor="#059669" />

          {/* Model Registry box */}
          <Rect x={110} y={105} width={80} height={20} rx={4} fill="#2D1B4E" stroke="#7C3AED" strokeWidth={1} />
          <SvgText x={150} y={118} textAnchor="middle" fill="#A78BFA" fontSize={8} fontWeight="700">Model Registry</SvgText>
          <ArrowLine x1={150} y1={100} x2={150} y2={80} color="#7C3AED" />
          </Svg>
        }
      />
    );
  }

  // 6. GENERAL FALLBACK (AI Ethics, Emerging Research, AI Agents)
  return (
    <DiagramFrame
      diagramTitle="AI Reasoning Gear Loop"
      svg={
        <Svg width={W} height={H} style={styles.svg}>
        <ArrowLine x1={75} y1={65} x2={115} y2={65} color="#7C3AED" />
        <ArrowLine x1={195} y1={65} x2={235} y2={65} color="#3B82F6" />
        
        <Node x={40} y={65} width={65} label="Observe / Goal" bg="#2D1B4E" textColor="#A78BFA" borderColor="#7C3AED" />
        <Node x={155} y={65} width={75} label="Reason / Plan" bg="#1E3A5F" textColor="#3B82F6" borderColor="#2563EB" />
        <Node x={270} y={65} width={65} label="Act / Tool" bg="#1D3A2F" textColor="#10B981" borderColor="#059669" />

        {/* Feedback loop arrow bottom */}
        <Path d="M270,80 Q155,130 40,80" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="3,3" />
        <Path d="M40,80 L48,84 L44,77 Z" fill="rgba(255,255,255,0.2)" />
        </Svg>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1120',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#1E293B',
  },
  title: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  svg: {
    alignSelf: 'center',
  },
});
