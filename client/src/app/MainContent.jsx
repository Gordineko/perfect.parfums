"use client";

import { pathWithoutLocale } from "@shared/lib/localePath";
import { usePathname } from "next/navigation";

export default function MainContent({ children }) {
  const pathname = usePathname() ?? "";
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const isHome = pathWithoutLocale(normalized) === "/";

  return (
    <main className={`main${isHome ? " main--home" : " main--soft-bg"}`}>
      {children}
    </main>
  );
}

