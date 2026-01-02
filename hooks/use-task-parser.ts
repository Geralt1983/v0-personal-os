"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface ParsedTask {
  title: string
  description: string | null
  priority: "high" | "medium" | "low"
  energy: "peak" | "normal" | "low"
  estimatedMinutes: 15 | 25 | 45 | 60 | 90
  deadline: string | null
}

export interface ParseResult {
  task: ParsedTask
  confidence: {
    overall: number
    fields: {
      priority: number
      energy: number
      time: number
      deadline: number
    }
  }
  reasoning: string
  additionalTasksDetected: string[]
}

export function useTaskParser() {
  const [isParsing, setIsParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const parseTask = useCallback(
    async (
      input: string,
      inputType: "voice" | "text" | "title" = "text"
    ): Promise<ParseResult | null> => {
      if (!input.trim()) {
        setParseResult(null)
        return null
      }

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      setIsParsing(true)
      setError(null)
      console.log("[TaskParser] Starting parse for:", input.substring(0, 30) + "...")

      try {
        const response = await fetch("/api/ai/parse-task", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input,
            inputType,
            context: {
              currentTime: new Date().toISOString(),
              userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[TaskParser] API error:", response.status, errorText)
          throw new Error("Failed to parse task")
        }

        const result: ParseResult = await response.json()
        console.log("[TaskParser] Success! Result:", result.task.title)
        setParseResult(result)
        return result
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[TaskParser] Request aborted (user kept typing)")
          return null
        }
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error("[TaskParser] Error:", errorMessage)
        setError(errorMessage)
        return null
      } finally {
        setIsParsing(false)
      }
    },
    []
  )

  // Debounced version for real-time typing
  const debouncedParse = useCallback(
    (input: string, delay: number = 500) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      if (!input.trim()) {
        setParseResult(null)
        return
      }

      console.log("[TaskParser] Debounce started, will parse in", delay, "ms")
      debounceTimerRef.current = setTimeout(() => {
        console.log("[TaskParser] Debounce fired, calling parseTask")
        parseTask(input, "text")
      }, delay)
    },
    [parseTask]
  )

  // Immediate version for voice input
  const parseVoice = useCallback(
    (transcript: string) => parseTask(transcript, "voice"),
    [parseTask]
  )

  // Parse title-only input
  const parseTitle = useCallback(
    (title: string) => parseTask(title, "title"),
    [parseTask]
  )

  const clearResult = useCallback(() => {
    setParseResult(null)
    setError(null)
  }, [])

  const cancelParsing = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsParsing(false)
  }, [])

  return {
    isParsing,
    parseResult,
    error,
    parseTask,
    debouncedParse,
    parseVoice,
    parseTitle,
    clearResult,
    cancelParsing,
  }
}
