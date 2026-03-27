/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Account, Client } from "node-appwrite"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createSessionClient } from "../appwrite.session"

const SESSION_COOKIE = "appwrite-session"

const getSessionCookieOptions = () => ({
    path: "/",
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
})

export const loginUser = async ({ email, password }: { email: string, password: string }) => {
    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

        const account = new Account(client)
        const session = await account.createEmailPasswordSession(email, password)

        const cookieStore = await cookies()
        cookieStore.set(SESSION_COOKIE, session.secret, getSessionCookieOptions())

        return { success: true, userId: session.userId }
    } catch (error: any) {
        console.log("loginUser ERROR:", error)

        if (error?.code === 401) {
            return { success: false, message: "Invalid email or password" }
        }

        return { success: false, message: "Unable to login right now. Please try again." }
    }
}

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
    redirect("/login")
}

export const getLoggedInUser = async () => {
    try {
        const { account } = await createSessionClient()
        return await account.get()
    } catch {
        return null
    }
}
