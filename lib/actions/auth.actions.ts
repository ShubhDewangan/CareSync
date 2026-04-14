/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/actions/auth.actions.ts
'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Client, Users, Query, ID } from "node-appwrite"
import { verifyJwt, COOKIE_NAME } from "@/lib/jwt"


// ============================
// 👤 GET LOGGED IN USER
// ============================
// Reads JWT — zero Appwrite calls
// Use in server components and protected layout

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

// ============================
// 👤 CREATE USER
// ============================
// Stores userType in Appwrite prefs so we can read it later in JWT

export const createUser = async (user: {
  name: string
  email: string
  phone: string
  userType: "patient" | "doctor"
}) => {
  try {
    const adminUsers = new Users(getAdminClient())

    const newUser = await adminUsers.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name
    )

    // ✅ Store userType in prefs — read during verifyOtp to put in JWT
    await adminUsers.updatePrefs(newUser.$id, { userType: user.userType })

    return {
      $id: newUser.$id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      userType: user.userType,
    }

  } catch (error: any) {
    console.log('createUser error:', error?.code, error?.message)
    if (error?.code === 409) return false
    return null
  }
}

export const getLoggedInUser = async () => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = await verifyJwt(token)
    if (!payload) return null

    return {
      $id: payload.userId,
      name: payload.name,
      userType: payload.userType,
      email: payload.email,
      phone: payload.phone
    }
  } catch {
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
  } catch {
    return false
  }
}

// ============================
// 🚪 LOGOUT
// ============================

export const logoutUser = async () => {
  const cookieStore = await cookies()
  try {
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (token) {
      const payload = await verifyJwt(token)
      if (payload?.userId && payload?.sessionId) {
        const adminUsers = new Users(getAdminClient())
        await adminUsers.deleteSession(payload.userId, payload.sessionId)
      }
    }
  } catch {
    // session already expired — still clear cookie
  } finally {
    cookieStore.delete(COOKIE_NAME)
  }
}

export const logoutUserAndRedirect = async () => {
  await logoutUser()
  redirect("/")
}