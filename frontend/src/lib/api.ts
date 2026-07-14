// ---- API Client ----
// Base URL & Token Management

const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ---- Generic fetch with auth ----

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { detail?: string }).detail || `Request failed (${res.status})`,
      res.status
    );
  }

  return res;
}

// ---- Auth ----

export async function login(
  email: string,
  password: string
): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { detail?: string }).detail || "Login failed",
      res.status
    );
  }

  const data = await res.json();
  setToken(data.access_token);
  return data;
}

// ---- Types (mirrors backend schemas) ----

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
  feedback?: "like" | "dislike" | null;
  created_at: string;
}

export interface ChatLogListResponse {
  total: number;
  page: number;
  limit: number;
  logs: ChatLog[];
}

export interface OverviewStats {
  total_conversations_today: number;
  total_conversations_yesterday: number;
  unique_users_today: number;
  avg_response_time_ms: number;
}

export interface HourlyVolume {
  hour: string;
  count: number;
}

export interface TopQuestion {
  question: string;
  count: number;
}

export interface ServiceHealth {
  name: string;
  status: string;
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

export interface SimilarityBucket {
  range: string;
  count: number;
}

export interface RAGQualityStats {
  avg_similarity_score: number;
  avg_docs_per_query: number;
  similarity_distribution: SimilarityBucket[];
  positive_feedback_ratio: number;
  total_feedback: number;
}

export interface LowScoreQuestion {
  id: string;
  question: string;
  similarity_score: number;
  created_at: string;
}

export interface KnowledgeDoc {
  id: string;
  filename: string;
  size_bytes: number;
  chunks: number;
  indexed_at: string | null;
}

export interface KnowledgeListResponse {
  total: number;
  docs: KnowledgeDoc[];
}

// ---- Stats API ----

export async function fetchOverview(): Promise<OverviewStats> {
  const res = await fetchWithAuth("/stats/overview");
  return res.json();
}

export async function fetchHourly(): Promise<HourlyVolume[]> {
  const res = await fetchWithAuth("/stats/hourly");
  return res.json();
}

export async function fetchTopQuestions(limit = 5): Promise<TopQuestion[]> {
  const res = await fetchWithAuth(`/stats/top-questions?limit=${limit}`);
  return res.json();
}

// ---- Logs API ----

export async function fetchLogs(params: {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<ChatLogListResponse> {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("search", params.search);
  if (params.status) searchParams.set("status", params.status);
  if (params.date_from) searchParams.set("date_from", params.date_from);
  if (params.date_to) searchParams.set("date_to", params.date_to);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const res = await fetchWithAuth(`/logs${qs ? `?${qs}` : ""}`);
  return res.json();
}

// ---- Health API ----

export async function fetchServices(): Promise<ServiceHealth[]> {
  const res = await fetchWithAuth("/health/services");
  return res.json();
}

export async function fetchLatency(): Promise<LatencyBreakdown> {
  const res = await fetchWithAuth("/health/latency");
  return res.json();
}

export async function fetchErrors(limit = 20): Promise<ErrorLog[]> {
  const res = await fetchWithAuth(`/health/errors?limit=${limit}`);
  return res.json();
}

// ---- RAG Quality API ----

export async function fetchRAGQuality(): Promise<RAGQualityStats> {
  const res = await fetchWithAuth("/rag/quality");
  return res.json();
}

export async function fetchLowScoreQuestions(
  limit = 10,
  threshold = 0.5
): Promise<LowScoreQuestion[]> {
  const res = await fetchWithAuth(
    `/rag/low-score?limit=${limit}&threshold=${threshold}`
  );
  return res.json();
}

// ---- Knowledge API ----

export async function fetchDocuments(): Promise<KnowledgeListResponse> {
  const res = await fetchWithAuth("/knowledge");
  return res.json();
}

export async function uploadDocument(file: File): Promise<unknown> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/knowledge/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { detail?: string }).detail || "Upload failed",
      res.status
    );
  }

  return res.json();
}

export async function deleteDocument(id: string): Promise<{ message: string }> {
  const res = await fetchWithAuth(`/knowledge/${id}`, { method: "DELETE" });
  return res.json();
}

export async function reindexAll(): Promise<{
  message: string;
  total_docs: number;
  total_chunks: number;
}> {
  const res = await fetchWithAuth("/knowledge/reindex", { method: "POST" });
  return res.json();
}
