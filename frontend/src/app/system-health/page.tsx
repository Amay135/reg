"use client";

import { Activity, Server, Wifi, Database, Cpu } from "lucide-react";
import {
  mockServices,
  mockLatencyBreakdown,
  mockErrorLogs,
} from "@/lib/mock-data";
import type { ServiceStatus } from "@/lib/types";

const iconMap: Record<string, typeof Server> = {
  "WA Gateway": Wifi,
  "Backend RAG": Server,
  "Vector DB": Database,
  "LLM API": Cpu,
};

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    online: "bg-emerald-500",
    degraded: "bg-amber-500",
    offline: "bg-red-500",
  };
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} animate-pulse`}
    />
  );
}

function StatusLabel({ status }: { status: ServiceStatus }) {
  const labels: Record<ServiceStatus, string> = {
    online: "Online",
    degraded: "Degraded",
    offline: "Offline",
  };
  const colors: Record<ServiceStatus, string> = {
    online: "text-emerald-600 dark:text-emerald-400",
    degraded: "text-amber-600 dark:text-amber-400",
    offline: "text-red-600 dark:text-red-400",
  };
  return (
    <span className={`text-xs font-semibold ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function SystemHealthPage() {
  const latency = mockLatencyBreakdown;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          System Health
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Status kesehatan tiap service dan latensi
        </p>
      </div>

      {/* Service status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {mockServices.map((svc) => {
          const Icon = iconMap[svc.name] || Server;
          return (
            <div
              key={svc.name}
              className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <Icon size={18} className="text-zinc-600 dark:text-zinc-400" />
                </div>
                <StatusDot status={svc.status} />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {svc.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusLabel status={svc.status} />
                <span className="text-xs text-zinc-400">
                  {svc.latency_ms}ms
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">
                Last checked:{" "}
                {new Date(svc.last_checked).toLocaleTimeString("id-ID")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Latency breakdown */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Latency Breakdown (Average)
        </h2>
        <div className="space-y-3">
          <LatencyBar label="Retrieval" ms={latency.retrieval_ms} max={latency.total_ms} />
          <LatencyBar label="Generation" ms={latency.generation_ms} max={latency.total_ms} />
          <LatencyBar label="Total" ms={latency.total_ms} max={latency.total_ms} />
        </div>
      </div>

      {/* Error logs */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Recent Error Logs
          </h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {mockErrorLogs.map((err) => (
            <div key={err.id} className="px-5 py-3 text-sm">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {err.service}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(err.created_at).toLocaleString("id-ID")}
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">{err.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LatencyBar({
  label,
  ms,
  max,
}: {
  label: string;
  ms: number;
  max: number;
}) {
  const pct = max > 0 ? (ms / max) * 100 : 0;
  const isTotal = label === "Total";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-sm ${
            isTotal
              ? "font-semibold text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {label}
        </span>
        <span className="text-sm font-mono text-zinc-500">{ms}ms</span>
      </div>
      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isTotal ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-400 dark:bg-zinc-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
