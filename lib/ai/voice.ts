/**
 * Voice-to-Action Pipeline
 *
 * Handles voice transcription and converts spoken input into actionable tasks.
 * Uses Whisper for transcription and Claude for intent parsing.
 */

import { createLogger } from "@/lib/logger"
import { aiService } from "./service"
import type { TaskAnalysis, ReminderParsed } from "./types"

const logger = createLogger("Voice")

export type VoiceIntent =
  | "create_task"
  | "create_reminder"
  | "update_task"
  | "complete_task"
  | "ask_question"
  | "daily_planning"
  | "unknown"

export interface VoiceAction {
  intent: VoiceIntent
  confidence: number
  rawText: string
  parsedData: TaskAnalysis | ReminderParsed | { query: string } | null
  suggestedResponse: string
}

export interface TranscriptionResult {
  text: string
  duration?: number
  language?: string
}

/**
 * Transcribe audio using Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  logger.debug("Transcribing audio", { size: audioBlob.size, type: audioBlob.type })

  const formData = new FormData()
  formData.append("file", audioBlob, "audio.webm")
  formData.append("model", "whisper-1")
  formData.append("response_format", "verbose_json")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error("Whisper API error", { error, status: response.status })
    throw new Error(`Transcription failed: ${error}`)
  }

  const result = await response.json()

  return {
    text: result.text,
    duration: result.duration,
    language: result.language,
  }
}

/**
 * Detect intent from transcribed text
 */
export function detectIntent(text: string): { intent: VoiceIntent; confidence: number } {
  const lowerText = text.toLowerCase()

  // Task creation patterns
  const taskPatterns = [
    /^(add|create|new|make)\s+(a\s+)?(task|todo|item)/i,
    /^i\s+need\s+to/i,
    /^(remind|remember)\s+me\s+to/i,
    /^don'?t\s+forget\s+to/i,
    /^(put|add)\s+.+\s+on\s+(my\s+)?(list|todo)/i,
  ]

  // Reminder patterns
  const reminderPatterns = [
    /^remind\s+me/i,
    /^set\s+(a\s+)?reminder/i,
    /in\s+\d+\s+(minute|hour|day)/i,
    /at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i,
    /tomorrow|next\s+week|on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ]

  // Complete task patterns
  const completePatterns = [
    /^(mark|check|tick)\s+.+\s+(as\s+)?(done|complete|finished)/i,
    /^(i\s+)?(finished|completed|done\s+with)/i,
    /^complete\s+/i,
  ]

  // Question patterns
  const questionPatterns = [
    /^(what|how|when|where|why|who|which)/i,
    /\?$/,
    /^(show|list|tell)\s+me/i,
  ]

  // Daily planning patterns
  const planningPatterns = [
    /^(start|begin)\s+(my\s+)?day/i,
    /^(what('?s)?|show)\s+(my\s+)?(plan|schedule|tasks)/i,
    /^daily\s+(planning|review)/i,
  ]

  // Check patterns in order of specificity
  if (reminderPatterns.some((p) => p.test(lowerText))) {
    return { intent: "create_reminder", confidence: 0.9 }
  }

  if (completePatterns.some((p) => p.test(lowerText))) {
    return { intent: "complete_task", confidence: 0.85 }
  }

  if (planningPatterns.some((p) => p.test(lowerText))) {
    return { intent: "daily_planning", confidence: 0.9 }
  }

  if (questionPatterns.some((p) => p.test(lowerText))) {
    return { intent: "ask_question", confidence: 0.8 }
  }

  if (taskPatterns.some((p) => p.test(lowerText))) {
    return { intent: "create_task", confidence: 0.85 }
  }

  // Default: assume it's a task if it looks actionable
  const actionVerbs = /^(call|email|send|buy|fix|schedule|book|pay|pick\s+up|drop\s+off)/i
  if (actionVerbs.test(lowerText)) {
    return { intent: "create_task", confidence: 0.75 }
  }

  return { intent: "unknown", confidence: 0.5 }
}

/**
 * Process voice input into an actionable result
 */
export async function processVoiceInput(text: string): Promise<VoiceAction> {
  logger.debug("Processing voice input", { text })

  const { intent, confidence } = detectIntent(text)

  let parsedData: VoiceAction["parsedData"] = null
  let suggestedResponse = ""

  switch (intent) {
    case "create_task":
      parsedData = await aiService.analyzeTask(text)
      suggestedResponse = `Got it! I'll add "${(parsedData as TaskAnalysis).rewrittenTitle}" to your tasks.`
      break

    case "create_reminder":
      parsedData = await aiService.parseReminder(text)
      const reminder = parsedData as ReminderParsed
      suggestedResponse = `I'll remind you to "${reminder.task}"${reminder.date ? ` on ${reminder.date}` : ""}${reminder.time ? ` at ${reminder.time}` : ""}.`
      break

    case "complete_task":
      parsedData = { query: text }
      suggestedResponse = "Which task would you like to mark as complete?"
      break

    case "ask_question":
      parsedData = { query: text }
      suggestedResponse = "Let me help you with that..."
      break

    case "daily_planning":
      parsedData = { query: text }
      suggestedResponse = "Let's plan your day. Here are your top priorities..."
      break

    default:
      // Try to analyze as a task anyway
      parsedData = await aiService.analyzeTask(text)
      suggestedResponse = `I'm not sure what you meant. Did you want to add "${(parsedData as TaskAnalysis).rewrittenTitle}" as a task?`
  }

  return {
    intent,
    confidence,
    rawText: text,
    parsedData,
    suggestedResponse,
  }
}

/**
 * Full voice-to-action pipeline
 */
export async function voiceToAction(audioBlob: Blob): Promise<VoiceAction> {
  const transcription = await transcribeAudio(audioBlob)
  return processVoiceInput(transcription.text)
}
