'use server'

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

// ============================
// 📧 SEND EMAIL
// ============================

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "HealthApp <onboarding@resend.dev>",
      to,
      subject,
      html,
    })

    if (error) {
      console.log("sendEmail ERROR:", error)
      return { success: false, error }
    }

    return { success: true, data }

  } catch (error) {
    console.log("sendEmail CATCH:", error)
    return { success: false, error }
  }
}