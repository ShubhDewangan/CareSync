/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { showToast } from "../ui/toaster"
import { OtpRequestValidation, OtpVerifyValidation } from "@/lib/validation"
import { sendOtp, verifyOtp } from "@/lib/actions/auth.actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type OtpMethod = "email" | "phone"
type Step = "input" | "otp"

// ─── OTP Input Box Component ─────────────────────────────────────────────────

function OtpBoxes({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "")

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = digits.map((d, idx) => (idx === i ? "" : d)).join("")
        onChange(next)
      } else if (i > 0) {
        inputs.current[i - 1]?.focus()
        const next = digits.map((d, idx) => (idx === i - 1 ? "" : d)).join("")
        onChange(next)
      }
    }
  }

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "")
    if (!raw) return
    // Handle paste of full OTP
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6)
      onChange(pasted)
      inputs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }
    const next = digits.map((d, idx) => (idx === i ? raw[0] : d)).join("")
    onChange(next)
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={`
            w-11 h-13 text-center text-lg font-bold rounded-xl border-2 outline-none
            transition-all duration-200 bg-white
            ${digit
              ? "border-[#203C67] text-[#203C67] shadow-sm"
              : "border-gray-200 text-gray-400"
            }
            focus:border-[#203C67] focus:shadow-[0_0_0_3px_rgba(32,60,103,0.08)]
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  )
}

// ─── Main LoginForm ───────────────────────────────────────────────────────────

export default function LoginForm({
  setUser,
  setOpenSignIn,
  onClose,
  onSuccess,
}: {
  setOpenSignIn: any
  onClose: () => void
  setUser: any
  onSuccess?: (user: any) => void
}) {
  const router = useRouter()

  const [method, setMethod] = useState<OtpMethod>("email")
  const [step, setStep] = useState<Step>("input")
  const [isLoading, setLoading] = useState(false)

  // Contact value (email or phone)
  const [contact, setContact] = useState("")
  const [contactError, setContactError] = useState("")

  // OTP
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState("")
  const [userId, setUserId] = useState("")

  // Resend timer
  const [resendTimer, setResendTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [resendTimer])

  // ─── Validate contact ───────────────────────────────────────────
  function validateContact(): boolean {
    setContactError("")
    if (!contact.trim()) {
      setContactError(method === "email" ? "Email is required." : "Phone number is required.")
      return false
    }
    if (method === "email") {
      const emailSchema = z.string().email()
      if (!emailSchema.safeParse(contact).success) {
        setContactError("Please enter a valid email address.")
        return false
      }
    } else {
      if (!/^\+?[0-9]{10,15}$/.test(contact.replace(/[\s\-()]/g, ""))) {
        setContactError("Please enter a valid phone number (10–15 digits).")
        return false
      }
    }
    return true
  }

  // ─── Send OTP ───────────────────────────────────────────────────
  async function handleSendOtp() {
    if (!validateContact()) return
    setLoading(true)

    try {
      const res = await sendOtp({ contact, method })

      if (res?.userId) {
        setUserId(res.userId)
        setStep("otp")
        setResendTimer(30)
        showToast("success", `OTP sent to your ${method}!`, "top-right")
      } else {
        setContactError("Could not send OTP. Please try again.")
      }
    } catch {
      setContactError("Could not send OTP. Please try again.")
    }

    setLoading(false)
  }

  // ─── Verify OTP ─────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setOtpError("")

    if (otp.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.")
      return
    }

    setLoading(true)

    try {
      const res = await verifyOtp({ userId, otp })

      if (res && typeof res === "object" && !("error" in res)) {
        if (onSuccess) {
          onSuccess(res)
        } else {
          setUser(res)
          onClose()
        }
        router.refresh()
      } else {
        setOtpError("Invalid or expired OTP. Please try again.")
        setOtp("")
      }
    } catch {
      setOtpError("Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  // ─── Resend OTP ─────────────────────────────────────────────────
  async function handleResend() {
    if (resendTimer > 0) return
    setOtp("")
    setOtpError("")
    setLoading(true)

    try {
      const res = await sendOtp({ contact, method })
      if (res?.userId) {
        setUserId(res.userId)
        setResendTimer(30)
        showToast("success", "New OTP sent!", "top-right")
      }
    } catch {
      showToast("error", "Could not resend OTP.", "top-right")
    }

    setLoading(false)
  }

  // ─── Switch method ───────────────────────────────────────────────
  function switchMethod(m: OtpMethod) {
    setMethod(m)
    setContact("")
    setContactError("")
    setStep("input")
    setOtp("")
    setOtpError("")
  }

  // ─── Mask contact for display ────────────────────────────────────
  function maskContact() {
    if (method === "email") {
      const [user, domain] = contact.split("@")
      return `${user.slice(0, 2)}***@${domain}`
    }
    return contact.slice(0, -4).replace(/./g, "*") + contact.slice(-4)
  }

  // ─── RENDER ──────────────────────────────────────────────────────
  return (
    <div className="w-full">

      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <span className="absolute top-4 left-4 bg-[#EEF3FA] text-[#203C67] px-3 py-1 rounded-full text-xs font-semibold">
          Patient
        </span>
        <h2 className="text-gray-900 font-semibold text-[22px] tracking-tight">Welcome Back</h2>
        <p className="text-[#6B7280] text-sm mt-1">Log in to access your health dashboard</p>
      </div>

      {/* Method Toggle */}
      <div className="flex bg-[#F3F6FB] rounded-xl p-1 mb-6">
        {(["email", "phone"] as OtpMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMethod(m)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200 cursor-pointer
              ${method === m
                ? "bg-white text-[#203C67] shadow-sm"
                : "text-gray-400 hover:text-gray-600"
              }
            `}
          >
            {m === "email" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            )}
            {m === "email" ? "Email OTP" : "Phone OTP"}
          </button>
        ))}
      </div>

      {/* ── STEP: INPUT ─────────────────────────────────────────── */}
      {step === "input" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">
              {method === "email" ? "Email Address" : "Phone Number"}
            </label>

            <div className="flex gap-2">
              <input
                type={method === "email" ? "email" : "tel"}
                value={contact}
                onChange={(e) => { setContact(e.target.value); setContactError("") }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder={method === "email" ? "johndoe@example.com" : "+91 98765 43210"}
                className={`
                  flex-1 h-11 border-2 rounded-xl px-3 text-sm outline-none transition-all
                  bg-white placeholder:text-gray-300
                  ${contactError
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-[#203C67] focus:shadow-[0_0_0_3px_rgba(32,60,103,0.08)]"
                  }
                `}
              />

              {/* GET OTP Button */}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading || !contact.trim()}
                className="
                  px-4 h-11 bg-[#203C67] text-white text-sm font-semibold rounded-xl
                  disabled:opacity-50 hover:bg-[#162d50] transition-colors cursor-pointer
                  whitespace-nowrap flex items-center gap-2
                "
              >
                {isLoading ? (
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                )}
                Get OTP
              </button>
            </div>

            {contactError && (
              <span className="text-xs text-red-500 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {contactError}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            We'll send a 6-digit code to verify your identity. No password needed.
          </p>
        </div>
      )}

      {/* ── STEP: OTP ───────────────────────────────────────────── */}
      {step === "otp" && (
        <div className="flex flex-col gap-5">

          {/* Back + info */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setStep("input"); setOtp(""); setOtpError("") }}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <p className="text-sm text-gray-500">
              Code sent to{" "}
              <span className="font-semibold text-[#203C67]">{maskContact()}</span>
            </p>
          </div>

          {/* OTP Boxes */}
          <div className="flex flex-col gap-3">
            <OtpBoxes value={otp} onChange={setOtp} disabled={isLoading} />

            {otpError && (
              <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {otpError}
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length < 6}
            className="
              w-full h-11 bg-[#203C67] text-white rounded-xl text-sm font-semibold
              disabled:opacity-50 hover:bg-[#162d50] transition-colors cursor-pointer
              flex items-center justify-center gap-2
            "
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Verifying...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Verify & Log In
              </>
            )}
          </button>

          {/* Resend */}
          <p className="text-xs text-center text-gray-400">
            Didn't receive it?{" "}
            {resendTimer > 0 ? (
              <span className="text-[#203C67] font-semibold">Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="text-[#203C67] font-semibold underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#E5E7EB]" />
        <span className="text-xs text-[#9CA3AF]">or</span>
        <div className="flex-1 h-px bg-[#E5E7EB]" />
      </div>

      {/* Sign up link */}
      <p className="text-center text-sm text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => { setOpenSignIn(true); onClose() }}
          className="text-[#203C67] font-semibold underline underline-offset-2 cursor-pointer"
        >
          Sign up for free
        </button>
      </p>
    </div>
  )
}