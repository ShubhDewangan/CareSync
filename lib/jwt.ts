// lib/jwt.ts
import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "caresync_dev_secret_change_in_prod"
)

export const COOKIE_NAME = "caresync_token"
export const MAX_AGE = 60 * 60 * 24 * 60 // 60 days

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string
  sessionId: string
  name: string
  userType: "patient" | "doctor"
  email: string
  phone: string
}

// ─── Sign ─────────────────────────────────────────────────────────────────────

export async function signJwt(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(SECRET)
}

// ─── Verify ───────────────────────────────────────────────────────────────────

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}