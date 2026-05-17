/**
 * seed_explore_topics.js
 *
 * One-time seed script that populates `explore_topics` with ~500 AI topics
 * and immediately triggers a first content fetch for each topic.
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   node scripts/seed_explore_topics.js
 *
 * Required env vars:
 *   EXPO_PUBLIC_SUPABASE_URL      — already in your .env / Expo env
 *   SUPABASE_SERVICE_ROLE_KEY     — from Supabase Dashboard → Settings → API
 *   GEMINI_API_KEY                — already in your .env / Expo env
 */

// CommonJS — loads .env from project root using Node built-ins, no dotenv needed
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// Read .env file from project root
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key && val && !process.env[key]) process.env[key] = val;
    });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY   = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error('Missing env vars: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Master field definitions ──────────────────────────────────────────────────
// Each field has a slug, a human-readable name, and a list of topic titles.
// The script will ask Gemini to enrich each batch (description, short_desc,
// difficulty, tags, docs_url) and insert into explore_topics.
const FIELDS = [
  {
    slug: 'ml-fundamentals',
    field: 'Machine Learning Fundamentals',
    topics: [
      'Linear Regression', 'Logistic Regression', 'Decision Trees', 'Random Forests',
      'Gradient Boosting', 'XGBoost', 'LightGBM', 'CatBoost',
      'Support Vector Machines', 'K-Nearest Neighbors', 'Naive Bayes',
      'Bayesian Inference', 'Cross-Validation', 'Regularization',
      'L1 and L2 Regularization', 'Bias-Variance Tradeoff', 'Feature Engineering',
      'Feature Selection', 'Dimensionality Reduction', 'Principal Component Analysis',
      't-SNE', 'UMAP', 'K-Means Clustering', 'DBSCAN', 'Hierarchical Clustering',
      'Anomaly Detection', 'Ensemble Methods', 'Bagging', 'Boosting', 'Stacking',
      'Model Evaluation Metrics', 'ROC-AUC Curve', 'Confusion Matrix', 'Precision and Recall',
      'Overfitting', 'Underfitting', 'Hyperparameter Tuning', 'Grid Search',
      'Bayesian Optimization', 'AutoML', 'Semi-supervised Learning',
      'Self-supervised Learning', 'Active Learning', 'Online Learning',
      'Transfer Learning', 'Few-shot Learning', 'Zero-shot Learning',
      'Imbalanced Datasets', 'SMOTE', 'Data Augmentation',
    ],
  },
  {
    slug: 'deep-learning',
    field: 'Deep Learning & Neural Networks',
    topics: [
      'Perceptron', 'Multi-layer Perceptron', 'Backpropagation',
      'Stochastic Gradient Descent', 'Adam Optimizer', 'AdaGrad', 'RMSprop',
      'Learning Rate Scheduling', 'Weight Initialization', 'Batch Normalization',
      'Layer Normalization', 'Group Normalization', 'Dropout', 'Weight Decay',
      'Gradient Clipping', 'Vanishing Gradient Problem', 'Exploding Gradient Problem',
      'Activation Functions', 'ReLU', 'GELU', 'Sigmoid', 'Softmax',
      'Loss Functions', 'Cross-Entropy Loss', 'Contrastive Loss', 'Triplet Loss',
      'Convolutional Neural Networks', 'Depthwise Separable Convolution', 'Pooling Layers',
      'Receptive Field', 'Skip Connections', 'ResNet', 'VGG', 'EfficientNet',
      'DenseNet', 'MobileNet', 'Recurrent Neural Networks', 'LSTM', 'GRU',
      'Attention Mechanism', 'Self-Attention', 'Multi-head Attention',
      'Transformer Architecture', 'Vision Transformer (ViT)', 'CLIP',
      'Sequence-to-Sequence', 'Encoder-Decoder', 'Positional Encoding',
      'Neural Architecture Search', 'Knowledge Distillation', 'Model Pruning',
    ],
  },
  {
    slug: 'nlp',
    field: 'Natural Language Processing',
    topics: [
      'Tokenization', 'Word Embeddings', 'Word2Vec', 'GloVe', 'FastText',
      'Sentence Embeddings', 'Named Entity Recognition', 'Part-of-Speech Tagging',
      'Dependency Parsing', 'Coreference Resolution', 'Sentiment Analysis',
      'Text Classification', 'Text Generation', 'Machine Translation',
      'Question Answering', 'Reading Comprehension', 'Text Summarization',
      'Information Extraction', 'Relation Extraction', 'Knowledge Graphs',
      'Entity Linking', 'Intent Detection', 'Dialogue Systems',
      'Byte-Pair Encoding (BPE)', 'SentencePiece', 'WordPiece Tokenizer',
      'BERT', 'GPT', 'T5', 'RoBERTa', 'ELECTRA', 'XLNet', 'DeBERTa',
      'Long Context Models', 'LLM Quantization', 'LoRA', 'QLoRA', 'PEFT',
      'Instruction Tuning', 'LLM Benchmarks', 'Hallucination in LLMs',
      'Speculative Decoding', 'Model Merging',
    ],
  },
  {
    slug: 'llms-generative-ai',
    field: 'Large Language Models & Generative AI',
    topics: [
      'Large Language Models', 'Foundation Models', 'GPT-4', 'Claude', 'Gemini',
      'Llama', 'Mistral', 'Phi Models', 'Mixture of Experts (MoE)',
      'Prompt Engineering', 'Chain-of-Thought Prompting', 'In-context Learning',
      'Retrieval-Augmented Generation (RAG)', 'Advanced RAG', 'Self-RAG',
      'Hybrid Search', 'Re-ranking', 'Vector Databases', 'Semantic Search',
      'BM25', 'TF-IDF', 'RLHF', 'Constitutional AI', 'Direct Preference Optimization (DPO)',
      'Fine-tuning LLMs', 'Continued Pretraining', 'Synthetic Data Generation',
      'LLM Agents', 'Tool Use and Function Calling', 'Multi-agent Systems',
      'Reasoning in LLMs', 'Tree of Thoughts', 'ReAct Framework',
      'Structured Output Generation', 'JSON Mode', 'System Prompt Design',
      'Context Window Management', 'Prompt Injection', 'Jailbreaking LLMs',
      'LLM Evaluation', 'MMLU Benchmark', 'HumanEval Benchmark',
      'AI Coding Assistants', 'Test-time Compute',
    ],
  },
  {
    slug: 'computer-vision',
    field: 'Computer Vision',
    topics: [
      'Image Classification', 'Object Detection', 'YOLO', 'DETR', 'Faster R-CNN',
      'Semantic Segmentation', 'Instance Segmentation', 'Panoptic Segmentation',
      'Image Generation', 'Stable Diffusion', 'DALL-E', 'Imagen',
      'Generative Adversarial Networks (GANs)', 'StyleGAN', 'Variational Autoencoders (VAE)',
      'Diffusion Models', 'DDPM', 'Score Matching', 'Flow Matching',
      'Optical Flow', 'Depth Estimation', '3D Reconstruction', 'NeRF',
      'Gaussian Splatting', 'Pose Estimation', 'Face Recognition', 'OCR',
      'Image Inpainting', 'Super Resolution', 'Video Understanding',
      'Action Recognition', 'Multi-Object Tracking', 'Contrastive Learning (Vision)',
      'Self-supervised Vision', 'Vision-Language Models', 'Grounding DINO',
      'Segment Anything Model (SAM)', 'Image Segmentation Prompting',
    ],
  },
  {
    slug: 'reinforcement-learning',
    field: 'Reinforcement Learning',
    topics: [
      'Markov Decision Process', 'Q-Learning', 'Deep Q-Network (DQN)',
      'Policy Gradient Methods', 'REINFORCE Algorithm', 'Proximal Policy Optimization (PPO)',
      'Soft Actor-Critic (SAC)', 'Deep Deterministic Policy Gradient (DDPG)', 'TD3',
      'Asynchronous Advantage Actor-Critic (A3C)', 'Multi-agent Reinforcement Learning',
      'Reward Shaping', 'Curriculum Learning in RL', 'Exploration vs Exploitation',
      'Epsilon-Greedy Strategy', 'Thompson Sampling', 'Upper Confidence Bound (UCB)',
      'Model-based Reinforcement Learning', 'World Models', 'Dreamer Architecture',
      'Offline Reinforcement Learning', 'Inverse Reinforcement Learning',
      'RLHF (Reinforcement Learning from Human Feedback)', 'Sim-to-Real Transfer',
      'OpenAI Gym', 'MuJoCo Physics Simulation',
    ],
  },
  {
    slug: 'ai-agents',
    field: 'AI Agents & Automation',
    topics: [
      'AI Agents Overview', 'Agentic AI Systems', 'LangChain Agents',
      'LlamaIndex Agents', 'AutoGPT', 'CrewAI', 'AutoGen', 'Semantic Kernel',
      'Tool Use in AI Agents', 'Function Calling APIs', 'AI Workflows',
      'Planning in AI Agents', 'Memory Systems for Agents', 'Long-term Memory',
      'Episodic Memory', 'Retrieval Augmented Agents', 'Multi-step Reasoning',
      'Agent Evaluation', 'Guardrails for AI Agents', 'AI Agent Observability',
      'Human-in-the-Loop AI', 'Autonomous Code Execution', 'Browser-use Agents',
      'Computer Use AI', 'AI Research Agents', 'Agent Orchestration',
    ],
  },
  {
    slug: 'mlops',
    field: 'MLOps & AI Infrastructure',
    topics: [
      'MLflow', 'Weights & Biases', 'DVC (Data Version Control)',
      'Kubeflow', 'Apache Airflow for ML', 'ZenML', 'Prefect for ML',
      'Docker for Machine Learning', 'Kubernetes for ML Workloads',
      'Model Serving', 'TorchServe', 'TensorFlow Serving', 'Triton Inference Server',
      'ONNX Runtime', 'Model Compression', 'Neural Network Quantization',
      'Model Pruning', 'Edge AI Deployment', 'TensorFlow Lite', 'Core ML',
      'Model Monitoring', 'Data Drift Detection', 'Concept Drift',
      'A/B Testing for ML Models', 'Feature Stores', 'CI/CD for ML',
      'Experiment Tracking', 'Model Registry', 'Distributed Training',
      'DeepSpeed', 'FSDP (Fully Sharded Data Parallel)', 'Mixed Precision Training',
      'Gradient Checkpointing', 'Model Parallelism', 'Data Parallelism',
      'Pipeline Parallelism', 'vLLM', 'Ollama', 'GPU Optimization for LLMs',
    ],
  },
  {
    slug: 'ai-ethics',
    field: 'AI Ethics & Safety',
    topics: [
      'AI Bias and Fairness', 'Algorithmic Fairness Metrics', 'Explainable AI (XAI)',
      'LIME (Local Interpretable Model-agnostic Explanations)',
      'SHAP (SHapley Additive exPlanations)', 'Interpretable Machine Learning',
      'Model Robustness', 'Adversarial Attacks', 'Adversarial Training',
      'AI Safety Research', 'AI Alignment', 'Constitutional AI',
      'AI Regulation and Governance', 'GDPR and AI', 'Data Privacy in ML',
      'Federated Learning', 'Differential Privacy', 'AI Watermarking',
      'Deepfake Detection', 'AI Auditing', 'Responsible AI Frameworks',
    ],
  },
  {
    slug: 'frameworks',
    field: 'Frameworks & Libraries',
    topics: [
      'PyTorch', 'TensorFlow', 'JAX', 'Keras', 'Scikit-learn',
      'Hugging Face Transformers', 'Hugging Face Diffusers', 'Hugging Face PEFT',
      'LangChain', 'LlamaIndex', 'OpenCV', 'FAISS', 'Chroma',
      'Pinecone', 'Weaviate', 'Qdrant', 'Milvus',
      'Ray Train', 'Dask for ML', 'XGBoost Library', 'LightGBM Library',
      'NumPy', 'Pandas', 'Matplotlib', 'Gradio', 'Streamlit for ML',
      'FastAPI for ML Deployment', 'Triton Python Backend', 'BitsAndBytes',
      'Accelerate Library', 'Sentence Transformers', 'Haystack Framework',
    ],
  },
  {
    slug: 'multimodal',
    field: 'Multimodal AI',
    topics: [
      'Multimodal Large Language Models', 'GPT-4V (Vision)', 'Gemini Vision',
      'CLIP (Contrastive Language-Image Pre-training)', 'BLIP', 'BLIP-2',
      'Flamingo', 'LLaVA', 'InstructBLIP', 'Multimodal Reasoning',
      'Audio Language Models', 'Whisper (Speech Recognition)',
      'Text-to-Speech (TTS)', 'Voice Cloning', 'Music Generation AI',
      'Video Generation', 'Sora', 'Video Understanding with LLMs',
      'Document Understanding', 'Document AI', 'Table Understanding',
      'Chart Understanding', 'Visual Question Answering',
      'Image Captioning', 'Image-Text Retrieval', 'Cross-modal Learning',
    ],
  },
  {
    slug: 'robotics-embodied',
    field: 'Robotics & Embodied AI',
    topics: [
      'Robot Operating System (ROS)', 'Motion Planning', 'SLAM (Simultaneous Localization and Mapping)',
      'Robot Manipulation', 'Locomotion in Robotics', 'Sim-to-Real Transfer for Robotics',
      'World Models for Robotics', 'Embodied AI', 'Foundation Models for Robotics',
      'Imitation Learning for Robots', 'Dexterous Manipulation',
      'Multi-robot Systems', 'Human-Robot Interaction',
      'Autonomous Vehicles', 'Drone AI', 'Physical AI', 'Humanoid Robots',
      'RT-2 (Robotics Transformer)', 'Open-X Embodiment',
    ],
  },
  {
    slug: 'emerging-research',
    field: 'Emerging Research & Concepts',
    topics: [
      'AI Scaling Laws', 'Chinchilla Scaling', 'Emergent Capabilities in LLMs',
      'State Space Models', 'Mamba Architecture', 'RWKV',
      'Kolmogorov-Arnold Networks (KAN)', 'Liquid Neural Networks',
      'Neuromorphic Computing', 'Quantum Machine Learning',
      'Neural Collapse', 'Grokking in Neural Networks',
      'Mechanistic Interpretability', 'Superposition in Neural Networks',
      'Sparse Autoencoders', 'Activation Patching', 'Causal Tracing',
      'Long-context Retrieval', 'Needle-in-a-Haystack Evaluation',
      'AI Scientists', 'AlphaFold', 'Protein Structure Prediction',
      'AI for Drug Discovery', 'AI for Climate', 'AI for Mathematics',
    ],
  },
];

// ── Gemini enrichment (with retry + exponential backoff) ─────────────────────
async function enrichTopics(fieldSlug, fieldName, topicTitles) {
  const prompt = `You are an AI curriculum expert. Enrich these AI topic titles with structured metadata.

Field: "${fieldName}"
Topics: ${JSON.stringify(topicTitles)}

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "id": kebab-case slug (lowercase, hyphens, max 40 chars, globally unique)
- "title": exact topic title as given
- "short_desc": one punchy sentence (max 100 chars) explaining what this topic is
- "description": 2-3 sentences explaining the concept clearly for a developer learning AI
- "difficulty": exactly one of "Beginner", "Intermediate", or "Advanced"
- "tags": array of 3-5 lowercase keyword strings relevant to this topic
- "docs_url": the best official documentation or canonical reference URL (e.g. pytorch.org/docs for PyTorch). Use null if no official docs exist.

Be accurate. Match difficulty to actual complexity. docs_url must be a real URL.`;

  // Gemini free tier: 20 RPM rolling window.
  // We wait 65s between fields (caller's responsibility) so we should never
  // hit the limit, but we still retry twice with a full 70s wait just in case.
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      const msg = String(data.error.message ?? '');
      const isQuotaError = msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || data.error.code === 429;
      if (isQuotaError) {
        // Quota exhausted — no point retrying, use local fallback immediately
        console.log(`  ⚠️  Gemini quota exhausted on attempt ${attempt}. Switching to local fallback.`);
        return null;
      }
      // Other errors (500, etc.) — retry with short wait
      console.log(`  ⏳ Gemini error (attempt ${attempt}/${MAX_RETRIES}): ${data.error.message}. Waiting 5s...`);
      await sleep(5000);
      continue;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.log(`  ⏳ Empty response (attempt ${attempt}/${MAX_RETRIES}). Waiting 70s...`);
      await sleep(70000);
      continue;
    }

    const enriched = JSON.parse(text);
    return enriched.map((t) => ({
      id: t.id || slugify(t.title),
      title: t.title,
      field: fieldName,
      field_slug: fieldSlug,
      description: t.description || '',
      short_desc: t.short_desc || '',
      tags: Array.isArray(t.tags) ? t.tags : [],
      difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(t.difficulty) ? t.difficulty : 'Intermediate',
      docs_url: t.docs_url || null,
    }));
  }

  console.log(`  ⚠️  Gemini quota exhausted — falling back to basic metadata (run again tomorrow to enrich).`);
  return null; // signal to use local fallback
}

// ── Local fallback: generate basic metadata without Gemini ────────────────────
// Used when the API quota is exhausted. Descriptions are generic but the topics
// are fully searchable by title and field. Re-run with Gemini quota restored to
// replace with enriched descriptions and docs_url.
const FIELD_DIFFICULTY = {
  'ml-fundamentals':   'Beginner',
  'deep-learning':     'Intermediate',
  'nlp':               'Intermediate',
  'llms-generative-ai':'Intermediate',
  'computer-vision':   'Intermediate',
  'reinforcement-learning': 'Advanced',
  'ai-agents':         'Intermediate',
  'mlops':             'Intermediate',
  'ai-ethics':         'Beginner',
  'frameworks':        'Beginner',
  'multimodal':        'Intermediate',
  'robotics-embodied': 'Advanced',
  'emerging-research': 'Advanced',
};

function generateBasicMetadata(fieldSlug, fieldName, topicTitles) {
  const difficulty = FIELD_DIFFICULTY[fieldSlug] ?? 'Intermediate';
  return topicTitles.map((title) => {
    const words = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
    return {
      id: slugify(title),
      title,
      field: fieldName,
      field_slug: fieldSlug,
      description: `${title} is a key concept in ${fieldName}. This topic covers the core principles and practical applications relevant to AI practitioners and researchers.`,
      short_desc: `Core ${fieldName} concept: ${title}.`,
      tags: words.slice(0, 5),
      difficulty,
      docs_url: null,
    };
  });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Scout AI — Explore Topics Seeder');
  console.log(`📚 Processing ${FIELDS.length} fields...`);

  let totalInserted = 0;
  let totalSkipped = 0;

  // Fetch already-seeded field slugs so we can skip them on re-runs
  const { data: existing } = await supabase
    .from('explore_topics')
    .select('field_slug');
  const seededSlugs = new Set((existing ?? []).map((r) => r.field_slug));

  for (const fieldDef of FIELDS) {
    const { slug, field, topics } = fieldDef;

    if (seededSlugs.has(slug)) {
      console.log(`\n[${slug}] Already seeded — skipping.`);
      continue;
    }

    console.log(`\n[${slug}] Enriching ${topics.length} topics with Gemini...`);

    let enriched;
    try {
      enriched = await enrichTopics(slug, field, topics);
    } catch (err) {
      console.error(`  ❌ Gemini failed for ${slug}:`, err.message);
      enriched = null;
    }

    // Fall back to local metadata when Gemini quota is exhausted
    if (!enriched) {
      console.log(`  🔄 Using local fallback for [${slug}] — re-run tomorrow to enrich with Gemini.`);
      enriched = generateBasicMetadata(slug, field, topics);
    }

    console.log(`  ✅ Enriched ${enriched.length} topics. Upserting to Supabase...`);

    const { error } = await supabase
      .from('explore_topics')
      .upsert(enriched, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      console.error(`  ❌ Supabase upsert failed:`, error.message);
    } else {
      console.log(`  ✅ Upserted ${enriched.length} topics for [${slug}]`);
      totalInserted += enriched.length;
    }

    // gemini-1.5-flash free tier: 15 RPM / 1500 RPD — 8s between fields is safe
    await sleep(8000);
  }

  console.log(`\n✅ Done! Inserted ${totalInserted} topics, skipped ${totalSkipped}.`);
  console.log('\n📡 Triggering first content fetch for all topics...');

  const batchId = `seed-${Date.now()}`;
  const { data: fnData, error: fnError } = await supabase.functions.invoke('fetch-topic-content', {
    body: { run_all: true, batch_id: batchId },
  });

  if (fnError) {
    console.error('❌ Content fetch failed:', fnError.message);
  } else {
    console.log(`✅ Initial content fetch complete:`, fnData);
  }

  console.log('\n🎉 Seed complete! Your explore_topics corpus is ready.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
