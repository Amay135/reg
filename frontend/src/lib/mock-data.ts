import type {
  ChatLog,
  OverviewStats,
  HourlyVolume,
  TopQuestion,
  RAGQualityStats,
  SimilarityBucket,
  LowScoreQuestion,
  ServiceHealth,
  LatencyBreakdown,
  ErrorLog,
  KnowledgeDoc,
} from "./types";

// ---- Overview Stats ----

export const mockOverviewStats: OverviewStats = {
  total_conversations_today: 142,
  total_conversations_yesterday: 118,
  unique_users_today: 37,
  avg_response_time_ms: 4200,
};

export const mockHourlyVolume: HourlyVolume[] = [
  { hour: "00:00", count: 2 },
  { hour: "02:00", count: 1 },
  { hour: "04:00", count: 0 },
  { hour: "06:00", count: 5 },
  { hour: "08:00", count: 18 },
  { hour: "10:00", count: 27 },
  { hour: "12:00", count: 22 },
  { hour: "14:00", count: 25 },
  { hour: "16:00", count: 19 },
  { hour: "18:00", count: 12 },
  { hour: "20:00", count: 8 },
  { hour: "22:00", count: 3 },
];

export const mockTopQuestions: TopQuestion[] = [
  { question: "Apa syarat pendaftaran mahasiswa baru?", count: 14 },
  { question: "Kapan jadwal ujian akhir semester?", count: 11 },
  { question: "Bagaimana cara mengajukan cuti akademik?", count: 9 },
  { question: "Berapa biaya SPP per semester?", count: 8 },
  { question: "Apa saja dokumen untuk beasiswa?", count: 7 },
];

// ---- Chat Logs ----

export const mockChatLogs: ChatLog[] = Array.from({ length: 25 }, (_, i) => {
  const statuses: ChatLog["status"][] = ["success", "failed", "low_confidence"];
  const status = statuses[i % 3];
  const hour = String(8 + Math.floor(i / 2)).padStart(2, "0");
  const minute = String((i * 7) % 60).padStart(2, "0");

  return {
    id: `log-${String(i + 1).padStart(4, "0")}`,
    sender: `62812${String(1000 + i * 137).slice(0, 4)}${String(9000 + i * 53).slice(0, 4)}`,
    question: [
      "Apa syarat pendaftaran mahasiswa baru?",
      "Kapan jadwal ujian akhir semester ganjil?",
      "Bagaimana cara mengajukan cuti akademik?",
      "Berapa biaya SPP untuk program sarjana?",
      "Apa saja dokumen yang diperlukan untuk beasiswa?",
      "Dimana lokasi kampus utama?",
      "Bagaimana prosedur penggantian KTM yang hilang?",
      "Apakah ada program pertukaran pelajar?",
      "Kapan batas akhir pembayaran UKT?",
      "Bagaimana cara mengakses e-learning?",
    ][i % 10],
    answer: [
      "Syarat pendaftaran mahasiswa baru meliputi: (1) Ijazah SMA/sederajat, (2) Kartu Keluarga, (3) KTP orang tua, (4) Pas foto 3x4, (5) Bukti pembayaran pendaftaran.",
      "Ujian akhir semester ganjil akan dilaksanakan pada tanggal 15-26 Januari 2026 sesuai kalender akademik.",
      "Cuti akademik dapat diajukan melalui portal mahasiswa dengan mengisi formulir cuti dan melampirkan surat keterangan yang relevan.",
      "Biaya SPP program sarjana bervariasi antara Rp 2.500.000 - Rp 5.000.000 per semester tergantung program studi.",
      "Dokumen yang diperlukan untuk pengajuan beasiswa: transkrip nilai, surat keterangan tidak mampu, KTM, dan esai motivasi.",
      "Kampus utama berlokasi di Jl. Pendidikan No. 123, Kota, dengan akses transportasi umum yang memadai.",
      "Untuk mengganti KTM yang hilang, silakan mengajukan surat kehilangan dari kepolisian dan mengisi formulir di bagian akademik.",
      "Ya, tersedia program pertukaran pelajar ke beberapa universitas mitra di Asia Tenggara dan Eropa.",
      "Batas akhir pembayaran UKT adalah tanggal 10 setiap bulannya. Keterlambatan dikenakan denda 2%.",
      "E-learning dapat diakses melalui https://elearning.kampus.ac.id menggunakan NIM dan password SSO.",
    ][i % 10],
    retrieved_docs: [
      { doc_id: "doc-001", content: "Pedoman Akademik 2025/2026 - Bab Pendaftaran...", similarity_score: 0.87 },
      { doc_id: "doc-002", content: "Kalender Akademik - Jadwal UAS...", similarity_score: 0.92 },
    ],
    response_time_ms: 2500 + Math.floor(Math.random() * 6000),
    status,
    feedback: i % 5 === 0 ? "like" : i % 7 === 0 ? "dislike" : undefined,
    created_at: `2026-07-10T${hour}:${minute}:00Z`,
  };
});

// ---- RAG Quality ----

export const mockSimilarityDistribution: SimilarityBucket[] = [
  { range: "0.0–0.2", count: 3 },
  { range: "0.2–0.4", count: 8 },
  { range: "0.4–0.6", count: 22 },
  { range: "0.6–0.8", count: 41 },
  { range: "0.8–1.0", count: 26 },
];

export const mockRAGQualityStats = {
  avg_similarity_score: 0.78,
  avg_docs_per_query: 2.3,
  positive_feedback_ratio: 0.72,
  total_feedback: 85,
  similarity_distribution: mockSimilarityDistribution,
} satisfies RAGQualityStats;

export const mockLowScoreQuestions: LowScoreQuestion[] = [
  { id: "log-0003", question: "Apakah boleh menggunakan sandal ke kampus?", similarity_score: 0.32, created_at: "2026-07-10T09:15:00Z" },
  { id: "log-0007", question: "Di mana tempat fotokopi terdekat?", similarity_score: 0.28, created_at: "2026-07-10T10:30:00Z" },
  { id: "log-0012", question: "Ada info magang terbaru?", similarity_score: 0.41, created_at: "2026-07-10T13:45:00Z" },
  { id: "log-0019", question: "Kantin tutup jam berapa?", similarity_score: 0.35, created_at: "2026-07-10T15:20:00Z" },
  { id: "log-0023", question: "Besok libur tidak?", similarity_score: 0.19, created_at: "2026-07-10T17:00:00Z" },
];

// ---- System Health ----

export const mockServices: ServiceHealth[] = [
  { name: "WA Gateway", status: "online", latency_ms: 120, last_checked: "2026-07-10T18:00:00Z" },
  { name: "Backend RAG", status: "online", latency_ms: 45, last_checked: "2026-07-10T18:00:00Z" },
  { name: "Vector DB", status: "online", latency_ms: 15, last_checked: "2026-07-10T18:00:00Z" },
  { name: "LLM API", status: "degraded", latency_ms: 820, last_checked: "2026-07-10T18:00:00Z" },
];

export const mockLatencyBreakdown: LatencyBreakdown = {
  retrieval_ms: 320,
  generation_ms: 3800,
  total_ms: 4200,
};

export const mockErrorLogs: ErrorLog[] = [
  { id: "err-01", service: "WA Gateway", message: "Connection timeout after 30s — reconnecting", created_at: "2026-07-10T17:45:00Z" },
  { id: "err-02", service: "LLM API", message: "Rate limit exceeded — retry in 5s", created_at: "2026-07-10T17:30:00Z" },
  { id: "err-03", service: "Vector DB", message: "Slow query detected (>500ms) on similarity search", created_at: "2026-07-10T16:15:00Z" },
  { id: "err-04", service: "WA Gateway", message: "QR code expired — waiting for new scan", created_at: "2026-07-10T15:00:00Z" },
];

// ---- Knowledge Base ----

export const mockKnowledgeDocs: KnowledgeDoc[] = [
  { id: "kb-01", filename: "pedoman-akademik-2025.pdf", size_bytes: 2_400_000, chunks: 156, indexed_at: "2026-07-08T10:30:00Z" },
  { id: "kb-02", filename: "kalender-akademik-2025-2026.pdf", size_bytes: 850_000, chunks: 42, indexed_at: "2026-07-08T10:35:00Z" },
  { id: "kb-03", filename: "peraturan-akademik.pdf", size_bytes: 3_200_000, chunks: 210, indexed_at: "2026-07-08T11:00:00Z" },
  { id: "kb-04", filename: "panduan-beasiswa.pdf", size_bytes: 1_100_000, chunks: 68, indexed_at: "2026-07-09T08:15:00Z" },
  { id: "kb-05", filename: "faq-kemahasiswaan.pdf", size_bytes: 620_000, chunks: 35, indexed_at: "2026-07-09T08:20:00Z" },
  { id: "kb-06", filename: "skripsi-template.docx", size_bytes: 180_000, chunks: 12, indexed_at: "2026-07-09T14:00:00Z" },
];
