-- ============================================================
-- AI Scout — Seed Data
-- Run this after 001_init.sql in the Supabase SQL Editor
-- ============================================================

-- ────────────────────────────────────────────────
-- 1. DAILY TOPICS
-- ────────────────────────────────────────────────
insert into public.daily_topics
  (id, slug, title, tag, duration_minutes, difficulty, description, builder_takeaway, content_blocks, publish_date, is_published)
values
  (
    'rag-agents',
    'rag-agents',
    'RAG Agents',
    'RAG Agents',
    35,
    'Intermediate',
    'Learn how Retrieval-Augmented Generation transforms AI by grounding responses in real knowledge bases.',
    'Use RAG when your AI needs fresh or private information.',
    '{
      "whatYoullLearn": [
        "What are RAG Agents",
        "How RAG improves AI outputs",
        "Build a RAG agent step by step"
      ]
    }'::jsonb,
    current_date,
    true
  ),
  (
    'advanced-rag',
    'advanced-rag',
    'Advanced RAG',
    'Advanced RAG',
    40,
    'Advanced',
    'Go deeper into RAG pipelines — hybrid search, re-ranking, and context compression for production systems.',
    'Combine dense and sparse retrieval for best-in-class RAG performance.',
    '{
      "whatYoullLearn": [
        "Hybrid search strategies",
        "Re-ranking retrieved chunks",
        "Compressing context windows"
      ]
    }'::jsonb,
    current_date - interval '1 day',
    true
  ),
  (
    'function-calling',
    'function-calling',
    'Function Calling',
    'Function Calling',
    28,
    'Intermediate',
    'Understand how modern LLMs call external tools and APIs to extend their capabilities beyond text generation.',
    'Use function calling to let your AI trigger real actions in your product.',
    '{
      "whatYoullLearn": [
        "How function calling works in OpenAI",
        "Defining tool schemas in JSON",
        "Handling tool results in the conversation loop"
      ]
    }'::jsonb,
    current_date - interval '2 days',
    true
  ),
  (
    'prompt-engineering',
    'prompt-engineering',
    'Prompt Engineering',
    'Prompts',
    35,
    'Beginner',
    'Master the art of writing clear, structured prompts that reliably produce high-quality outputs from any LLM.',
    'A great prompt is the cheapest fine-tune you can do.',
    '{
      "whatYoullLearn": [
        "Zero-shot vs few-shot prompting",
        "Chain-of-thought techniques",
        "System prompt design patterns"
      ]
    }'::jsonb,
    current_date - interval '3 days',
    true
  ),
  (
    'vector-embeddings',
    'vector-embeddings',
    'Vector Embeddings',
    'Embeddings',
    40,
    'Intermediate',
    'Discover how text is converted into vectors and why similarity search is the backbone of modern AI apps.',
    'Pick the right embedding model and index for your data size and latency target.',
    '{
      "whatYoullLearn": [
        "What embeddings represent",
        "Cosine similarity explained",
        "Choosing a vector database"
      ]
    }'::jsonb,
    current_date - interval '4 days',
    true
  )
on conflict (id) do nothing;


-- ────────────────────────────────────────────────
-- 2. RESOURCES (linked to topics)
-- ────────────────────────────────────────────────
insert into public.resources
  (topic_id, type, title, url, duration_label, sort_order)
values
  -- RAG Agents resources
  ('rag-agents', 'article', 'RAG Paper by Meta', 'https://arxiv.org/abs/2005.11401', '20 min', 1),
  ('rag-agents', 'video',   'Build RAG with LangChain', 'https://python.langchain.com/docs/tutorials/rag/', '45 min', 2),
  ('rag-agents', 'tool',    'LlamaIndex Quickstart', 'https://docs.llamaindex.ai/en/stable/getting_started/starter_example/', '15 min', 3),

  -- Advanced RAG resources
  ('advanced-rag', 'article', 'Hybrid Search with BM25 + FAISS', 'https://www.pinecone.io/learn/hybrid-search/', '25 min', 1),
  ('advanced-rag', 'article', 'Re-ranking with Cohere', 'https://docs.cohere.com/docs/reranking', '20 min', 2),
  ('advanced-rag', 'tool',    'Weaviate Vector DB Docs', 'https://weaviate.io/developers/weaviate', '30 min', 3),

  -- Function Calling resources
  ('function-calling', 'article', 'OpenAI Function Calling Guide', 'https://platform.openai.com/docs/guides/function-calling', '20 min', 1),
  ('function-calling', 'video',   'Tool Use in Practice', 'https://www.youtube.com/watch?v=aqdWSYWC_LI', '35 min', 2),

  -- Prompt Engineering resources
  ('prompt-engineering', 'article', 'Prompt Engineering Guide', 'https://www.promptingguide.ai/', '30 min', 1),
  ('prompt-engineering', 'article', 'OpenAI Best Practices', 'https://platform.openai.com/docs/guides/prompt-engineering', '20 min', 2),

  -- Vector Embeddings resources
  ('vector-embeddings', 'article', 'What are Embeddings?', 'https://platform.openai.com/docs/guides/embeddings', '25 min', 1),
  ('vector-embeddings', 'tool',    'Pinecone Quickstart', 'https://docs.pinecone.io/guides/get-started/quickstart', '20 min', 2)

on conflict do nothing;


-- ────────────────────────────────────────────────
-- 3. CONTENT ITEMS (News, Research, Papers, Tools)
-- ────────────────────────────────────────────────
insert into public.content_items
  (id, type, title, summary, source_name, source_url, canonical_url, published_at, tags, metadata)
values

  -- ── News ──
  (
    'news-1', 'news',
    'Open-source model hits new milestone',
    'Meta releases a new open-weight model that matches GPT-4 performance on coding benchmarks, raising the bar for the open-source ecosystem.',
    'The Decoder', 'https://the-decoder.com', 'https://the-decoder.com/open-source-milestone',
    now() - interval '6 hours',
    '{news, open-source, llm}',
    '{"imageGradient": ["#064E3B", "#065F46"], "categoryColor": "#0891B2"}'::jsonb
  ),
  (
    'news-2', 'news',
    'AI agents in production: lessons from 12 months',
    'Engineers share hard-won lessons from running autonomous AI agents in production — hallucination guardrails, retry budgets, and logging strategies.',
    'Towards Data Science', 'https://towardsdatascience.com', 'https://towardsdatascience.com/agents-production',
    now() - interval '1 day',
    '{news, agents, production}',
    '{"imageGradient": ["#0C4A6E", "#075985"], "categoryColor": "#0891B2"}'::jsonb
  ),
  (
    'news-3', 'news',
    'Mistral releases Codestral for code generation',
    'Mistral AI launches Codestral, a 22B model specifically trained for code with support for 80+ programming languages.',
    'VentureBeat', 'https://venturebeat.com', 'https://venturebeat.com/codestral',
    now() - interval '2 days',
    '{news, code, open-source}',
    '{"imageGradient": ["#1A1B2E", "#2D1B69"], "categoryColor": "#0891B2"}'::jsonb
  ),

  -- ── Research ──
  (
    'research-1', 'research',
    'New benchmark for LLM tool use',
    'Researchers introduce ToolBench, a comprehensive benchmark for evaluating how well LLMs use external APIs and tools across 16K real-world scenarios.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2307.16789',
    now() - interval '2 hours',
    '{research, benchmark, tool-use}',
    '{"imageGradient": ["#1E1B4B", "#312E81"], "categoryColor": "#7C3AED"}'::jsonb
  ),
  (
    'research-2', 'research',
    'Chain-of-thought prompting elicits reasoning in LLMs',
    'Google Brain shows that a series of intermediate reasoning steps (chain-of-thought) significantly improves reasoning in large language models.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2201.11903',
    now() - interval '2 days',
    '{research, prompting, reasoning}',
    '{"imageGradient": ["#1E3A5F", "#1E40AF"], "categoryColor": "#7C3AED"}'::jsonb
  ),
  (
    'research-3', 'research',
    'Long context LLMs struggle with retrieval in the middle',
    'A Stanford study finds that LLMs perform significantly worse when relevant information is placed in the middle of long contexts — the "Lost in the Middle" problem.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2307.03172',
    now() - interval '3 days',
    '{research, context, rag}',
    '{"imageGradient": ["#1C1B1F", "#312E81"], "categoryColor": "#7C3AED"}'::jsonb
  ),

  -- ── Papers ──
  (
    'paper-1', 'paper',
    'Retrieval-Augmented Generation for Open-domain QA',
    'Lewis et al. introduce RAG, combining dense retrieval with seq2seq generation to answer open-domain questions using non-parametric memory.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2005.11401',
    '2024-01-01 00:00:00+00',
    '{paper, rag, retrieval}',
    '{"imageGradient": ["#4A1942", "#6B21A8"], "categoryColor": "#D97706", "year": "2024", "venue": "NeurIPS"}'::jsonb
  ),
  (
    'paper-2', 'paper',
    'Self-RAG: Learning to Retrieve, Generate, and Critique',
    'Self-RAG trains LLMs to adaptively retrieve passages and critique their own outputs using special reflection tokens.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2310.11511',
    '2024-01-01 00:00:00+00',
    '{paper, rag, self-improvement}',
    '{"imageGradient": ["#2D1B69", "#4C1D95"], "categoryColor": "#D97706", "year": "2024", "venue": "ICLR"}'::jsonb
  ),
  (
    'paper-3', 'paper',
    'Attention Is All You Need — revisited',
    'A retrospective analysis of the transformer architecture 7 years later, covering its impact, limitations, and the major variants that followed.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/1706.03762',
    '2024-01-01 00:00:00+00',
    '{paper, transformers, attention}',
    '{"imageGradient": ["#2D1B69", "#4C1D95"], "categoryColor": "#D97706", "year": "2024", "venue": "arXiv"}'::jsonb
  ),
  (
    'paper-4', 'paper',
    'Exploring scaling laws for reasoning models',
    'OpenAI researchers document how reasoning capabilities scale with compute and training data for next-token prediction models.',
    'arXiv', 'https://arxiv.org', 'https://arxiv.org/abs/2001.08361',
    '2024-01-01 00:00:00+00',
    '{paper, scaling, reasoning}',
    '{"imageGradient": ["#4A1942", "#6B21A8"], "categoryColor": "#D97706", "year": "2024", "venue": "arXiv"}'::jsonb
  ),

  -- ── Tools ──
  (
    'tool-llamaindex', 'tool',
    'LlamaIndex',
    'Data frameworks for connecting custom data sources to large language models. The go-to library for RAG pipelines.',
    'LlamaIndex', 'https://llamaindex.ai', 'https://llamaindex.ai',
    now() - interval '5 days',
    '{tool, rag, framework}',
    '{"icon": "🦙", "iconBg": "#1A1B2E"}'::jsonb
  ),
  (
    'tool-langchain', 'tool',
    'LangChain',
    'A framework for developing applications powered by language models with chains, agents, memory, and tool integrations.',
    'LangChain', 'https://langchain.com', 'https://langchain.com',
    now() - interval '5 days',
    '{tool, agents, framework}',
    '{"icon": "🔗", "iconBg": "#1A1B2E"}'::jsonb
  ),
  (
    'tool-weaviate', 'tool',
    'Weaviate',
    'Open-source vector database with hybrid search, built-in ML model integrations, and a GraphQL API.',
    'Weaviate', 'https://weaviate.io', 'https://weaviate.io',
    now() - interval '5 days',
    '{tool, vector-db, search}',
    '{"icon": "🗄️", "iconBg": "#1A1B2E"}'::jsonb
  )

on conflict (id) do nothing;
