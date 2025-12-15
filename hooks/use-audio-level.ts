"use client"

import { useRef, useState } from "react"

export function useAudioLevel() {
  const [audioLevel, setAudioLevel] = useState(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext | null>(null)

  const startAnalyser = async (stream: MediaStream) => {
    const audioContext = new AudioContext()
    audioContextRef.current = audioContext
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255) // Normalize to 0-1
        animationRef.current = requestAnimationFrame(updateLevel)
      }
    }

    updateLevel()
  }

  const stopAnalyser = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    setAudioLevel(0)
  }

  return { audioLevel, startAnalyser, stopAnalyser }
}
