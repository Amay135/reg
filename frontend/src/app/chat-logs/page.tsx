"use client";

import { useState, useMemo } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { mockChatLogs } from "@/lib/mock-data";
import ChatDetailModal, { maskPhone, StatusBadge } from "@/components/chat-detail-modal";
import type { ChatLog } from "@/lib/types";

export default function ChatLogsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

  const filtered = useMemo(() => {
    return mockChatLogs.filter((log) => {
      const matchSearch =
        !search ||
        log.question.toLowerCase().includes(search.toLowerCase()) ||
        log.answer.toLowerCase().includes(search.toLowerCase()) ||
        log.sender.includes(search);
      const matchStatus = statusFilter === "all" || log.status === statusFilter;
      const matchDateFrom =
        !dateFrom || new Date(log.created_at) >= new Date(dateFrom);
      const matchDateTo =
        !dateTo || new Date(log.created_at) <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [search, statusFilter, dateFrom, dateTo]);

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Chat Logs
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Riwayat seluruh percakapan chatbot
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search questions, answers, sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="all">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="low_confidence">Low Confidence</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          title="To date"
        />

        <span className="text-xs text-zinc-400">
          {filtered.length} of {mockChatLogs.length} logs
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Time
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Sender
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Question
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Status
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Resp. Time
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap text-xs">
                  {new Date(log.created_at).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                  {maskPhone(log.sender)}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                  {log.question}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={log.status} />
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {(log.response_time_ms / 1000).toFixed(1)}s
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                  No chat logs match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <ChatDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
