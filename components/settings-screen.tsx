"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  User,
  Cloud,
  Smartphone,
  Target,
  RotateCcw,
  TrendingUp,
  Flame,
  Brain,
  MessageCircle,
  Mic,
  Bell,
  Clock,
  Mail,
  Palette,
  Sparkles,
  HelpCircle,
  Send,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface SettingsScreenProps {
  onBack: () => void
  isDemo?: boolean
}

export function SettingsScreen({ onBack, isDemo = false }: SettingsScreenProps) {
  const [userEmail, setUserEmail] = useState("")
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [showTrustScore, setShowTrustScore] = useState(true)
  const [showStreak, setShowStreak] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(false)
  const [reduceAnimations, setReduceAnimations] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [confettiEnabled, setConfettiEnabled] = useState(true)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const loadSettings = async () => {
      if (!isDemo) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email || "")
        }
      } else {
        setUserEmail("demo@lifeos.app")
      }

      // Load settings from localStorage
      const savedAutoBreaks = localStorage.getItem("autoStartBreaks")
      const savedShowTrust = localStorage.getItem("showTrustScore")
      const savedShowStreak = localStorage.getItem("showStreak")
      const savedWeekly = localStorage.getItem("weeklySummary")
      const savedAnimations = localStorage.getItem("reduceAnimations")
      const savedSound = localStorage.getItem("celebrationSound")
      const savedHaptic = localStorage.getItem("celebrationHaptic")
      const savedConfetti = localStorage.getItem("celebrationConfetti")

      if (savedAutoBreaks) setAutoStartBreaks(savedAutoBreaks === "true")
      if (savedShowTrust) setShowTrustScore(savedShowTrust === "true")
      if (savedShowStreak) setShowStreak(savedShowStreak === "true")
      if (savedWeekly) setWeeklySummary(savedWeekly === "true")
      if (savedAnimations) setReduceAnimations(savedAnimations === "true")
      if (savedSound !== null) setSoundEnabled(savedSound === "true")
      if (savedHaptic !== null) setHapticEnabled(savedHaptic === "true")
      if (savedConfetti !== null) setConfettiEnabled(savedConfetti === "true")
    }

    loadSettings()
  }, [isDemo])

  const handleSignOut = async () => {
    if (isDemo) {
      localStorage.removeItem("lifeos_demo_mode")
      router.push("/auth/login")
    } else {
      await supabase.auth.signOut()
      router.push("/auth/login")
    }
  }

  const handleToggle = (key: string, value: boolean) => {
    localStorage.setItem(key, value.toString())
    switch (key) {
      case "autoStartBreaks":
        setAutoStartBreaks(value)
        break
      case "showTrustScore":
        setShowTrustScore(value)
        break
      case "showStreak":
        setShowStreak(value)
        break
      case "weeklySummary":
        setWeeklySummary(value)
        break
      case "reduceAnimations":
        setReduceAnimations(value)
        break
      case "celebrationSound":
        setSoundEnabled(value)
        break
      case "celebrationHaptic":
        setHapticEnabled(value)
        break
      case "celebrationConfetti":
        setConfettiEnabled(value)
        break
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0a0f16]/95 backdrop-blur-lg z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Settings</h1>
        <div className="w-16" />
      </header>

      <div className="px-5 space-y-6 mt-6">
        {/* Account Section */}
        <SettingsSection title="ACCOUNT">
          <SettingsRow icon={<User size={20} />} label="Profile" onClick={() => {}} />
          <SettingsRow icon={<Cloud size={20} />} label="Sync & Backup" onClick={() => {}} />
          <SettingsRow icon={<Smartphone size={20} />} label="Connected Devices" onClick={() => {}} />
        </SettingsSection>

        {/* Focus Section */}
        <SettingsSection title="FOCUS">
          <SettingsRow icon={<Target size={20} />} label="Default Durations" onClick={() => {}} />
          <SettingsRow
            icon={<RotateCcw size={20} />}
            label="Auto-start Breaks"
            toggle
            toggleValue={autoStartBreaks}
            onToggle={(val) => handleToggle("autoStartBreaks", val)}
          />
          <SettingsRow
            icon={<TrendingUp size={20} />}
            label="Show Trust Score"
            toggle
            toggleValue={showTrustScore}
            onToggle={(val) => handleToggle("showTrustScore", val)}
          />
          <SettingsRow
            icon={<Flame size={20} />}
            label="Show Streak"
            toggle
            toggleValue={showStreak}
            onToggle={(val) => handleToggle("showStreak", val)}
          />
        </SettingsSection>

        {/* AI & Intelligence Section */}
        <SettingsSection title="AI & INTELLIGENCE">
          <SettingsRow icon={<Brain size={20} />} label="Task Prioritization" onClick={() => {}} />
          <SettingsRow icon={<MessageCircle size={20} />} label="AI Reasoning Style" onClick={() => {}} />
          <SettingsRow icon={<Mic size={20} />} label="Voice Input" onClick={() => {}} />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="NOTIFICATIONS">
          <SettingsRow icon={<Bell size={20} />} label="Push Notifications" onClick={() => {}} />
          <SettingsRow icon={<Clock size={20} />} label="Daily Reminders" onClick={() => {}} />
          <SettingsRow
            icon={<Mail size={20} />}
            label="Weekly Summary"
            toggle
            toggleValue={weeklySummary}
            onToggle={(val) => handleToggle("weeklySummary", val)}
          />
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="APPEARANCE">
          <SettingsRow icon={<Palette size={20} />} label="Theme" value="Dark" onClick={() => {}} />
          <SettingsRow icon={<Sparkles size={20} />} label="Accent Color" value="Cyan" onClick={() => {}} />
          <SettingsRow
            icon={<Sparkles size={20} />}
            label="Reduce Animations"
            toggle
            toggleValue={reduceAnimations}
            onToggle={(val) => handleToggle("reduceAnimations", val)}
          />
        </SettingsSection>

        {/* Celebrations Section */}
        <SettingsSection title="CELEBRATIONS">
          <SettingsRow
            icon={<Sparkles size={20} />}
            label="Sound Effects"
            toggle
            toggleValue={soundEnabled}
            onToggle={(val) => handleToggle("celebrationSound", val)}
          />
          <SettingsRow
            icon={<Smartphone size={20} />}
            label="Haptic Feedback"
            toggle
            toggleValue={hapticEnabled}
            onToggle={(val) => handleToggle("celebrationHaptic", val)}
          />
          <SettingsRow
            icon={<Sparkles size={20} />}
            label="Confetti"
            toggle
            toggleValue={confettiEnabled}
            onToggle={(val) => handleToggle("celebrationConfetti", val)}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title="SUPPORT">
          <SettingsRow icon={<HelpCircle size={20} />} label="Help & FAQ" onClick={() => {}} />
          <SettingsRow icon={<Send size={20} />} label="Send Feedback" onClick={() => {}} />
          <SettingsRow icon={<FileText size={20} />} label="Privacy Policy" onClick={() => {}} />
          <SettingsRow icon={<FileText size={20} />} label="Terms of Service" onClick={() => {}} />
        </SettingsSection>

        {/* Sign Out */}
        <div className="pt-4">
          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            {isDemo ? "Exit Demo" : "Sign Out"}
          </button>
        </div>

        {/* Version */}
        <div className="text-center text-slate-600 pt-6">
          <p className="text-sm">Version 1.0.0</p>
          <p className="text-xs mt-1">Made with 🖤 for focus</p>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{title}</h2>
      <div className="bg-white/3 rounded-xl overflow-hidden divide-y divide-white/6">{children}</div>
    </motion.div>
  )
}

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  toggle,
  toggleValue,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (value: boolean) => void
}) {
  return (
    <button
      onClick={toggle ? undefined : onClick}
      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-white/8 transition-colors"
    >
      <span className="text-slate-400">{icon}</span>
      <span className="flex-1 text-left text-white">{label}</span>
      {toggle ? (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggle?.(!toggleValue)
          }}
          className={`relative w-11 h-6 rounded-full transition-colors ${toggleValue ? "bg-cyan-500" : "bg-white/10"}`}
        >
          <motion.div
            animate={{ x: toggleValue ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"
          />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {value && <span className="text-sm text-slate-400">{value}</span>}
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      )}
    </button>
  )
}
