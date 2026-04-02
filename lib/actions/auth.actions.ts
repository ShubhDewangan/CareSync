/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Account, Client, Databases, ID, Users, Query } from "node-appwrite"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createSessionClient } from "./patient.actions"
import { sendEmail } from "../resend"

const SESSION_COOKIE = "appwrite-session"

// ─── Clients ──────────────────────────────────────────────────────────────────

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

// OTP codes are stored in a dedicated Appwrite collection:
// Collection: "otp_codes"
// Fields: userId (string), code (string), expiresAt (string/ISO), method (string)
const OTP_DATABASE_ID = process.env.DATABASE_ID!
const OTP_COLLECTION_ID = process.env.OTP_COLLECTION_ID!   // add this to your .env

// ============================
// 🔢 GENERATE 6-DIGIT OTP
// ============================

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ============================
// 📤 SEND OTP
// ============================
// 1. Find user by email/phone
// 2. Generate a 6-digit code
// 3. Store it in Appwrite DB with 10-min expiry
// 4. Send via Resend
// 5. Return userId to client

export const sendOtp = async ({
  contact,
  method,
}: {
  contact: string
  method: "email" | "phone"
}): Promise<{ userId: string } | null> => {
  try {
    const adminClient = getAdminClient()
    const adminUsers = new Users(adminClient)
    const db = new Databases(adminClient)

    // 1. Find user
    const query = method === "email"
      ? Query.equal("email", [contact])
      : Query.equal("phone", [contact])

    const result = await adminUsers.list([query])

    if (result.total === 0) {
      console.log("sendOtp: no user found for", contact)
      return null
    }

    const user = result.users[0]

    // 2. Generate OTP
    const code = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

    // 3. Delete any existing OTP for this user (avoid duplicates)
    const existing = await db.listDocuments(OTP_DATABASE_ID, OTP_COLLECTION_ID, [
      Query.equal("userId", [user.$id]),
    ])
    for (const doc of existing.documents) {
      await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, doc.$id)
    }

    // 4. Store new OTP
    await db.createDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, ID.unique(), {
      userId: user.$id,
      code,
      expiresAt,
      method,
    })

    // 5. Send via Resend
    if (method === "email") {
      await sendEmail({
        to: contact,
        subject: "Your login code — HealthApp",
        html: otpEmailHtml(code, user.name || "there"),
      })
    }

    // For phone: plug in Twilio or any SMS provider here
    // if (method === "phone") { await sendSms(contact, code) }

    return { userId: user.$id }

  } catch (error: any) {
    console.log("sendOtp ERROR:", error?.code, error?.message)
    return null
  }
}

// ============================
// ✅ VERIFY OTP & CREATE SESSION
// ============================
// 1. Look up stored OTP for userId
// 2. Check code matches and hasn't expired
// 3. Delete used OTP
// 4. Create Appwrite session via Admin SDK
// 5. Store cookie and return user

export const verifyOtp = async ({
  userId,
  otp,
}: {
  userId: string
  otp: string
}): Promise<{ $id: string; name: string; email: string; phone: string } | { error: string } | null> => {
  try {
    const adminClient = getAdminClient()
    const db = new Databases(adminClient)
    const adminUsers = new Users(adminClient)

    // 1. Find the stored OTP doc for this user
    const result = await db.listDocuments(OTP_DATABASE_ID, OTP_COLLECTION_ID, [
      Query.equal("userId", [userId]),
    ])

    if (result.total === 0) {
      return { error: "OTP not found. Please request a new one." }
    }

    const otpDoc = result.documents[0]

    // 2. Check expiry
    if (new Date() > new Date(otpDoc.expiresAt)) {
      await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)
      return { error: "OTP has expired. Please request a new one." }
    }

    // 3. Check code
    if (otpDoc.code !== otp) {
      return { error: "Invalid OTP. Please try again." }
    }

    // 4. Delete used OTP
    await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)

    // 5. Create session via Admin SDK (no password needed)
    const session = await adminUsers.createSession(userId)

    // 6. Store session cookie — JSON with userId + secret so we can restore later
    const cookieStore = await cookies()
    const cookiePayload = JSON.stringify({
      userId,
      secret: session.secret,
      sessionId: session.$id,
    })
    cookieStore.set(SESSION_COOKIE, cookiePayload, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 60, // 60 days
    })

    // 7. Return user
    const user = await adminUsers.get(userId)

    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }

  } catch (error: any) {
    console.log("verifyOtp ERROR:", error?.code, error?.message)
    return null
  }
}

// ============================
// 🔍 CHECK IF USER EXISTS
// ============================

export const checkUserExists = async (
  contact: string,
  method: "email" | "phone"
): Promise<boolean> => {
  try {
    const adminUsers = new Users(getAdminClient())
    const query = method === "email"
      ? Query.equal("email", [contact])
      : Query.equal("phone", [contact])

    const result = await adminUsers.list([query])
    return result.total > 0
  } catch (error) {
    console.log("checkUserExists ERROR:", error)
    return false
  }
}

// ============================
// 🚪 LOGOUT
// ============================

export const logoutUser = async () => {
  const cookieStore = await cookies()
  try {
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    if (raw) {
      const { userId, sessionId } = JSON.parse(raw)
      const adminUsers = new Users(getAdminClient())
      await adminUsers.deleteSession(userId, sessionId)
    }
  } catch (error) {
    console.log("logoutUser ERROR:", error)
  } finally {
    cookieStore.delete(SESSION_COOKIE)
  }
}

export const logoutUserAndRedirect = async () => {
  await logoutUser()
  redirect("/")
}

// ============================
// 👤 GET LOGGED IN USER
// ============================
// Uses Admin SDK to validate session + fetch user (bypasses client.setSession issues)

export const getLoggedInUser = async () => {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(SESSION_COOKIE)?.value
    if (!raw) return null

    const { userId, sessionId } = JSON.parse(raw)
    if (!userId || !sessionId) return null

    const adminUsers = new Users(getAdminClient())

    // Verify the session still exists in Appwrite
    try {
      const sessions = await adminUsers.listSessions(userId)
      const valid = sessions.sessions.some((s: any) => s.$id === sessionId)
      if (!valid) {
        cookieStore.delete(SESSION_COOKIE)
        return null
      }
    } catch {
      // session expired or invalid — clear cookie
      cookieStore.delete(SESSION_COOKIE)
      return null
    }

    // Session is valid — fetch and return user
    const user = await adminUsers.get(userId)
    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }
  } catch (error: any) {
    console.log("❌ getLoggedInUser FAILED:", error?.message || error)
    return null
  }
}

// ============================
// 📧 OTP EMAIL TEMPLATE
// ============================

function otpEmailHtml(otp: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Your Login Code</title>
      </head>
      <body style="margin:0;padding:0;background:#f3f6fb;font-family:'Segoe UI',sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0"
                style="background:#ffffff;border-radius:16px;overflow:hidden;
                       box-shadow:0 4px 24px rgba(32,60,103,0.08);">

                <!-- Header -->
                <tr>
                  <td style="background:#203C67;padding:32px;text-align:center;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                      HealthApp
                    </p>
                    <p style="margin:6px 0 0;font-size:13px;color:#8FABD4;">
                      Secure Login Code
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <p style="margin:0 0 8px;font-size:16px;color:#374151;">
                      Hi <strong>${name}</strong>,
                    </p>
                    <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
                      Use the code below to log in to your HealthApp account.
                      This code expires in <strong>10 minutes</strong>.
                    </p>

                    <!-- OTP Box -->
                    <div style="text-align:center;margin:0 0 28px;">
                      <div style="display:inline-block;background:#f3f6fb;
                                  border:2px solid #203C67;border-radius:14px;
                                  padding:20px 40px;">
                        <span style="font-size:38px;font-weight:800;
                                     letter-spacing:10px;color:#203C67;
                                     font-family:'Courier New',monospace;">
                          ${otp}
                        </span>
                      </div>
                    </div>

                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      If you didn't request this code, you can safely ignore this email.
                      Someone may have entered your email by mistake.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;padding:20px 40px;
                              border-top:1px solid #e5e7eb;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © ${new Date().getFullYear()} HealthApp · All rights reserved
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}