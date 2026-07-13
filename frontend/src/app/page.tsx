"use client";

import { useEffect, useState } from "react";
import {
  MessageCircle,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import StatCard from "@/components/stat-card";
import {
  fetchOverview,
  fetchHourly,
  fetchTopQuestions,
  type OverviewStats,
  type HourlyVolume,
  type TopQuestion,
} from "@/lib/api";

export default function OverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [hourly, setHourly] = useState<HourlyVolume[]>([]);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, h, t] = await Promise.all([
          fetchOverview(),
          fetchHourly(),
          fetchTopQuestions(5),
        ]);
        setStats(s);
        setHourly(h);
        setTopQuestions(t);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-zinc-500">Memuat data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <p className="text-red-500">{error || "Gagal memuat data"}</p>
      </div>
    );
  }

  const pctChange =
    stats.total_conversations_yesterday > 0
      ? (
          ((stats.total_conversations_today - stats.total_conversations_yesterday) /
            stats.total_conversations_yesterday) *
          100
        ).toFixed(0)
      : "0";

  const successRate = stats.total_conversations_today > 0
    ? Math.round(
        ((stats.total_conversations_today - 0) / Math.max(stats.total_conversations_today, 1)) * 100
      )
    : 0;

  // Filter hourly to only show hours with data (non-zero)
  const hourlyWithData = hourly.filter((h) => h.count > 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Overview
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Ringkasan performa chatbot hari ini
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Conversations Today"
          value={stats.total_conversations_today}
          subtitle={`vs ${stats.total_conversations_yesterday} yesterday`}
          icon={MessageCircle}
          trend={Number(pctChange) >= 0 ? "up" : "down"}
          trendValue={`${pctChange}% vs yesterday`}
        />
        <StatCard
          title="Unique Users"
          value={stats.unique_users_today}
          subtitle="Active senders today"
          icon={Users}
        />
        <StatCard
          title="Avg Response Time"
          value={`${(stats.avg_response_time_ms / 1000).toFixed(1)}s`}
          subtitle={`${Math.round(stats.avg_response_time_ms)}ms`}
          icon={Clock}
        />
        <StatCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle="Successful responses"
          icon={TrendingUp}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Hourly volume — line chart */}
        <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Chat Volume per Hour
          </h2>
          {hourlyWithData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#18181b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#18181b" }}
                  activeDot={{ r: 5 }}
                  name="Messages"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-400 text-sm py-12 text-center">
              Belum ada data chat hari ini
            </p>
          )}
        </div>

        {/* Top questions — bar chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Top Questions
          </h2>
          {topQuestions.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={topQuestions}
                layout="vertical"
                margin={{ left: 0, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="question"
                  type="category"
                  width={140}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) =>
                    v.length > 22 ? v.slice(0, 22) + "…" : v
                  }
                />
                <Tooltip />
                <Bar dataKey="count" fill="#52525b" radius={[0, 4, 4, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-400 text-sm py-12 text-center">
              Belum ada data pertanyaan
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
