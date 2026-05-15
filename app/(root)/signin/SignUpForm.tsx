/* eslint-disable react-hooks/purity */
// components/forms/SignUpForm.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import CustomFormField from "@/components/CustomFormField"
import { Form } from "@/components/ui/form"
import userImage from "@/public/assets/icons/user.svg"
import emailImage from "@/public/assets/icons/email.svg"
import { RegisterFormValidation, RegisterFormValues } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { createUser } from "@/lib/actions/auth.actions"
import { showToast } from "@/components/ui/toaster"

export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATEPICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
  PASSWORD = "password",
}

// ─── OTP Boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange, disabled }: {
  value: string; onChange: (val: string) => void; disabled?: boolean
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "")

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) onChange(digits.map((d, idx) => (idx === i ? "" : d)).join(""))
      else if (i > 0) {
        inputs.current[i - 1]?.focus()
        onChange(digits.map((d, idx) => (idx === i - 1 ? "" : d)).join(""))
      }
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) return
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6)
      onChange(pasted)
      inputs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }
    onChange(digits.map((d, idx) => (idx === i ? raw[0] : d)).join(""))
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input key={i} ref={(el) => { inputs.current[i] = el }}
          type="text" inputMode="numeric" maxLength={1} value={digit} disabled={disabled}
          onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={`w-11 h-13 text-center text-lg font-bold rounded-xl border-2 outline-none
            transition-all duration-200 bg-white/50
            ${digit ? "border-[#203C67] text-[#203C67] shadow-sm" : "border-gray-200 text-gray-400"}
            focus:border-[#203C67] focus:shadow-[0_0_0_3px_rgba(32,60,103,0.08)]
            disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      ))}
    </div>
  )
}

type Step = "details" | "otp"

type PendingUser = {
  name: string
  email: string
  phone: string
  userType: "patient" | "doctor"
}

// ─── SignUpForm ───────────────────────────────────────────────────────────────
export function SignUpForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>("details")
  const [isLoading, setLoading] = useState(false)
  const [userType, setUserType] = useState<"patient" | "doctor">("patient")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [resendTimer])

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormValidation),
    mode: "all",
    defaultValues: { name: "", email: "", phone: "" },
  })

  // ─── Step 1: send OTP (don't create user yet) ────────────────────
  async function onSubmitDetails({ name, email, phone }: RegisterFormValues) {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: email, method: "email", mode: "signup" }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        showToast("error", data.error ?? "Could not send OTP. Please try again.", "top-right")
        setLoading(false)
        return
      }

      // Lock in all form values including userType at submit time
      setPendingUser({ name, email, phone, userType })
      setGeneratedOtp(data.otp)
      setSubmittedEmail(email)
      setStep("otp")
      setResendTimer(30)
      showToast("success", `Your OTP is: ${data.otp}`, "top-right")

    } catch (error) {
      console.log(error)
      showToast("error", "Something went wrong. Please try again.", "top-right")
    }
    setLoading(false)
  }

  // ─── Step 2: create user + verify OTP ───────────────────────────
  async function handleVerifyOtp() {
    setOtpError("")
    if (otp.length < 6) { setOtpError("Please enter the complete 6-digit OTP."); return }
    if (!pendingUser) { setOtpError("Session expired. Please go back and try again."); return }

    setLoading(true)
    try {
      // Create user only after OTP is entered
      const user = await createUser({
        name: pendingUser.name,
        email: pendingUser.email,
        phone: pendingUser.phone,
        userType: pendingUser.userType,
      })

      if (user === false) {
        showToast("info", "Account already exists. Please log in.", "top-right")
        router.push("/login")
        return
      }

      if (!user || typeof user !== "object") {
        setOtpError("Could not create account. Please try again.")
        setLoading(false)
        return
      }

      // Verify OTP against DB
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.$id, otp }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        setOtpError(data.error ?? "Invalid or expired OTP.")
        setOtp("")
        setLoading(false)
        return
      }

      showToast("success", "Account verified! Welcome 🎉", "top-right")
      router.push("/")

    } catch {
      setOtpError("Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  // ─── Resend OTP ──────────────────────────────────────────────────
  async function handleResend() {
    if (resendTimer > 0) return
    setOtp(""); setOtpError(""); setLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: submittedEmail, method: "email", mode: "signup" }),
      })
      const data = await res.json()
      if (res.ok && data.otp) {
        setGeneratedOtp(data.otp)
        setResendTimer(30)
        showToast("success", `New OTP: ${data.otp}`, "top-right")
      }
    } catch { showToast("error", "Could not resend OTP.", "top-right") }
    setLoading(false)
  }

  function maskEmail(email: string) {
    const [user, domain] = email.split("@")
    return `${user.slice(0, 2)}***@${domain}`
  }

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* STEP: DETAILS */}
      {step === "details" && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitDetails)} className="flex flex-col gap-4">

            <section className="flex flex-col items-center justify-center mb-2">
              <h1 className="text-gray-700 font-thin text-2xl">Create Account</h1>
              <p className="text-sm text-[#6B7280] mt-1">Fill in your details to get started</p>
            </section>

            {/* User type toggle */}
            <div className="flex bg-[#F3F6FB] rounded-xl p-1">
              {(["patient", "doctor"] as const).map((type) => (
                <button key={type} type="button" onClick={() => setUserType(type)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize cursor-pointer
                    ${userType === type ? "bg-white/50 text-[#203C67] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {type === "patient" ? "Patient" : "Doctor"}
                </button>
              ))}
            </div>

            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control}
              name="name" label="Full Name" iconSrc={userImage} iconAlt="User Icon" placeholder="John Doe" />
            <CustomFormField fieldType={FormFieldType.INPUT} control={form.control}
              name="email" label="Email Address" iconSrc={emailImage} iconAlt="Email Icon" placeholder="johndoe@example.com" />
            <CustomFormField fieldType={FormFieldType.PHONE_INPUT} control={form.control}
              name="phone" label="Phone Number" iconAlt="Phone Icon" placeholder="+91 98765 43210" />

            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg py-2.5 px-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-xs text-blue-800">
                We&apos;ll send a 6-digit OTP to your email to verify your account.
              </span>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-11 text-white bg-[#203C67] rounded-xl text-sm font-semibold disabled:opacity-60 hover:bg-[#162d50] transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Sending OTP...
                </>
              ) : "Create Account & Get OTP"}
            </button>

            <p className="text-center text-sm text-[#6B7280]">
              Already have an account?{" "}
              <button type="button" onClick={() => router.push("/login")}
                className="text-[#203C67] font-semibold underline underline-offset-2 cursor-pointer">
                Log in instead
              </button>
            </p>

          </form>
        </Form>
      )}

      {/* STEP: OTP */}
      {step === "otp" && (
        <div className="flex flex-col gap-5">

          <div className="flex flex-col items-center text-center gap-1 mb-2">
            <div className="w-14 h-14 bg-[#EEF3FA] rounded-full flex items-center justify-center mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 className="text-[#203C67] font-semibold text-xl">Verify your email</h2>
            <p className="text-sm text-gray-500">
              Code sent to{" "}
              <span className="font-semibold text-[#203C67]">{maskEmail(submittedEmail)}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Signing up as{" "}
              <span className="font-semibold text-[#203C67] capitalize">{pendingUser?.userType}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl py-3 px-4">
            <p className="text-xs text-amber-700 font-medium">Your OTP (demo mode)</p>
            <p className="text-2xl font-bold tracking-[0.3em] text-amber-800">{generatedOtp}</p>
          </div>

          <OtpBoxes value={otp} onChange={setOtp} disabled={isLoading} />

          {otpError && (
            <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {otpError}
            </p>
          )}

          <button type="button" onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}
            className="w-full h-11 bg-[#203C67] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[#162d50] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Verifying...</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Verify & Continue</>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            Didn&apos;t receive it?{" "}
            {resendTimer > 0 ? (
              <span className="text-[#203C67] font-semibold">Resend in {resendTimer}s</span>
            ) : (
              <button type="button" onClick={handleResend} disabled={isLoading}
                className="text-[#203C67] font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-50">
                Resend OTP
              </button>
            )}
          </p>

          <button type="button" onClick={() => { setStep("details"); setOtp(""); setOtpError(""); setPendingUser(null) }}
            className="text-xs text-gray-400 hover:text-gray-600 text-center underline underline-offset-2 cursor-pointer">
            ← Wrong email? Go back
          </button>

        </div>
      )}
    </div>
  )
}