"use client";

import type { ChatLog, RetrievedDoc } from "@/lib/types";
import { X, ThumbsUp, ThumbsDown } from "lucide-react";

interface ChatDetailModalProps {
  log: ChatLog;
  onClose: () => void;
}

export default function ChatDetailModal({ log, onClose }: ChatDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-t-xl">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Conversation Detail
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-500">Sender</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {maskPhone(log.sender)}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Time</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {new Date(log.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Response Time</span>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {(log.response_time_ms / 1000).toFixed(1)}s
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Status</span>
              <p>
                <StatusBadge status={log.status} />
              </p>
            </div>
            {log.feedback && (
              <div>
                <span className="text-zinc-500">Feedback</span>
                <p className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  {log.feedback === "like" ? (
                    <>
                      <ThumbsUp size={14} className="text-emerald-500" /> Like
                    </>
                  ) : (
                    <>
                      <ThumbsDown size={14} className="text-red-500" /> Dislike
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Question */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Question
            </h3>
            <p className="text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-sm leading-relaxed">
              {log.question}
            </p>
          </div>

          {/* Answer */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Answer
            </h3>
            <p className="text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-sm leading-relaxed">
              {log.answer}
            </p>
          </div>

          {/* Retrieved Documents */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Retrieved Documents ({log.retrieved_docs.length})
            </h3>
            <div className="space-y-2">
              {log.retrieved_docs.map((doc: RetrievedDoc, i: number) => (
                <div
                  key={i}
                  className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-500">
                      {doc.doc_id}
                    </span>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      Score: {(doc.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                    {doc.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

export function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return phone.slice(0, 5) + "****" + phone.slice(-3);
}

export function StatusBadge({ status }: { status: ChatLog["status"] }) {
  const colors: Record<string, string> = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    low_confidence:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };
  const labels: Record<string, string> = {
    success: "Success",
    failed: "Failed",
    low_confidence: "Low Confidence",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}
