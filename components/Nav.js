"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ListOrdered,
  Package,
  Wallet,
  Users,
  Settings,
  LogOut,
  BookOpenText,
} from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

const tabs = [
  { href: "/", label: "New order", icon: ClipboardList },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/products", label: "Products", icon: Package },
  { href: "/my-deposit", label: "My Deposit", icon: Wallet },
  { href: "/debtors", label: "Debtors", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Nav() {
  const pathname = usePathname();
  const { logout, user } = useAuth() || {};

  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <BookOpenText size={16} className="text-ledger/70" strokeWidth={1.75} />
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-ledger/60">
            FAITH SHOP MANAGEMENT SYSTEM
          </p>
        </div>
        <nav className="flex items-center gap-1 flex-wrap">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  active
                    ? "bg-ledger text-white"
                    : "text-ink/70 hover:bg-paper"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
                {t.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={logout}
              className="ml-2 flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-ink/50 hover:text-brick transition"
              title={user.email}
            >
              <LogOut size={14} /> Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
