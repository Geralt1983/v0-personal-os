/**
 * LifeOS AI Service Layer
 *
 * Centralized AI service with Claude as the primary model.
 * Provides type-safe interfaces for all AI operations.
 */

// Core service
export { aiService, getModel } from "./service"
export type { AIProvider } from "./service"

// Voice-to-action pipeline
export {
  transcribeAudio,
  detectIntent,
  processVoiceInput,
  voiceToAction,
} from "./voice"
export type { VoiceIntent, VoiceAction, TranscriptionResult } from "./voice"

// Proactive suggestions
export {
  generateSuggestions,
  getSuggestionForContext,
} from "./suggestions"
export type { Suggestion, SuggestionType, UserState, TaskData } from "./suggestions"

// Types
export type {
  TaskAnalysis,
  MicroStep,
  TaskBreakdown,
  ReminderParsed,
  DailyReview,
  TaskPrioritization,
  EnergyLevel,
  TaskContext,
  PatternInsight,
  UserContext,
  PrioritizationResult,
} from "./types"
