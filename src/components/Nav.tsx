"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-[#2a3654] bg-[#0c1220]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2b657] text-[#e2b657]">
            8
          </span>
          <div>
            <div className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[#f0d48a]">
              Octave
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#9aa8c7]">
              Personal job assistant
            </div>
          </div>
        </Link>
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  active ? "bg-[#1b2540] text-[#f0d48a]" : "text-[#9aa8c7] hover:text-white",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={() => signOut({ callbackUrl: "/signin" })} className="ml-3 rounded-full border border-[#2a3654] px-3 py-1.5 text-sm text-[#9aa8c7] hover:text-white">
          Sign out
        </button>
      </div>
    </header>
  );
}
