"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, User, Bot, ChevronRight } from "lucide-react"
import type { Task, SubTask } from "@/lib/types"
import { cantDoOptions, breakdownSubtasks } from "@/lib/mock-data"

interface AiDialogueModalProps {
  task: Task
  onClose: () => void
  onSelectSubtask: (subtask: SubTask) => void
}

type DialogueStep = "initial" | "options" | "breakdown"

interface Message {
  role: "user" | "ai"
  content: string
}

export function AiDialogueModal({ task, onClose, onSelectSubtask }: AiDialogueModalProps) {
  const [step, setStep] = useState<DialogueStep>("initial")
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: "I can't do this right now" },
    { role: "ai", content: "I understand. What's blocking you?" },
  ])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const handleOptionSelect = (option: { id: string; label: string }) => {
    setSelectedOption(option.id)
    setMessages((prev) => [
      ...prev,
      { role: "user", content: option.label },
      {
        role: "ai",
        content:
          option.id === "1"
            ? "Got it. Let me break this down into smaller steps:"
            : `Understood. Let me suggest some alternatives for "${task.title}".`,
      },
    ])
    setStep("breakdown")
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ backdropFilter: "blur(0px)" }}
        animate={{ backdropFilter: "blur(30px)" }}
        exit={{ backdropFilter: "blur(0px)" }}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-t-3xl sm:rounded-3xl glass-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-secondary truncate">Task: {task.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-overlay transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === "user" ? "gradient-primary text-bg-base" : "glass-card-sm text-text-primary"
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.role === "ai" && <Bot className="w-4 h-4 mt-0.5 text-accent-cyan" />}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.role === "user" && <User className="w-4 h-4 mt-0.5" />}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Options */}
          {step === "initial" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2 mt-4"
            >
              {cantDoOptions.map((option) => (
                <motion.button
                  key={option.id}
                  onClick={() => handleOptionSelect(option)}
                  className="w-full px-4 py-3 rounded-xl glass-card-sm text-left text-sm text-text-primary hover:bg-bg-overlay transition-colors flex items-center justify-between group"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span>
                    {option.id}. {option.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent-cyan transition-colors" />
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Subtask Breakdown */}
          {step === "breakdown" && selectedOption === "1" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3 mt-4"
            >
              {breakdownSubtasks.map((subtask, index) => (
                <motion.div
                  key={subtask.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="px-4 py-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${
                      index === 0
                        ? "rgba(0, 255, 136, 0.1)"
                        : index === 1
                          ? "rgba(0, 132, 255, 0.1)"
                          : "rgba(167, 139, 250, 0.1)"
                    }, transparent)`,
                    borderLeft: `3px solid ${index === 0 ? "#00ff88" : index === 1 ? "#0084ff" : "#a78bfa"}`,
                  }}
                >
                  <p className="text-sm font-medium text-text-primary">
                    Step {index + 1}: {subtask.title}
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">{subtask.estimatedMinutes} minutes</p>
                </motion.div>
              ))}

              <p className="text-sm text-text-secondary mt-4">Can you do Step 1 now?</p>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <motion.button
                  onClick={() => onSelectSubtask(breakdownSubtasks[0])}
                  className="py-3 rounded-xl gradient-success text-bg-base font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Yes, do Step 1
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="py-3 rounded-xl glass-card-sm text-text-secondary font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  No, skip
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
