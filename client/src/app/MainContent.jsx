"use client";

import { usePathname } from "next/navigation";

export default function MainContent({ locale, children }) {
  const pathname = usePathname() ?? "";
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const homePath = `/${locale}`;
  const isHome = normalized === homePath || normalized === "/";

  return (
    <main className={`main${isHome ? " main--home" : " main--soft-bg"}`}>
      {children}
    </main>
  );
}

