// app/api/user/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyJwt, COOKIE_NAME } from "@/lib/jwt"

// GET /api/user
// Reads JWT cookie → returns { $id, name, userType }
// Zero Appwrite calls — used by homepage for instant auto-login

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) return NextResponse.json(null)

    const payload = await verifyJwt(token)

    if (!payload) {
      const res = NextResponse.json(null)
      res.cookies.delete(COOKIE_NAME)
      return res
    }

    return NextResponse.json({
      $id: payload.userId,
      name: payload.name,
      email: payload.email,
      userType: payload.userType,
      phone: payload.phone
    })

  } catch {
    return NextResponse.json(null)
  }
}