// ---- Chat Log (matches PostgreSQL schema from design doc) ----

export interface RetrievedDoc {
  doc_id: string;
  content: string;
  similarity_score: number;
}

export interface ChatLog {
  id: string;
  sender: string;
  question: string;
  answer: string;
  retrieved_docs: RetrievedDoc[];
  response_time_ms: number;
  status: "success" | "failed" | "low_confidence";
  feedback?: "like" | "dislike";
  created_at: string;
}

// ---- Aggregated stats for overview ----

export interface OverviewStats {
  total_conversations_today: number;
  total_conversations_yesterday: number;
  unique_users_today: number;
  avg_response_time_ms: number;
}

export interface HourlyVolume {
  hour: string; // "08:00"
  count: number;
}

export interface TopQuestion {
  question: string;
  count: number;
}

// ---- RAG Quality ----

export interface RAGQualityStats {
  avg_similarity_score: number;
  avg_docs_per_query: number;
  similarity_distribution: SimilarityBucket[];
  positive_feedback_ratio: number;
  total_feedback: number;
}

export interface SimilarityBucket {
  range: string; // "0.0-0.2"
  count: number;
}

export interface LowScoreQuestion {
  id: string;
  question: string;
  similarity_score: number;
  created_at: string;
}

// ---- System Health ----

export type ServiceStatus = "online" | "degraded" | "offline";

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  latency_ms: number;
  last_checked: string;
}

export interface LatencyBreakdown {
  retrieval_ms: number;
  generation_ms: number;
  total_ms: number;
}

export interface ErrorLog {
  id: string;
  service: string;
  message: string;
  created_at: string;
}

// ---- Knowledge Base ----

export interface KnowledgeDoc {
  id: string;
  filename: string;
  size_bytes: number;
  chunks: number;
  indexed_at: string;
}
