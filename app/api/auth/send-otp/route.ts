// /* eslint-disable @typescript-eslint/no-explicit-any */
// // app/api/auth/send-otp/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { Client, Databases, Users, ID, Query } from "node-appwrite"
// // import { sendEmail } from "@/lib/resend"  // 🔒 LOCKED — uncomment when domain is purchased

// const OTP_DATABASE_ID = process.env.DATABASE_ID!
// const OTP_COLLECTION_ID = process.env.OTP_COLLECTION_ID!

// function getAdminClient() {
//   return new Client()
//     .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
//     .setKey(process.env.API_KEY!)
// }

// function generateOtp(): string {
//   // return Math.floor(100000 + Math.random() * 900000).toString()  // 🔒 LOCKED — real OTP
//   return process.env.OTP_CODE ?? "123456"  // ✅ Static bypass until domain is purchased
// }

// // POST /api/auth/send-otp
// // Body: { contact: string, method: "email" | "phone" }
// // Finds user → generates OTP → stores in DB → [EMAIL BYPASSED] → returns userId

// export async function POST(req: NextRequest) {
//   try {
//     const { contact, method } = await req.json()

//     if (!contact || !method) {
//       return NextResponse.json(
//         { error: "Missing contact or method" },
//         { status: 400 }
//       )
//     }

//     const adminClient = getAdminClient()
//     const adminUsers = new Users(adminClient)
//     const db = new Databases(adminClient)

//     // 1. Find user by email or phone
//     const query = method === "email"
//       ? Query.equal("email", [contact])
//       : Query.equal("phone", [contact])

//     const result = await adminUsers.list([query])

//     if (result.total === 0) {
//       return NextResponse.json(
//         { error: "No account found. Please sign up first." },
//         { status: 404 }
//       )
//     }

//     const user = result.users[0]

//     // 2. Generate OTP + expiry
//     const code = generateOtp()
//     const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

//     // 3. Delete any existing OTP for this user
//     const existing = await db.listDocuments(OTP_DATABASE_ID, OTP_COLLECTION_ID, [
//       Query.equal("userId", [user.$id]),
//     ])
//     for (const doc of existing.documents) {
//       await db.deleteDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, doc.$id)
//     }

//     // 4. Store OTP in DB (kept so verify-otp route still works unchanged)
//     await db.createDocument(OTP_DATABASE_ID, OTP_COLLECTION_ID, ID.unique(), {
//       userId: user.$id,
//       code,
//       expiresAt,
//       method,
//     })

//     // 5. ✅ EMAIL BYPASSED — uncomment block below when domain is purchased
//     // if (method === "email") {
//     //   await sendEmail({
//     //     to: contact,
//     //     subject: "Your CareSync Login Code",
//     //     html: otpEmailHtml(code, user.name || "there"),
//     //   })
//     // }

//     // For phone: add Twilio here when ready
//     // if (method === "phone") { await sendSms(contact, code) }

//     console.log(`[DEV] OTP for ${contact}: ${code}`)  // visible in terminal only
//     return NextResponse.json({ userId: user.$id })

//   } catch (error: any) {
//     console.log("POST /api/auth/send-otp error:", error?.message)
//     return NextResponse.json(
//       { error: "Could not send OTP. Please try again." },
//       { status: 500 }
//     )
//   }
// }

// // ─── Email template (kept for when email is re-enabled) ──────────────────────
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function otpEmailHtml(otp: string, name: string): string {
//   return `
//     <!DOCTYPE html>
//     <html>
//       <head>
//         <meta charset="utf-8"/>
//         <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//         <title>Your Login Code</title>
//       </head>
//       <body style="margin:0;padding:0;background:#f3f6fb;font-family:'Segoe UI',sans-serif;">
//         <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
//           <tr>
//             <td align="center">
//               <table width="480" cellpadding="0" cellspacing="0"
//                 style="background:#ffffff;border-radius:16px;overflow:hidden;
//                        box-shadow:0 4px 24px rgba(32,60,103,0.08);">
//                 <tr>
//                   <td style="background:#203C67;padding:32px;text-align:center;">
//                     <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">CareSync</p>
//                     <p style="margin:6px 0 0;font-size:13px;color:#8FABD4;">Secure Login Code</p>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="padding:36px 40px;">
//                     <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
//                     <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">
//                       Use the code below to log in. This code expires in <strong>10 minutes</strong>.
//                     </p>
//                     <div style="text-align:center;margin:0 0 28px;">
//                       <div style="display:inline-block;background:#f3f6fb;
//                                   border:2px solid #203C67;border-radius:14px;
//                                   padding:20px 40px;">
//                         <span style="font-size:38px;font-weight:800;
//                                      letter-spacing:10px;color:#203C67;
//                                      font-family:'Courier New',monospace;">
//                           ${otp}
//                         </span>
//                       </div>
//                     </div>
//                     <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
//                       If you didn't request this, you can safely ignore this email.
//                     </p>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="background:#f9fafb;padding:20px 40px;
//                               border-top:1px solid #e5e7eb;text-align:center;">
//                     <p style="margin:0;font-size:12px;color:#9ca3af;">
//                       © ${new Date().getFullYear()} CareSync · All rights reserved
//                     </p>
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </table>
//       </body>
//     </html>
//   `
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { Client, Databases, Users, ID, Query } from "node-appwrite"

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
    const { contact, method } = await req.json()

    if (!contact || !method) {
      return NextResponse.json({ error: "Missing contact or method" }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const adminUsers = new Users(adminClient)
    const db = new Databases(adminClient)

    // 1. Find user
    const query = method === "email"
      ? Query.equal("email", [contact])
      : Query.equal("phone", [contact])

    const result = await adminUsers.list([query])

    if (result.total === 0) {
      return NextResponse.json(
        { error: "No account found. Please sign up first." },
        { status: 404 }
      )
    }

    const user = result.users[0]

    // 2. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // 3. Delete any existing OTP for this user
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

    // 5. DEV: log to terminal — replace with email/SMS when domain is ready
    console.log(`[DEV OTP] ${contact} → ${code}`)

    return NextResponse.json({ userId: user.$id, otp: code })

  } catch (error: any) {
    console.log("POST /api/auth/send-otp error:", error?.message)
    return NextResponse.json({ error: "Could not send OTP. Please try again." }, { status: 500 })
  }
}