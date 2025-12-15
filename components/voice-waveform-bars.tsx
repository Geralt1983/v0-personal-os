"use client"

import { motion } from "framer-motion"

interface VoiceWaveformBarsProps {
  audioLevel: number
  isActive: boolean
  barCount?: number
}

export function VoiceWaveformBars({ audioLevel, isActive, barCount = 5 }: VoiceWaveformBarsProps) {
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Center bars are taller, edges shorter (bell curve)
    const centerIndex = Math.floor(barCount / 2)
    const distanceFromCenter = Math.abs(i - centerIndex)
    const baseHeight = 1 - (distanceFromCenter / centerIndex) * 0.4

    // Add slight phase offset for organic feel
    const phaseDelay = i * 0.05

    return {
      baseHeight,
      phaseDelay,
      id: i,
    }
  })

  return (
    <div className="flex items-center gap-1.5 h-12">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-full"
          style={{
            minHeight: "4px",
          }}
          animate={{
            height: isActive ? `${bar.baseHeight * 20 + audioLevel * 30}px` : `${bar.baseHeight * 8}px`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: bar.phaseDelay,
          }}
        />
      ))}
    </div>
  )
}
