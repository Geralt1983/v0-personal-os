"use client"

import { Home, Plus, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  activeScreen: "home" | "capture" | "decisions" | "task-detail"
  onNavigate: (screen: "home" | "capture" | "decisions") => void
}

export function Navigation({ activeScreen, onNavigate }: NavigationProps) {
  const items = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "capture" as const, icon: Plus, label: "Capture" },
    { id: "decisions" as const, icon: ListTodo, label: "Decide" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-3 px-6">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id || (activeScreen === "task-detail" && item.id === "home")
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-150 relative",
                isActive ? "text-foreground scale-105" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-foreground")} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-foreground rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
