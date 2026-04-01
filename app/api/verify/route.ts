/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { Client, Users } from 'node-appwrite'

export async function POST(req: NextRequest) {
  try {
    const { userId, secret } = await req.json()

    if (!userId || !secret) {
      return NextResponse.json(
        { success: false, message: 'Missing userId or secret' },
        { status: 400 }
      )
    }

    // ✅ Only use Admin SDK — no createSession, no token consumption
    // Admin SDK can mark email verified directly without needing the token
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.API_KEY!)

    const users = new Users(adminClient)

    // Verify the userId exists first
    const user = await users.get(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      )
    }

    // Mark email as verified — idempotent, safe to call multiple times
    await users.updateEmailVerification(userId, true)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.log('Verify route error:', error)
    return NextResponse.json({
      success: false,
      message: 'Verification failed. Please try again.'
    }, { status: 400 })
  }
}