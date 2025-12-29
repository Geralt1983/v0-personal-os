"use client"

import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to console in case logger fails
    console.error("[LifeOS] Critical error:", error.message, error.digest)
  }, [error])

  return (
    <html>
      <body style={{
        backgroundColor: "#0a0f16",
        color: "white",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        margin: 0,
        padding: "1rem"
      }}>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 1.5rem",
            borderRadius: "50%",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f87171"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
            A critical error occurred. Please try again.
          </p>

          <button
            onClick={reset}
            style={{
              backgroundColor: "#0891b2",
              color: "white",
              border: "none",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
              marginRight: "0.5rem"
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              backgroundColor: "transparent",
              color: "#94a3b8",
              border: "1px solid #475569",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Go Home
          </button>
        </div>
      </body>
    </html>
  )
}
