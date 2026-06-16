"use client";

import {
  Activity,
  BookOpen,
  Bot,
  ChartNoAxesCombined,
  ClipboardList,
  Cpu,
  Database,
  FileText,
  LifeBuoy,
  MessageSquare,
  Settings,
  ShieldCheck,
  Ticket,
  Users
} from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/admin", label: "Dashboard", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/models", label: "Models", icon: Cpu },
  { href: "/admin/bots", label: "Bots", icon: Bot },
  { href: "/admin/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/admin/test", label: "Test", icon: MessageSquare },
  { href: "/admin/embed", label: "Embed", icon: FileText },
  { href: "/admin/conversations", label: "Conversations", icon: ClipboardList },
  { href: "/admin/tickets", label: "Tickets", icon: Ticket },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin/system", label: "System", icon: Database },
  { href: "/admin/audit-log", label: "Audit Log", icon: ShieldCheck },
  { href: "/admin/backups", label: "Backups", icon: LifeBuoy }
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={clsx("mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition", {
              "bg-emerald-50 text-la-green ring-1 ring-emerald-100": active,
              "text-slate-700 hover:bg-la-surface hover:text-ink": !active
            })}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
