"use client";

import { Upload, FileText, HardDrive, Layers, RefreshCw } from "lucide-react";
import { mockKnowledgeDocs } from "@/lib/mock-data";

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + " MB";
  if (bytes >= 1_000) return (bytes / 1_000).toFixed(0) + " KB";
  return bytes + " B";
}

export default function KnowledgeBasePage() {
  const totalChunks = mockKnowledgeDocs.reduce((s, d) => s + d.chunks, 0);
  const totalSize = mockKnowledgeDocs.reduce((s, d) => s + d.size_bytes, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Knowledge Base
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manajemen dokumen sumber untuk RAG
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            <Upload size={16} />
            Upload Document
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <RefreshCw size={16} />
            Re-index All
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <FileText size={18} className="text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Documents</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {mockKnowledgeDocs.length}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Layers size={18} className="text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Chunks</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalChunks}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <HardDrive size={18} className="text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">Total Size</p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatBytes(totalSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Indexed Documents
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Filename
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Size
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Chunks
              </th>
              <th className="text-left px-4 py-3 font-semibold text-zinc-600 dark:text-zinc-400">
                Indexed At
              </th>
            </tr>
          </thead>
          <tbody>
            {mockKnowledgeDocs.map((doc) => (
              <tr
                key={doc.id}
                className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                  {doc.filename}
                </td>
                <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                  {formatBytes(doc.size_bytes)}
                </td>
                <td className="px-4 py-3 text-zinc-500">{doc.chunks}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">
                  {new Date(doc.indexed_at).toLocaleString("id-ID")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
