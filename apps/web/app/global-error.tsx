"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — renders when the root layout itself fails.
 *
 * IMPORTANT: This page renders its own <html>/<body> and CSS may NOT be loaded.
 * All styling MUST use inline styles, not Tailwind classes.
 */
export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps): React.ReactElement {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: "#ffffff",
          color: "#171717",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            textAlign: "center",
            maxWidth: "480px",
          }}
        >
          {/* Error Icon */}
          <div
            style={{
              marginBottom: "32px",
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          {/* Error Message */}
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "16px",
              margin: "0 0 16px 0",
            }}
          >
            Critical Error
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#525252",
              marginBottom: "32px",
              lineHeight: 1.5,
            }}
          >
            A critical error has occurred. This page couldn&apos;t load
            properly.
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === "development" && error.message && (
            <div
              style={{
                marginBottom: "24px",
                maxWidth: "100%",
                overflow: "auto",
                borderRadius: "8px",
                backgroundColor: "#f5f5f5",
                padding: "16px",
                textAlign: "left",
              }}
            >
              <code style={{ fontSize: "14px", color: "#dc2626" }}>
                {error.message}
              </code>
              {error.digest && (
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#737373",
                  }}
                >
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "8px",
                backgroundColor: "#6366f1",
                padding: "10px 20px",
                color: "#ffffff",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "8px",
                border: "1px solid #d4d4d4",
                padding: "10px 20px",
                color: "#171717",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
