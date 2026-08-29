"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";

const tabs = [
  { href: "/", label: "New order" },
  { href: "/orders", label: "Orders" },
  { href: "/products", label: "Products" },
  { href: "/people", label: "People" },
];

export default function Nav() {
  const pathname = usePathname();
  const { logout, user } = useAuth() || {};

  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-ledger/60">
            Order Book
          </p>
        </div>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  active
                    ? "bg-ledger text-white"
                    : "text-ink/70 hover:bg-paper"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={logout}
              className="ml-2 px-3 py-1.5 rounded-md text-sm text-ink/50 hover:text-brick transition"
              title={user.email}
            >
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
