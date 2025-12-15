"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAudioLevel } from "@/hooks/use-audio-level"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import { VoiceOrb } from "./voice-orb"
import { VoiceConfirmationCard } from "./voice-confirmation-card"

type State = "idle" | "listening" | "processing" | "confirm" | "success"

interface ParsedReminder {
  task: string
  date: string | null
  time: string | null
  relative: string | null
}

interface VoiceReminderScreenProps {
  onClose: () => void
  onAddTask: (task: string, date?: string, time?: string) => void
}

export function VoiceReminderScreen({ onClose, onAddTask }: VoiceReminderScreenProps) {
  const [state, setState] = useState<State>("idle")
  const [transcript, setTranscript] = useState("")
  const [parsed, setParsed] = useState<ParsedReminder | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { audioLevel, startAnalyser, stopAnalyser } = useAudioLevel()
  const { startRecording, stopRecording } = useVoiceRecorder()

  const handleStart = async () => {
    try {
      setError(null)
      setState("listening")
      const stream = await startRecording()
      await startAnalyser(stream)
    } catch (err) {
      console.error("Failed to start recording:", err)
      setError("Microphone access denied")
      setState("idle")
    }
  }

  const handleStop = async () => {
    setState("processing")
    stopAnalyser()

    try {
      const audioBlob = await stopRecording()

      // 1. Transcribe with Whisper
      const formData = new FormData()
      formData.append("file", audioBlob, "audio.webm")

      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!transcriptionResponse.ok) {
        throw new Error("Transcription failed")
      }

      const { text } = await transcriptionResponse.json()
      setTranscript(text)

      // 2. Parse with GPT
      const parseResponse = await fetch("/api/parse-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!parseResponse.ok) {
        throw new Error("Parsing failed")
      }

      const parsedData = await parseResponse.json()
      setParsed(parsedData)
      setState("confirm")
    } catch (err) {
      console.error("Voice processing error:", err)
      setError("Failed to process voice input")
      setState("idle")
    }
  }

  const handleConfirm = () => {
    if (parsed) {
      setState("success")
      // Format the date/time for the task
      const dateTime = parsed.date || parsed.relative || undefined
      onAddTask(parsed.task, dateTime, parsed.time || undefined)

      // Show success briefly then close
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  const handleCancel = () => {
    setState("idle")
    setTranscript("")
    setParsed(null)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-[#0a0f16] z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h1 className="text-lg font-semibold text-white">Voice Reminder</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <p className="text-slate-400 mb-8">{error || "Tap to add a reminder"}</p>
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              <VoiceOrb isListening={false} audioLevel={0} onTap={handleStart} visualizationType="orb" />
              <p className="text-slate-500 text-xs mt-6 max-w-xs">
                Say something like "Remind me to submit invoice tomorrow at 2pm"
              </p>
            </motion.div>
          )}

          {state === "listening" && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <p className="text-purple-400 mb-8 font-medium">Listening...</p>
              <VoiceOrb isListening={true} audioLevel={audioLevel} onTap={handleStop} visualizationType="both" />
              <p className="text-slate-500 text-xs mt-6">Tap again when finished</p>
            </motion.div>
          )}

          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-slate-400 mb-8">Processing...</p>
              <motion.div
                className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-purple-400" />
              </motion.div>
              {transcript && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 text-slate-400 text-sm max-w-xs italic"
                >
                  "{transcript}"
                </motion.p>
              )}
            </motion.div>
          )}

          {state === "confirm" && parsed && (
            <VoiceConfirmationCard
              key="confirm"
              original={transcript}
              parsed={parsed}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}

          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <p className="text-emerald-400 font-medium">Reminder added!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
