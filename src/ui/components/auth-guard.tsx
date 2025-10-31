"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/signin"];

/**
 * Global authentication guard
 * Redirects to sign-in if user is not authenticated
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

    // If not a public route and not authenticated, redirect to sign-in
    if (!isPublicRoute && !isAuthenticated()) {
      router.push("/signin");
    }

    // If on sign-in page and already authenticated, redirect to agents
    if (pathname === "/signin" && isAuthenticated()) {
      router.push("/agents");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
