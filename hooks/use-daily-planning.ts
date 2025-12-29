"use client"

import { useState, useEffect } from "react"

export function useDailyPlanning() {
  const [shouldShowPlanning, setShouldShowPlanning] = useState(false)
  const [userEnergyLevel, setUserEnergyLevel] = useState<"peak" | "medium" | "low" | null>(null)

  useEffect(() => {
    const lastPlanningDate = localStorage.getItem("lastPlanningDate")
    const today = new Date().toDateString()

    if (lastPlanningDate !== today) {
      const timer = setTimeout(() => {
        setShouldShowPlanning(true)
      }, 500)

      return () => clearTimeout(timer)
    }

    const savedEnergy = localStorage.getItem("todayEnergyLevel")
    if (savedEnergy) {
      setUserEnergyLevel(savedEnergy as "peak" | "medium" | "low")
    }
    return undefined
  }, [])

  const completePlanning = (energyLevel: "peak" | "medium" | "low") => {
    const today = new Date().toDateString()
    localStorage.setItem("lastPlanningDate", today)
    localStorage.setItem("todayEnergyLevel", energyLevel)
    setUserEnergyLevel(energyLevel)
    setShouldShowPlanning(false)
  }

  const dismissPlanning = () => {
    setShouldShowPlanning(false)
  }

  const resetPlanning = () => {
    localStorage.removeItem("lastPlanningDate")
    localStorage.removeItem("todayEnergyLevel")
    setUserEnergyLevel(null)
    setShouldShowPlanning(true)
  }

  return {
    shouldShowPlanning,
    userEnergyLevel,
    completePlanning,
    dismissPlanning,
    resetPlanning,
    setUserEnergyLevel,
  }
}
