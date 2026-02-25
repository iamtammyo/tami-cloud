"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./platform-icon";
import { mockAccounts } from "@/lib/mock-data";
import {
  LayoutDashboard,
  FileText,
  Wand2,
  BarChart3,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/generate", label: "Generate", icon: Wand2 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/accounts", label: "Accounts", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              T
            </div>
            <span className="font-semibold text-lg text-sidebar-foreground">Tami Cloud</span>
          </Link>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto">
            T
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Connected Accounts */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Accounts
            </span>
            <Link href="/accounts" className="p-1 rounded hover:bg-sidebar-accent">
              <Plus className="h-3 w-3 text-sidebar-foreground/50" />
            </Link>
          </div>
          <div className="space-y-2">
            {mockAccounts.map((account) => (
              <div key={account.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent">
                <PlatformIcon platform={account.provider} size="sm" />
                <span className="text-sm text-sidebar-foreground/80 truncate">{account.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
