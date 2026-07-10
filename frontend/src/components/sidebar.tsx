"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquareText,
  BarChart3,
  Activity,
  Database,
  LogIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/chat-logs", label: "Chat Logs", icon: MessageSquareText },
  { href: "/rag-quality", label: "RAG Quality", icon: BarChart3 },
  { href: "/system-health", label: "System Health", icon: Activity },
  { href: "/knowledge-base", label: "Knowledge Base", icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`relative flex flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
              RAG Monitor
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              WhatsApp Chatbot
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
        <Link
          href="/login"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
            pathname === "/login"
              ? "bg-zinc-100 dark:bg-zinc-800"
              : ""
          }`}
          title={collapsed ? "Login" : undefined}
        >
          <LogIn size={18} className="shrink-0" />
          {!collapsed && <span>Admin Login</span>}
        </Link>
      </div>
    </aside>
  );
}
