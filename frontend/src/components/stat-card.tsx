import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  trendValue?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <p
              className={`text-xs font-medium ${
                trend === "up"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon size={20} className="text-zinc-600 dark:text-zinc-400" />
        </div>
      </div>
    </div>
  );
}
