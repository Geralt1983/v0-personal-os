import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const adminKey = process.env.ADMIN_API_KEY

    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== adminKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = createClient()

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.id, {
      password: newPassword,
    })

    if (updateError) {
      console.error("[v0] Admin password reset error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[v0] Password successfully reset for:", email)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("[v0] Admin password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
