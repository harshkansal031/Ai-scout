export const DAILY_TOPIC = {
  id: 'rag-agents',
  tag: 'RAG Agents',
  title: 'RAG Agents',
  duration: 35,
  difficulty: 'Intermediate',
  description: 'Learn how Retrieval-Augmented Generation transforms AI by grounding responses in real knowledge bases.',
  whatYoullLearn: [
    'What are RAG Agents',
    'How RAG improves AI outputs',
    'Build a RAG agent step by step',
  ],
  builderTakeaway: 'Use RAG when your AI needs fresh or private information.',
  resources: [
    { type: 'article', title: 'RAG Paper by Meta', time: '20 min' },
    { type: 'video', title: 'Build RAG with LangChain', time: '45 min' },
    { type: 'tool', title: 'LlamaIndex Quickstart', time: '15 min' },
  ],
};

export const PROGRESS = {
  weeklyPercent: 66,
  topicsCompleted: 5,
  topicsTotal: 7,
  weekDays: [true, true, true, true, true, false, false],
  streak: 7,
};

export const CONTINUE_LEARNING = [
  {
    id: 'function-calling',
    icon: '⚡',
    iconBg: '#7C3AED',
    title: 'Function Calling',
    timeLeft: '28 min left',
    progress: 0.4,
  },
  {
    id: 'vector-embeddings',
    icon: '🔢',
    iconBg: '#0891B2',
    title: 'Vector Embeddings',
    timeLeft: '40 min left',
    progress: 0.2,
  },
];

export const NEWS_ITEMS = [
  {
    id: '1',
    category: 'Research',
    categoryColor: '#7C3AED',
    title: 'New benchmark for LLM tool use',
    time: '2h ago',
    imageGradient: ['#1E1B4B', '#312E81'],
    saved: false,
  },
  {
    id: '2',
    category: 'News',
    categoryColor: '#0891B2',
    title: 'Open-source model hits new milestone',
    time: '6h ago',
    imageGradient: ['#064E3B', '#065F46'],
    saved: false,
  },
  {
    id: '3',
    category: 'Papers',
    categoryColor: '#D97706',
    title: 'Exploring scaling laws for reasoning',
    time: '10h ago',
    imageGradient: ['#4A1942', '#6B21A8'],
    saved: true,
  },
  {
    id: '4',
    category: 'News',
    categoryColor: '#0891B2',
    title: 'AI agents in production: lessons',
    time: '1d ago',
    imageGradient: ['#0C4A6E', '#075985'],
    saved: false,
  },
  {
    id: '5',
    category: 'Research',
    categoryColor: '#7C3AED',
    title: 'Chain-of-thought prompting elicits reasoning',
    time: '2d ago',
    imageGradient: ['#1E3A5F', '#1E40AF'],
    saved: false,
  },
  {
    id: '6',
    category: 'Papers',
    categoryColor: '#D97706',
    title: 'Attention is all you need — revisited',
    time: '3d ago',
    imageGradient: ['#2D1B69', '#4C1D95'],
    saved: false,
  },
];

export const EXPLORE_TOPICS = [
  {
    id: 'rag-agents',
    icon: '🤖',
    iconBg: '#1E3A5F',
    title: 'RAG Agents',
    duration: 35,
    status: 'begin',
    tag: 'RAG Agents',
    tagColor: '#059669',
  },
  {
    id: 'advanced-rag',
    icon: '🔍',
    iconBg: '#1E2B4A',
    title: 'Advanced RAG',
    duration: 40,
    status: 'begin',
    tag: null,
  },
];

export const EXPLORE_PAPERS = [
  {
    id: 'rag-qa',
    source: 'arXiv',
    year: '2024',
    title: 'Retrieval-Augmented Generation for Open-domain QA',
    saved: false,
  },
  {
    id: 'self-rag',
    source: 'arXiv',
    year: '2024',
    title: 'Self-RAG: Learning to Retrieve, Generate, and Critique',
    saved: false,
  },
];

export const EXPLORE_TOOLS = [
  {
    id: 'llamaindex',
    name: 'LlamaIndex',
    description: 'Data frameworks',
    icon: '🦙',
    iconBg: '#1A1B2E',
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'LLM framework',
    icon: '🔗',
    iconBg: '#1A1B2E',
  },
];

export const SAVED_ITEMS = [
  {
    id: 'rag-best',
    title: 'RAG Best Practices',
    type: 'Topic',
    time: '25 min',
    imageGradient: ['#1E2B4A', '#1E3A5F'],
  },
  {
    id: 'tool-agents',
    title: 'Tool Use in Agents',
    type: 'Topic',
    time: '30 min',
    imageGradient: ['#2D1B69', '#4C1D95'],
  },
  {
    id: 'chain-of-thought',
    title: 'Chain-of-Thought Prompting',
    type: 'Paper',
    time: '15 min',
    imageGradient: ['#064E3B', '#065F46'],
  },
];

export const HISTORY_ITEMS = [
  {
    id: 'function-calling',
    title: 'Function Calling',
    type: 'Topic',
    time: '28 min',
    completedAt: '2 days ago',
    imageGradient: ['#4A1942', '#6B21A8'],
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    type: 'Topic',
    time: '35 min',
    completedAt: '4 days ago',
    imageGradient: ['#0C4A6E', '#075985'],
  },
];

export const USER_PROFILE = {
  name: 'Alex Builder',
  role: 'Builder',
  roleColor: '#059669',
  avatar: null,
  stats: {
    topics: 12,
    saved: 8,
    streak: 7,
    progress: 66,
  },
};

export const CHAT_SUGGESTIONS = [
  { id: '1', text: 'Explain RAG simply' },
  { id: '2', text: 'Best RAG tools' },
  { id: '3', text: 'RAG vs Fine-tuning' },
  { id: '4', text: 'Help me build a RAG agent' },
];
