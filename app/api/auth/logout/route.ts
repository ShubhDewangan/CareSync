// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyJwt, COOKIE_NAME } from "@/lib/jwt"
import { Client, Users } from "node-appwrite"

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

// POST /api/auth/logout
// Reads JWT → deletes Appwrite session → clears cookie

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (token) {
      const payload = await verifyJwt(token)
      if (payload?.userId && payload?.sessionId) {
        try {
          const adminUsers = new Users(getAdminClient())
          await adminUsers.deleteSession(payload.userId, payload.sessionId)
        } catch {
          // Session may already be expired — still clear cookie
        }
      }
    }

    const res = NextResponse.json({ success: true })
    res.cookies.delete(COOKIE_NAME)
    console.log('hogya')
    return res

  } catch (error) {
    console.log("POST /api/auth/logout error:", error)
    const res = NextResponse.json({ success: true })
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}