'use server'

import { Resend } from "resend"


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
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const { data, error } = await resend.emails.send({
      from: "CareSync <onboarding@resend.dev>",
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