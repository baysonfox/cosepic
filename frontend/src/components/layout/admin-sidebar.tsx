"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FolderKanban,
  Grid3X3,
  LayoutDashboard,
  Package,
  Sparkles,
  Tags,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/imports", label: "Imports", icon: Upload },
  { href: "/admin/packs", label: "Packs", icon: Package },
  { href: "/admin/cosers", label: "Cosers", icon: Users },
  { href: "/admin/works", label: "Works", icon: BookOpen },
  { href: "/admin/characters", label: "Characters", icon: Sparkles },
  { href: "/admin/outfits", label: "Outfits", icon: Grid3X3 },
  { href: "/admin/tags", label: "Tags", icon: Tags },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-background p-4">
      <div className="mb-6 px-3">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to browse
        </Link>
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <FolderKanban className="h-5 w-5" />
          Admin
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={isActive(item.href)}
          />
        ))}
      </nav>
    </aside>
  );
}
