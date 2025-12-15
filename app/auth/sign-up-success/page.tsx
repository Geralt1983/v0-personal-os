import { Zap } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Zap className="text-cyan-400" fill="currentColor" size={32} />
          <span className="text-2xl font-bold text-white">LifeOS</span>
        </div>

        <div className="p-8 rounded-2xl bg-[#1a2332] border border-white/10">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm">
            We've sent you a confirmation email. Please check your inbox and click the link to verify your account.
          </p>
        </div>

        <p className="text-slate-500 text-sm mt-6">
          Already confirmed?{" "}
          <a href="/auth/login" className="text-cyan-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
