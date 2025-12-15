"use client"

import type { Suggestion } from "@/lib/types"
import { Button } from "@/components/ui/button"

interface SuggestionsSectionProps {
  suggestions: Suggestion[]
  onAction: (suggestionId: string, action: string) => void
}

export function SuggestionsSection({ suggestions, onAction }: SuggestionsSectionProps) {
  if (suggestions.length === 0) return null

  return (
    <section>
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Suggested</h2>

      <div className="space-y-0">
        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.id}
            className={`bg-card border border-border p-4 flex items-start justify-between gap-4 ${
              index === 0 ? "rounded-t-xl" : ""
            } ${index === suggestions.length - 1 ? "rounded-b-xl" : "border-b-0"}`}
          >
            <p className="text-sm text-foreground leading-relaxed">{suggestion.text}</p>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" onClick={() => onAction(suggestion.id, "accept")}>
                {suggestion.actionLabel}
              </Button>
              <button
                onClick={() => onAction(suggestion.id, "dismiss")}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground px-2 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
