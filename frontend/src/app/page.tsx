"use client";

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
  mockOverviewStats,
  mockHourlyVolume,
  mockTopQuestions,
} from "@/lib/mock-data";

export default function OverviewPage() {
  const stats = mockOverviewStats;
  const pctChange =
    stats.total_conversations_yesterday > 0
      ? (
          ((stats.total_conversations_today - stats.total_conversations_yesterday) /
            stats.total_conversations_yesterday) *
          100
        ).toFixed(0)
      : "0";

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
          subtitle={`${stats.avg_response_time_ms}ms`}
          icon={Clock}
        />
        <StatCard
          title="Success Rate"
          value="87%"
          subtitle="Successful responses"
          icon={TrendingUp}
          trend="up"
          trendValue="3% vs yesterday"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Hourly volume — line chart */}
        <div className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Chat Volume per Hour
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockHourlyVolume}>
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
        </div>

        {/* Top questions — bar chart */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Top Questions
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={mockTopQuestions}
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
        </div>
      </div>
    </div>
  );
}
