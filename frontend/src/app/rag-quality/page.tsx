"use client";

import { BarChart2, FileText, ThumbsUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import StatCard from "@/components/stat-card";
import {
  mockRAGQualityStats,
  mockSimilarityDistribution,
  mockLowScoreQuestions,
} from "@/lib/mock-data";

export default function RAGQualityPage() {
  const stats = mockRAGQualityStats;
  const barColors = ["#fca5a5", "#fbbf24", "#fde68a", "#86efac", "#4ade80"];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          RAG Quality
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Evaluasi kualitas retrieval-augmented generation
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Avg Similarity Score"
          value={(stats.avg_similarity_score * 100).toFixed(0) + "%"}
          subtitle={`Target: ≥70%`}
          icon={BarChart2}
        />
        <StatCard
          title="Avg Docs per Query"
          value={stats.avg_docs_per_query.toFixed(1)}
          subtitle="Documents retrieved per question"
          icon={FileText}
        />
        <StatCard
          title="Positive Feedback"
          value={(stats.positive_feedback_ratio * 100).toFixed(0) + "%"}
          subtitle={`From ${stats.total_feedback} ratings`}
          icon={ThumbsUp}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Similarity distribution */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Similarity Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockSimilarityDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Queries" radius={[4, 4, 0, 0]}>
                {mockSimilarityDistribution.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low-score questions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Low-Score Questions
          </h2>
          <p className="text-xs text-zinc-400 mb-3">
            Questions with similarity score below threshold — candidates for knowledge base improvement
          </p>
          <div className="space-y-2.5">
            {mockLowScoreQuestions.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
              >
                <div className="min-w-0">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {item.question}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {(item.similarity_score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
