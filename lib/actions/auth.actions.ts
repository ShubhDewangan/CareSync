/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Account, Client, Users, Query } from "node-appwrite"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createSessionClient } from "./patient.actions"
import { sendEmail, verificationEmailHtml, passwordResetEmailHtml } from "../resend"

const SESSION_COOKIE = "appwrite-session"

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

// ============================
// 🔐 LOGIN
// ============================
export const loginUser = async ({ email, password }: { email: string, password: string }) => {
  try {
    // Step 1: Create session
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

    const account = new Account(client)
    const session = await account.createEmailPasswordSession(email, password)

    // Step 2: Store cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    // Step 3: ✅ Get user via Admin SDK using userId from session
    // Avoids creating a second client with setSession which causes guest scope errors
    const adminUsers = new Users(getAdminClient())
    const user = await adminUsers.get(session.userId)

    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }

  } catch (error: any) {
    console.log("loginUser ERROR:", error)

    if (error?.code === 401) {
      try {
        const adminUsers = new Users(getAdminClient())
        const usersList = await adminUsers.list([
          Query.equal('email', [email])
        ])
        const found = usersList.users[0]
        if (found && !found.emailVerification) {
          return "unverified" as const
        }
      } catch (adminError) {
        console.log("admin check error:", adminError)
      }
      return false
    }

    return null
  }
}

// ============================
// 📧 RESEND VERIFICATION EMAIL
// ============================
export const resendVerificationEmail = async (email: string, password: string) => {
  try {
    const adminUsers = new Users(getAdminClient())
    const usersList = await adminUsers.list([Query.equal('email', [email])])
    const found = usersList.users[0]
    if (!found) return { success: false }

    const token = await adminUsers.createToken(found.$id, 6, 3600)
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?userId=${found.$id}&secret=${token.secret}`

    await sendEmail({
      to: email,
      subject: "Verify your email — HealthApp",
      html: verificationEmailHtml(verifyUrl, found.name || 'there'),
    })

    return { success: true }
  } catch (error) {
    console.log("resendVerification error:", error)
    return { success: false }
  }
}

// ============================
// 🔑 SEND PASSWORD RESET EMAIL
// ============================
export const sendPasswordReset = async (email: string) => {
  try {
    const adminUsers = new Users(getAdminClient())
    const usersList = await adminUsers.list([Query.equal('email', [email])])
    const found = usersList.users[0]

    if (!found) return { success: true } // don't leak if email exists

    const token = await adminUsers.createToken(found.$id, 6, 3600)
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?userId=${found.$id}&secret=${token.secret}`

    await sendEmail({
      to: email,
      subject: "Reset your password — HealthApp",
      html: passwordResetEmailHtml(resetUrl, found.name || 'there'),
    })

    return { success: true }
  } catch (error: any) {
    console.log("sendPasswordReset error:", error)
    return { success: false }
  }
}

// ============================
// 🔑 COMPLETE PASSWORD RESET
// ============================
export const completePasswordReset = async ({
  userId,
  secret,
  password,
}: {
  userId: string
  secret: string
  password: string
}) => {
  try {
    // Step 1: Consume the token by creating a session with it
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

    const account = new Account(client)
    const session = await account.createSession(userId, secret)

    // Step 2: Update password via Admin SDK
    const adminUsers = new Users(getAdminClient())
    await adminUsers.updatePassword(userId, password)

    // Step 3: Delete the token session
    const sessionClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

    // ✅ setSession MUST be called on the client BEFORE passing to Account
    sessionClient.setSession(session.secret)
    const sessionAccount = new Account(sessionClient)
    await sessionAccount.deleteSession('current')

    return { success: true }
  } catch (error: any) {
    console.log("completePasswordReset error:", error)
    return { success: false, message: "Reset failed. Please try again." }
  }
}

// ============================
// 🚪 LOGOUT
// ============================
export const logoutUser = async () => {
  try {
    const { account } = await createSessionClient()
    await account.deleteSession("current")
  } catch (error) {
    console.log(error)
  } finally {
    const cookieStore = await cookies()
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
export const getLoggedInUser = async () => {
  try {
    const { account } = await createSessionClient()
    return await account.get()
  } catch {
    return null
  }
}