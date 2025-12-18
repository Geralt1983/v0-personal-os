import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // This avoids environment variable issues in middleware context
  console.log("[v0] Proxy middleware: passing through without auth check")
  return NextResponse.next({ request })
}
