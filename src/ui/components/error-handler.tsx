"use client";

import { useEffect } from "react";

/**
 * Global error handler for unhandled promise rejections
 */
export function ErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent the default console error
      event.preventDefault();

      console.error("Unhandled promise rejection:", event);
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return null;
}
