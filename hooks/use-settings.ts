"use client"

import { useState, useEffect, useCallback } from "react"

// Settings types
export interface UserSettings {
  // Focus settings
  defaultFocusDuration: number // minutes
  defaultBreakDuration: number // minutes
  autoStartBreaks: boolean
  showTrustScore: boolean
  showStreak: boolean

  // AI settings
  taskPrioritization: "balanced" | "aggressive" | "conservative"
  aiReasoningStyle: "concise" | "detailed" | "minimal"
  voiceInputEnabled: boolean

  // Notification settings
  pushNotificationsEnabled: boolean
  dailyRemindersEnabled: boolean
  dailyReminderTime: string // HH:mm format
  weeklySummary: boolean

  // Appearance settings
  theme: "dark" | "light" | "system"
  accentColor: "cyan" | "purple" | "green" | "orange" | "pink"
  reduceAnimations: boolean

  // Celebration settings
  celebrationSound: boolean
  celebrationHaptic: boolean
  celebrationConfetti: boolean

  // Profile (stored locally for now)
  displayName: string
  email: string
}

const defaultSettings: UserSettings = {
  // Focus settings
  defaultFocusDuration: 25,
  defaultBreakDuration: 5,
  autoStartBreaks: false,
  showTrustScore: true,
  showStreak: true,

  // AI settings
  taskPrioritization: "balanced",
  aiReasoningStyle: "concise",
  voiceInputEnabled: true,

  // Notification settings
  pushNotificationsEnabled: false,
  dailyRemindersEnabled: false,
  dailyReminderTime: "09:00",
  weeklySummary: false,

  // Appearance settings
  theme: "dark",
  accentColor: "cyan",
  reduceAnimations: false,

  // Celebration settings
  celebrationSound: true,
  celebrationHaptic: true,
  celebrationConfetti: true,

  // Profile
  displayName: "",
  email: "",
}

const SETTINGS_KEY = "lifeos_settings"

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem(SETTINGS_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Merge with defaults to handle new settings
          setSettings({ ...defaultSettings, ...parsed })
        } else {
          // Check for legacy individual settings
          const legacySettings = loadLegacySettings()
          if (Object.keys(legacySettings).length > 0) {
            const merged = { ...defaultSettings, ...legacySettings }
            setSettings(merged)
            // Migrate to new format
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
      setIsLoaded(true)
    }

    loadSettings()
  }, [])

  // Load legacy individual localStorage settings
  const loadLegacySettings = (): Partial<UserSettings> => {
    const legacy: Partial<UserSettings> = {}

    const booleanKeys = [
      "autoStartBreaks",
      "showTrustScore",
      "showStreak",
      "weeklySummary",
      "reduceAnimations",
    ]

    booleanKeys.forEach((key) => {
      const value = localStorage.getItem(key)
      if (value !== null) {
        ;(legacy as Record<string, boolean>)[key] = value === "true"
      }
    })

    // Celebration settings with different localStorage keys
    const celebrationSound = localStorage.getItem("celebrationSound")
    const celebrationHaptic = localStorage.getItem("celebrationHaptic")
    const celebrationConfetti = localStorage.getItem("celebrationConfetti")

    if (celebrationSound !== null) legacy.celebrationSound = celebrationSound === "true"
    if (celebrationHaptic !== null) legacy.celebrationHaptic = celebrationHaptic === "true"
    if (celebrationConfetti !== null) legacy.celebrationConfetti = celebrationConfetti === "true"

    return legacy
  }

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))

      // Also update legacy keys for backward compatibility
      if (typeof value === "boolean") {
        const legacyKey = key === "celebrationSound" || key === "celebrationHaptic" || key === "celebrationConfetti"
          ? key
          : key
        localStorage.setItem(legacyKey, value.toString())
      }

      return updated
    })
  }, [])

  // Update multiple settings at once
  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Reset all settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings))
  }, [])

  // Get accent color CSS value
  const getAccentColorValue = useCallback(() => {
    const colorMap: Record<UserSettings["accentColor"], string> = {
      cyan: "#06b6d4",
      purple: "#a855f7",
      green: "#22c55e",
      orange: "#f97316",
      pink: "#ec4899",
    }
    return colorMap[settings.accentColor]
  }, [settings.accentColor])

  return {
    settings,
    isLoaded,
    updateSetting,
    updateSettings,
    resetSettings,
    getAccentColorValue,
  }
}

// Accent color options for UI
export const accentColorOptions = [
  { value: "cyan" as const, label: "Cyan", color: "#06b6d4" },
  { value: "purple" as const, label: "Purple", color: "#a855f7" },
  { value: "green" as const, label: "Green", color: "#22c55e" },
  { value: "orange" as const, label: "Orange", color: "#f97316" },
  { value: "pink" as const, label: "Pink", color: "#ec4899" },
]

// Theme options for UI
export const themeOptions = [
  { value: "dark" as const, label: "Dark" },
  { value: "light" as const, label: "Light" },
  { value: "system" as const, label: "System" },
]

// AI reasoning style options
export const aiReasoningOptions = [
  { value: "minimal" as const, label: "Minimal", description: "Brief, action-focused suggestions" },
  { value: "concise" as const, label: "Concise", description: "Balanced explanations" },
  { value: "detailed" as const, label: "Detailed", description: "In-depth reasoning shown" },
]

// Task prioritization options
export const prioritizationOptions = [
  { value: "conservative" as const, label: "Conservative", description: "Stick to your order" },
  { value: "balanced" as const, label: "Balanced", description: "Smart suggestions" },
  { value: "aggressive" as const, label: "Aggressive", description: "Optimize heavily" },
]
