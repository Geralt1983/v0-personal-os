import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function updateSession(request: NextRequest) {
  console.log("[v0] Proxy middleware running for:", request.nextUrl.pathname)

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] Supabase env vars missing in middleware - allowing request")
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Proxy auth check:", {
    path: request.nextUrl.pathname,
    hasSession: !!user,
  })

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/demo") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/admin")

  // Redirect to login if accessing protected routes without auth
  if (!isPublicRoute && !user) {
    console.log("[v0] Redirecting to login - no user on protected route")
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect to app if accessing auth routes while logged in
  if (request.nextUrl.pathname.startsWith("/auth") && user && request.nextUrl.pathname !== "/auth/sign-up-success") {
    console.log("[v0] Redirecting to app - user already logged in")
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
