"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Login page doesn't need auth
    if (pathname === "/login") {
      // If already logged in, redirect to home
      if (isAuthenticated()) {
        router.replace("/");
      }
      setReady(true);
      return;
    }

    // All other pages need auth
    if (!isAuthenticated()) {
      router.replace("/login");
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;

  // Don't render sidebar on login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return <>{children}</>;
}
