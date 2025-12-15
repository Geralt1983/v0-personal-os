"use client"

import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import { VoiceWaveformBars } from "./voice-waveform-bars"

interface VoiceOrbProps {
  isListening: boolean
  audioLevel: number
  onTap: () => void
  visualizationType?: "orb" | "bars" | "both"
}

export function VoiceOrb({ isListening, audioLevel, onTap, visualizationType = "orb" }: VoiceOrbProps) {
  if (visualizationType === "bars") {
    return (
      <div className="flex flex-col items-center gap-4">
        <VoiceWaveformBars audioLevel={audioLevel} isActive={isListening} barCount={7} />
        <button
          onClick={onTap}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg focus:outline-none hover:scale-105 transition-transform"
        >
          <Mic className="w-6 h-6 text-white" fill={isListening ? "currentColor" : "none"} />
        </button>
      </div>
    )
  }

  if (visualizationType === "both") {
    return (
      <div className="flex flex-col items-center gap-6">
        <button onClick={onTap} className="relative w-32 h-32 flex items-center justify-center focus:outline-none">
          {/* Outer glow rings */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.2 + audioLevel * 0.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1.1, 1.4 + audioLevel * 0.4, 1.1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 0.7,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              />
            </>
          )}

          {/* Core orb */}
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg relative z-10"
            animate={{
              scale: isListening ? [1, 1.05 + audioLevel * 0.1, 1] : 1,
              boxShadow: isListening
                ? [
                    "0 0 20px rgba(167,139,250,0.5)",
                    `0 0 ${30 + audioLevel * 20}px rgba(167,139,250,0.7)`,
                    "0 0 20px rgba(167,139,250,0.5)",
                  ]
                : "0 0 10px rgba(167,139,250,0.3)",
            }}
            transition={{
              duration: 0.3,
              repeat: isListening ? Number.POSITIVE_INFINITY : 0,
              ease: "easeInOut",
            }}
          >
            <Mic className="w-8 h-8 text-white" fill={isListening ? "currentColor" : "none"} />
          </motion.div>
        </button>

        <VoiceWaveformBars audioLevel={audioLevel} isActive={isListening} barCount={7} />
      </div>
    )
  }

  // Default orb visualization
  return (
    <button onClick={onTap} className="relative w-32 h-32 flex items-center justify-center focus:outline-none">
      {/* Outer glow rings */}
      {isListening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2 + audioLevel * 0.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1.1, 1.4 + audioLevel * 0.4, 1.1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 0.7,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </>
      )}

      {/* Core orb */}
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg relative z-10"
        animate={{
          scale: isListening ? [1, 1.05 + audioLevel * 0.1, 1] : 1,
          boxShadow: isListening
            ? [
                "0 0 20px rgba(167,139,250,0.5)",
                `0 0 ${30 + audioLevel * 20}px rgba(167,139,250,0.7)`,
                "0 0 20px rgba(167,139,250,0.5)",
              ]
            : "0 0 10px rgba(167,139,250,0.3)",
        }}
        transition={{
          duration: 0.3,
          repeat: isListening ? Number.POSITIVE_INFINITY : 0,
          ease: "easeInOut",
        }}
      >
        <Mic className="w-8 h-8 text-white" fill={isListening ? "currentColor" : "none"} />
      </motion.div>
    </button>
  )
}
