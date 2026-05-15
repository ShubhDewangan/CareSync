// /* eslint-disable @typescript-eslint/no-explicit-any */
// // app/api/auth/verify-otp/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { Client, Databases, Users, Query } from "node-appwrite"
// import { signJwt, COOKIE_NAME, MAX_AGE } from "@/lib/jwt"

// const OTP_DATABASE_ID = process.env.DATABASE_ID!
// const OTP_COLLECTION_ID = process.env.OTP_COLLECTION_ID!

// function getAdminClient() {
//   return new Client()
//     .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
//     .setKey(process.env.API_KEY!)
// }

// // POST /api/auth/verify-otp
// // Body: { userId, otp }
// // Returns: { user: { $id, name, userType } }
// // Sets:    caresync_token JWT cookie

// export async function POST(req: NextRequest) {
//   try {
//     const { userId, otp } = await req.json()

//     if (!userId || !otp) {
//       return NextResponse.json({ error: "Missing userId or otp" }, { status: 400 })
//     }

//     const adminClient = getAdminClient()
//     const db = new Databases(adminClient)
//     const adminUsers = new Users(adminClient)

//     // 1. Find stored OTP
//     const result = await db.listDocuments(OTP_DATABASE_ID, OTP_COLLECTION_ID, [
//       Query.equal("userId", [userId]),
//     ])

//     if (result.total === 0) {
//       return NextResponse.json(
//         { error: "OTP not found. Please request a new one." },
//         { status: 400 }
//       )
//     }

//     const otpDoc = result.documents[0]

//     // 2. Check expiry
//     if (new Date() > new Date(otpDoc.expiresAt)) {
//       await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)
//       return NextResponse.json(
//         { error: "OTP has expired. Please request a new one." },
//         { status: 400 }
//       )
//     }

//     // 3. Check code
//     if (otpDoc.code !== otp) {
//       return NextResponse.json(
//         { error: "Invalid OTP. Please try again." },
//         { status: 400 }
//       )
//     }

//     // 4. Delete used OTP
//     await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)

//     // 5. Create Appwrite session
//     const session = await adminUsers.createSession(userId)

//     // 6. Fetch user + their userType (stored in prefs during signup)
//     const user = await adminUsers.get(userId)
//     const userType = (user.prefs?.userType as "patient" | "doctor") ?? "patient"

//     // 7. Sign JWT — minimal payload only
//     const token = await signJwt({
//       userId: user.$id,
//       sessionId: session.$id,
//       name: user.name,
//       userType,
//       email: user.email,
//       phone: user.phone,
//     })

//     // 8. Return user data
//     const userData = {
//       $id: user.$id,
//       name: user.name,
//       userType,
//     }

//     const res = NextResponse.json({ user: userData }, { status: 200 })

//     // 9. Set httpOnly JWT cookie
//     res.cookies.set(COOKIE_NAME, token, {
//       path: "/",
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       maxAge: MAX_AGE,
//     })

//     return res

//   } catch (error: any) {
//     console.log("POST /api/auth/verify-otp error:", error?.message)
//     return NextResponse.json(
//       { error: "Something went wrong. Please try again." },
//       { status: 500 }
//     )
//   }
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { Client, Databases, Users, Query } from "node-appwrite"
import { signJwt, COOKIE_NAME, MAX_AGE } from "@/lib/jwt"

const OTP_DATABASE_ID = process.env.DATABASE_ID!
const OTP_COLLECTION_ID = process.env.OTP_COLLECTION_ID!

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

export async function POST(req: NextRequest) {
  try {
    const { userId, otp } = await req.json()

    if (!userId || !otp) {
      return NextResponse.json({ error: "Missing userId or otp" }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const db = new Databases(adminClient)
    const adminUsers = new Users(adminClient)

    // 1. Find stored OTP
    const result = await db.listDocuments(OTP_DATABASE_ID, OTP_COLLECTION_ID, [
      Query.equal("userId", [userId]),
    ])

    if (result.total === 0) {
      return NextResponse.json(
        { error: "OTP not found. Please request a new one." },
        { status: 400 }
      )
    }

    const otpDoc = result.documents[0]

    // 2. Check expiry
    if (new Date() > new Date(otpDoc.expiresAt)) {
      await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // 3. Check code
    if (otpDoc.code !== otp) {
      return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 400 })
    }

    // 4. Delete used OTP
    await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, otpDoc.$id)

    // 5. Create Appwrite session
    const session = await adminUsers.createSession(userId)

    // 6. Fetch user + userType
    const user = await adminUsers.get(userId)
    const userType = (user.prefs?.userType as "patient" | "doctor") ?? "patient"

    // 7. Sign JWT
    const token = await signJwt({
      userId: user.$id,
      sessionId: session.$id,
      name: user.name,
      userType,
      email: user.email,
      phone: user.phone,
    })

    const userData = { $id: user.$id, name: user.name, userType }
    const res = NextResponse.json({ user: userData }, { status: 200 })

    res.cookies.set(COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: MAX_AGE,
    })

    return res

  } catch (error: any) {
    console.log("POST /api/auth/verify-otp error:", error?.message)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}