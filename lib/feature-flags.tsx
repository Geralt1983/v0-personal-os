/**
 * Feature Flags System for LifeOS
 *
 * Provides a type-safe way to manage feature rollout and A/B testing.
 * Flags can be configured via environment variables or runtime overrides.
 */

import React from "react"

export type FeatureFlag =
  | "ENABLE_HABITS"
  | "ENABLE_PROJECTS"
  | "ENABLE_GOALS"
  | "ENABLE_CALENDAR_SYNC"
  | "ENABLE_NOTION_SYNC"
  | "ENABLE_AI_INSIGHTS"
  | "ENABLE_DARK_MODE_TOGGLE"
  | "ENABLE_OFFLINE_MODE"
  | "ENABLE_PUSH_NOTIFICATIONS"
  | "ENABLE_ANALYTICS"

interface FeatureConfig {
  defaultValue: boolean
  description: string
  /** Environment variable to check */
  envVar?: string
  /** Percentage rollout (0-100) */
  rolloutPercentage?: number
}

const featureConfigs: Record<FeatureFlag, FeatureConfig> = {
  ENABLE_HABITS: {
    defaultValue: false,
    description: "Enable the habits tracking module",
    envVar: "NEXT_PUBLIC_ENABLE_HABITS",
  },
  ENABLE_PROJECTS: {
    defaultValue: false,
    description: "Enable the projects management module",
    envVar: "NEXT_PUBLIC_ENABLE_PROJECTS",
  },
  ENABLE_GOALS: {
    defaultValue: false,
    description: "Enable the goals tracking module",
    envVar: "NEXT_PUBLIC_ENABLE_GOALS",
  },
  ENABLE_CALENDAR_SYNC: {
    defaultValue: false,
    description: "Enable Google Calendar integration",
    envVar: "NEXT_PUBLIC_ENABLE_CALENDAR_SYNC",
  },
  ENABLE_NOTION_SYNC: {
    defaultValue: false,
    description: "Enable Notion integration",
    envVar: "NEXT_PUBLIC_ENABLE_NOTION_SYNC",
  },
  ENABLE_AI_INSIGHTS: {
    defaultValue: false,
    description: "Enable AI-powered insights and suggestions",
    envVar: "NEXT_PUBLIC_ENABLE_AI_INSIGHTS",
  },
  ENABLE_DARK_MODE_TOGGLE: {
    defaultValue: false,
    description: "Show dark mode toggle in settings",
    envVar: "NEXT_PUBLIC_ENABLE_DARK_MODE_TOGGLE",
  },
  ENABLE_OFFLINE_MODE: {
    defaultValue: true,
    description: "Enable offline support with service worker",
    envVar: "NEXT_PUBLIC_ENABLE_OFFLINE_MODE",
  },
  ENABLE_PUSH_NOTIFICATIONS: {
    defaultValue: false,
    description: "Enable push notifications",
    envVar: "NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS",
  },
  ENABLE_ANALYTICS: {
    defaultValue: process.env.NODE_ENV === "production",
    description: "Enable analytics tracking",
    envVar: "NEXT_PUBLIC_ENABLE_ANALYTICS",
  },
}

// Runtime overrides storage
const runtimeOverrides: Partial<Record<FeatureFlag, boolean>> = {}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Check runtime overrides first
  if (flag in runtimeOverrides) {
    return runtimeOverrides[flag]!
  }

  const config = featureConfigs[flag]

  // Check environment variable
  if (config.envVar && typeof window !== "undefined") {
    const envValue = process.env[config.envVar]
    if (envValue !== undefined) {
      return envValue === "true" || envValue === "1"
    }
  }

  // Check rollout percentage
  if (config.rolloutPercentage !== undefined) {
    return isInRollout(flag, config.rolloutPercentage)
  }

  return config.defaultValue
}

/**
 * Override a feature flag at runtime (useful for testing/debugging)
 */
export function setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
  runtimeOverrides[flag] = enabled
}

/**
 * Clear a runtime override
 */
export function clearFeatureFlag(flag: FeatureFlag): void {
  delete runtimeOverrides[flag]
}

/**
 * Clear all runtime overrides
 */
export function clearAllFeatureFlags(): void {
  Object.keys(runtimeOverrides).forEach((key) => {
    delete runtimeOverrides[key as FeatureFlag]
  })
}

/**
 * Get all feature flags and their current states
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>
  for (const flag of Object.keys(featureConfigs) as FeatureFlag[]) {
    flags[flag] = isFeatureEnabled(flag)
  }
  return flags
}

/**
 * Get feature flag configuration
 */
export function getFeatureFlagConfig(flag: FeatureFlag): FeatureConfig {
  return featureConfigs[flag]
}

/**
 * Deterministic rollout based on a stable identifier
 * Uses a simple hash to ensure consistent assignment
 */
function isInRollout(flag: FeatureFlag, percentage: number): boolean {
  if (typeof window === "undefined") return false

  // Use localStorage for stable user assignment
  const storageKey = `lifeos_rollout_${flag}`
  let userRoll = localStorage.getItem(storageKey)

  if (userRoll === null) {
    userRoll = String(Math.random() * 100)
    localStorage.setItem(storageKey, userRoll)
  }

  return parseFloat(userRoll) < percentage
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  // In a real implementation, this could be reactive
  // For now, we just return the current value
  return isFeatureEnabled(flag)
}

/**
 * HOC for feature-gated components
 */
export function withFeatureFlag<P extends object>(
  flag: FeatureFlag,
  Component: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    if (isFeatureEnabled(flag)) {
      return <Component {...props} />
    }
    return FallbackComponent ? <FallbackComponent {...props} /> : null
  }
}
