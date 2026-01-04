"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  User,
  Cloud,
  Smartphone,
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
  ChevronRight,
  Check,
} from "lucide-react"
import {
  useSettings,
  accentColorOptions,
  themeOptions,
  aiReasoningOptions,
  prioritizationOptions,
  type UserSettings,
} from "@/hooks/use-settings"

interface SettingsScreenProps {
  onBack: () => void
}

type SubScreen =
  | "profile"
  | "sync"
  | "devices"
  | "prioritization"
  | "reasoning"
  | "reminders"
  | "theme"
  | "accent"
  | "help"
  | "feedback"
  | null

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const { settings, updateSetting, isLoaded } = useSettings()
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(null)

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0f16] text-white flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading settings...</div>
      </div>
    )
  }

  const handleToggle = (key: keyof UserSettings, value: boolean) => {
    updateSetting(key, value)
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] text-white pb-8">
      <AnimatePresence mode="wait">
        {activeSubScreen ? (
          <SubScreenRenderer
            key={activeSubScreen}
            screen={activeSubScreen}
            settings={settings}
            updateSetting={updateSetting}
            onBack={() => setActiveSubScreen(null)}
          />
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Header */}
            <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0a0f16]/95 backdrop-blur-lg z-10">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold">Settings</h1>
              <div className="w-16" />
            </header>

            <div className="px-5 space-y-6 mt-6">
              {/* Account Section */}
              <SettingsSection title="ACCOUNT">
                <SettingsRow
                  icon={<User size={20} />}
                  label="Profile"
                  value={settings.displayName || "Set up"}
                  onClick={() => setActiveSubScreen("profile")}
                />
                <SettingsRow
                  icon={<Cloud size={20} />}
                  label="Sync & Backup"
                  value="Local only"
                  onClick={() => setActiveSubScreen("sync")}
                />
                <SettingsRow
                  icon={<Smartphone size={20} />}
                  label="Connected Devices"
                  value="1 device"
                  onClick={() => setActiveSubScreen("devices")}
                />
              </SettingsSection>

              {/* Display Section */}
              <SettingsSection title="DISPLAY">
                <SettingsRow
                  icon={<TrendingUp size={20} />}
                  label="Show Trust Score"
                  toggle
                  toggleValue={settings.showTrustScore}
                  onToggle={(val) => handleToggle("showTrustScore", val)}
                />
                <SettingsRow
                  icon={<Flame size={20} />}
                  label="Show Streak"
                  toggle
                  toggleValue={settings.showStreak}
                  onToggle={(val) => handleToggle("showStreak", val)}
                />
              </SettingsSection>

              {/* AI & Intelligence Section */}
              <SettingsSection title="AI & INTELLIGENCE">
                <SettingsRow
                  icon={<Brain size={20} />}
                  label="Task Prioritization"
                  value={capitalize(settings.taskPrioritization)}
                  onClick={() => setActiveSubScreen("prioritization")}
                />
                <SettingsRow
                  icon={<MessageCircle size={20} />}
                  label="AI Reasoning Style"
                  value={capitalize(settings.aiReasoningStyle)}
                  onClick={() => setActiveSubScreen("reasoning")}
                />
                <SettingsRow
                  icon={<Mic size={20} />}
                  label="Voice Input"
                  toggle
                  toggleValue={settings.voiceInputEnabled}
                  onToggle={(val) => handleToggle("voiceInputEnabled", val)}
                />
              </SettingsSection>

              {/* Notifications Section */}
              <SettingsSection title="NOTIFICATIONS">
                <SettingsRow
                  icon={<Bell size={20} />}
                  label="Push Notifications"
                  toggle
                  toggleValue={settings.pushNotificationsEnabled}
                  onToggle={(val) => handleToggle("pushNotificationsEnabled", val)}
                />
                <SettingsRow
                  icon={<Clock size={20} />}
                  label="Daily Reminders"
                  value={settings.dailyRemindersEnabled ? settings.dailyReminderTime : "Off"}
                  onClick={() => setActiveSubScreen("reminders")}
                />
                <SettingsRow
                  icon={<Mail size={20} />}
                  label="Weekly Summary"
                  toggle
                  toggleValue={settings.weeklySummary}
                  onToggle={(val) => handleToggle("weeklySummary", val)}
                />
              </SettingsSection>

              {/* Appearance Section */}
              <SettingsSection title="APPEARANCE">
                <SettingsRow
                  icon={<Palette size={20} />}
                  label="Theme"
                  value={capitalize(settings.theme)}
                  onClick={() => setActiveSubScreen("theme")}
                />
                <SettingsRow
                  icon={<Sparkles size={20} />}
                  label="Accent Color"
                  value={capitalize(settings.accentColor)}
                  onClick={() => setActiveSubScreen("accent")}
                  colorPreview={accentColorOptions.find((c) => c.value === settings.accentColor)?.color}
                />
                <SettingsRow
                  icon={<Sparkles size={20} />}
                  label="Reduce Animations"
                  toggle
                  toggleValue={settings.reduceAnimations}
                  onToggle={(val) => handleToggle("reduceAnimations", val)}
                />
              </SettingsSection>

              {/* Celebrations Section */}
              <SettingsSection title="CELEBRATIONS">
                <SettingsRow
                  icon={<Sparkles size={20} />}
                  label="Sound Effects"
                  toggle
                  toggleValue={settings.celebrationSound}
                  onToggle={(val) => handleToggle("celebrationSound", val)}
                />
                <SettingsRow
                  icon={<Smartphone size={20} />}
                  label="Haptic Feedback"
                  toggle
                  toggleValue={settings.celebrationHaptic}
                  onToggle={(val) => handleToggle("celebrationHaptic", val)}
                />
                <SettingsRow
                  icon={<Sparkles size={20} />}
                  label="Confetti"
                  toggle
                  toggleValue={settings.celebrationConfetti}
                  onToggle={(val) => handleToggle("celebrationConfetti", val)}
                />
              </SettingsSection>

              {/* Support Section */}
              <SettingsSection title="SUPPORT">
                <SettingsRow
                  icon={<HelpCircle size={20} />}
                  label="Help & FAQ"
                  onClick={() => setActiveSubScreen("help")}
                />
                <SettingsRow
                  icon={<Send size={20} />}
                  label="Send Feedback"
                  onClick={() => setActiveSubScreen("feedback")}
                />
                <SettingsRow
                  icon={<FileText size={20} />}
                  label="Privacy Policy"
                  onClick={() => window.open("/privacy", "_blank")}
                />
                <SettingsRow
                  icon={<FileText size={20} />}
                  label="Terms of Service"
                  onClick={() => window.open("/terms", "_blank")}
                />
              </SettingsSection>

              {/* Version */}
              <div className="text-center text-slate-600 pt-6">
                <p className="text-sm">Version 1.0.0</p>
                <p className="text-xs mt-1">Made with 🖤 for focus</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Sub-screen renderer
function SubScreenRenderer({
  screen,
  settings,
  updateSetting,
  onBack,
}: {
  screen: SubScreen
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  switch (screen) {
    case "profile":
      return <ProfileScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "sync":
      return <SyncScreen onBack={onBack} />
    case "devices":
      return <DevicesScreen onBack={onBack} />
    case "prioritization":
      return <PrioritizationScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "reasoning":
      return <ReasoningScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "reminders":
      return <RemindersScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "theme":
      return <ThemeScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "accent":
      return <AccentScreen settings={settings} updateSetting={updateSetting} onBack={onBack} />
    case "help":
      return <HelpScreen onBack={onBack} />
    case "feedback":
      return <FeedbackScreen onBack={onBack} />
    default:
      return null
  }
}

// Profile sub-screen
function ProfileScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  const [name, setName] = useState(settings.displayName)
  const [email, setEmail] = useState(settings.email)

  const handleSave = () => {
    updateSetting("displayName", name)
    updateSetting("email", email)
    onBack()
  }

  return (
    <SubScreenLayout title="Profile" onBack={onBack} onSave={handleSave}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>
    </SubScreenLayout>
  )
}

// Sync sub-screen
function SyncScreen({ onBack }: { onBack: () => void }) {
  return (
    <SubScreenLayout title="Sync & Backup" onBack={onBack}>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <Cloud size={24} className="text-cyan-400" />
            <div>
              <h3 className="font-medium">Local Storage</h3>
              <p className="text-sm text-slate-400">Your data is stored on this device</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Cloud sync coming soon. Your tasks and settings are currently stored locally in your browser.
          </p>
        </div>
        <button className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors">
          Export Data (JSON)
        </button>
        <button className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white hover:bg-white/10 transition-colors">
          Import Data
        </button>
      </div>
    </SubScreenLayout>
  )
}

// Devices sub-screen
function DevicesScreen({ onBack }: { onBack: () => void }) {
  return (
    <SubScreenLayout title="Connected Devices" onBack={onBack}>
      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Smartphone size={24} className="text-cyan-400" />
            <div className="flex-1">
              <h3 className="font-medium">This Device</h3>
              <p className="text-sm text-slate-400">Current browser session</p>
            </div>
            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">Active</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 text-center">
          Multi-device sync coming soon. Currently, your data is only available on this device.
        </p>
      </div>
    </SubScreenLayout>
  )
}

// Prioritization sub-screen
function PrioritizationScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <SubScreenLayout title="Task Prioritization" onBack={onBack}>
      <div className="space-y-3">
        {prioritizationOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              updateSetting("taskPrioritization", option.value)
              onBack()
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              settings.taskPrioritization === option.value
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex-1 text-left">
              <h3 className="font-medium">{option.label}</h3>
              <p className="text-sm text-slate-400">{option.description}</p>
            </div>
            {settings.taskPrioritization === option.value && <Check size={20} className="text-cyan-400" />}
          </button>
        ))}
      </div>
    </SubScreenLayout>
  )
}

// Reasoning style sub-screen
function ReasoningScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <SubScreenLayout title="AI Reasoning Style" onBack={onBack}>
      <div className="space-y-3">
        {aiReasoningOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              updateSetting("aiReasoningStyle", option.value)
              onBack()
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              settings.aiReasoningStyle === option.value
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <div className="flex-1 text-left">
              <h3 className="font-medium">{option.label}</h3>
              <p className="text-sm text-slate-400">{option.description}</p>
            </div>
            {settings.aiReasoningStyle === option.value && <Check size={20} className="text-cyan-400" />}
          </button>
        ))}
      </div>
    </SubScreenLayout>
  )
}

// Reminders sub-screen
function RemindersScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  const [enabled, setEnabled] = useState(settings.dailyRemindersEnabled)
  const [time, setTime] = useState(settings.dailyReminderTime)

  const handleSave = () => {
    updateSetting("dailyRemindersEnabled", enabled)
    updateSetting("dailyReminderTime", time)
    onBack()
  }

  return (
    <SubScreenLayout title="Daily Reminders" onBack={onBack} onSave={handleSave}>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <span>Enable Daily Reminders</span>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-white/10"}`}
          >
            <motion.div
              animate={{ x: enabled ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"
            />
          </button>
        </div>
        {enabled && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Reminder Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}
      </div>
    </SubScreenLayout>
  )
}

// Theme sub-screen
function ThemeScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <SubScreenLayout title="Theme" onBack={onBack}>
      <div className="space-y-3">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              updateSetting("theme", option.value)
              onBack()
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
              settings.theme === option.value
                ? "bg-cyan-500/10 border-cyan-500/30"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            }`}
          >
            <span className="flex-1 text-left">{option.label}</span>
            {settings.theme === option.value && <Check size={20} className="text-cyan-400" />}
          </button>
        ))}
        <p className="text-sm text-slate-500 text-center pt-2">
          Light theme coming soon. Currently only dark mode is available.
        </p>
      </div>
    </SubScreenLayout>
  )
}

// Accent color sub-screen
function AccentScreen({
  settings,
  updateSetting,
  onBack,
}: {
  settings: UserSettings
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void
  onBack: () => void
}) {
  return (
    <SubScreenLayout title="Accent Color" onBack={onBack}>
      <div className="grid grid-cols-5 gap-3">
        {accentColorOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              updateSetting("accentColor", option.value)
              onBack()
            }}
            className={`aspect-square rounded-xl border-2 transition-all ${
              settings.accentColor === option.value ? "border-white scale-110" : "border-transparent"
            }`}
            style={{ backgroundColor: option.color }}
          >
            {settings.accentColor === option.value && (
              <Check size={20} className="mx-auto text-white drop-shadow-md" />
            )}
          </button>
        ))}
      </div>
      <div className="text-center mt-4">
        <span className="text-slate-400">{capitalize(settings.accentColor)}</span>
      </div>
    </SubScreenLayout>
  )
}

// Help sub-screen
function HelpScreen({ onBack }: { onBack: () => void }) {
  const faqs = [
    {
      q: "How does the AI task parser work?",
      a: "Type a natural description of your task and the AI will extract the title, priority, energy level, and estimated duration.",
    },
    {
      q: "What is the Trust Score?",
      a: "The Trust Score reflects how consistently you complete tasks you commit to. Higher scores unlock more features.",
    },
    {
      q: "How do streaks work?",
      a: "Complete at least one task every day to maintain your streak. Missing a day resets it.",
    },
    {
      q: "Is my data synced to the cloud?",
      a: "Not yet. Currently, all data is stored locally in your browser. Cloud sync is coming soon.",
    },
  ]

  return (
    <SubScreenLayout title="Help & FAQ" onBack={onBack}>
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-medium mb-2">{faq.q}</h3>
            <p className="text-sm text-slate-400">{faq.a}</p>
          </div>
        ))}
      </div>
    </SubScreenLayout>
  )
}

// Feedback sub-screen
function FeedbackScreen({ onBack }: { onBack: () => void }) {
  const [feedback, setFeedback] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (feedback.trim()) {
      // In a real app, this would send to a server
      console.log("Feedback submitted:", feedback)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <SubScreenLayout title="Send Feedback" onBack={onBack}>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">Thank you!</h3>
          <p className="text-slate-400">Your feedback helps us improve LifeOS.</p>
        </div>
      </SubScreenLayout>
    )
  }

  return (
    <SubScreenLayout title="Send Feedback" onBack={onBack}>
      <div className="space-y-4">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Tell us what you think, report bugs, or suggest features..."
          rows={6}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!feedback.trim()}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Submit Feedback
        </button>
      </div>
    </SubScreenLayout>
  )
}

// Sub-screen layout component
function SubScreenLayout({
  title,
  onBack,
  onSave,
  children,
}: {
  title: string
  onBack: () => void
  onSave?: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#0a0f16]/95 backdrop-blur-lg z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold">{title}</h1>
        {onSave ? (
          <button onClick={onSave} className="text-cyan-400 hover:text-cyan-300 font-medium">
            Save
          </button>
        ) : (
          <div className="w-12" />
        )}
      </header>
      <div className="px-5 py-6">{children}</div>
    </motion.div>
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
  colorPreview,
}: {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  toggle?: boolean
  toggleValue?: boolean
  onToggle?: (value: boolean) => void
  colorPreview?: string
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
          {colorPreview && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: colorPreview }} />}
          {value && <span className="text-sm text-slate-400">{value}</span>}
          <ChevronRight size={18} className="text-slate-400" />
        </div>
      )}
    </button>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
