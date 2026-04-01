/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import CustomFormField from "../CustomFormField"
import SubmitButton from "@/components/SubmitButton"
import { Form } from "@/components/ui/form"
import emailImage from '@/public/assets/icons/email.svg'
import { LoginFormValidation } from "@/lib/validation"
import { useRouter } from "next/navigation"
import { showToast } from "../ui/toaster"
import { loginUser, resendVerificationEmail, sendPasswordReset } from "@/lib/actions/auth.actions"

export enum FormFieldType {
  INPUT = 'input',
  TEXTAREA = 'textarea',
  PHONE_INPUT = 'phoneInput',
  CHECKBOX = 'checkbox',
  DATEPICKER = 'datePicker',
  SELECT = 'select',
  SKELETON = 'skeleton',
  PASSWORD = 'password'
}

type FormValues = z.infer<typeof LoginFormValidation>

// Three views inside the same modal
type View = 'login' | 'forgot' | 'forgot-sent'

export default function LoginForm({ setUser, setOpenSignIn, onClose, onSuccess }: {
  setOpenSignIn: any
  onClose: () => void
  setUser: any
  onSuccess?: (user: any) => void
}) {
  const router = useRouter()
  const [isLoading, setLoading] = useState(false)
  const [view, setView] = useState<View>('login')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotEmailError, setForgotEmailError] = useState('')
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(LoginFormValidation),
    mode: 'all',
    defaultValues: { email: "", password: '' },
  })

  // ─── LOGIN SUBMIT ────────────────────────────────────────────────
  async function onSubmit({ email, password }: FormValues) {
    setLoading(true)
    setUnverifiedEmail(null)

    try {
      const loginRes = await loginUser({ email, password })

      if (loginRes === "unverified") {
        setUnverifiedEmail(email)
        showToast('info', 'Please verify your email before logging in.', 'top-right')

      } else if (loginRes && typeof loginRes === 'object') {
        if (onSuccess) {
          onSuccess(loginRes)
        } else {
          setUser(loginRes)
          onClose()
        }
        router.refresh()

      } else if (loginRes === false) {
        showToast('error', 'Invalid email or password.', 'top-right')

      } else {
        showToast('error', 'Something went wrong. Please try again.', 'top-right')
      }

    } catch (error) {
      console.log(error)
      showToast('error', 'Something went wrong. Please try again.', 'top-right')
    }

    setLoading(false)
  }

  // ─── RESEND VERIFICATION ─────────────────────────────────────────
  async function handleResendVerification() {
    if (!unverifiedEmail) return
    setResending(true)

    try {
      const password = form.getValues('password')
      const res = await resendVerificationEmail(unverifiedEmail, password)

      if (res.success) {
        showToast('success', 'Verification email sent! Check your inbox.', 'top-right')
        setUnverifiedEmail(null)
      } else {
        showToast('error', 'Could not resend. Try again later.', 'top-right')
      }
    } catch {
      showToast('error', 'Could not resend. Try again later.', 'top-right')
    }

    setResending(false)
  }

  // ─── SEND PASSWORD RESET ─────────────────────────────────────────
  async function handleSendReset() {
    setForgotEmailError('')

    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotEmailError('Please enter a valid email address.')
      return
    }

    setIsSendingReset(true)

    try {
      const res = await sendPasswordReset(forgotEmail)

      if (res.success) {
        // Move to the "check your email" confirmation step
        setView('forgot-sent')
      } else {
        setForgotEmailError('Could not send reset email. Please try again.')
      }
    } catch {
      setForgotEmailError('Could not send reset email. Please try again.')
    }

    setIsSendingReset(false)
  }

  // ─── VIEWS ───────────────────────────────────────────────────────

  // VIEW: forgot-sent — confirmation screen
  if (view === 'forgot-sent') {
    return (
      <div className="w-full flex flex-col items-center text-center gap-5 py-6">
        <div className="w-16 h-16 bg-blue-50 border-2 border-[#8FABD4] rounded-full flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[#203C67] mb-1">Check your inbox</h2>
          <p className="text-sm text-gray-500 max-w-xs">
            We sent a password reset link to{' '}
            <span className="font-semibold text-[#203C67]">{forgotEmail}</span>.
            Click the link in the email to set a new password.
          </p>
        </div>

        {/* ⚠️ Dev-only notice since default Appwrite mailer only works for project owner */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg py-2.5 px-3 text-left w-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="mt-0.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-xs text-amber-800">
            <strong>Dev note:</strong> Appwrite&apos;s default mailer only delivers to the project owner&apos;s email.
            To send to any address, configure SMTP in Appwrite Console → Settings → SMTP.
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={() => { setView('forgot'); setForgotEmail('') }}
            className="text-sm text-[#203C67] font-semibold underline underline-offset-2 cursor-pointer"
          >
            Try a different email
          </button>
          <button
            onClick={() => setView('login')}
            className="text-sm text-gray-500 underline underline-offset-2 cursor-pointer"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  // VIEW: forgot — email input step
  if (view === 'forgot') {
    return (
      <div className="w-full flex flex-col gap-5">
        {/* Back button */}
        <button
          onClick={() => setView('login')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer w-fit"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to login
        </button>

        <div>
          <h2 className="text-xl font-semibold text-[#203C67] mb-1">Reset your password</h2>
          <p className="text-sm text-gray-500">
            Enter the email address linked to your account and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-700">Email Address</label>
          <input
            type="email"
            value={forgotEmail}
            onChange={(e) => {
              setForgotEmail(e.target.value)
              setForgotEmailError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendReset()}
            placeholder="johndoe@example.com"
            className={`h-10 border rounded-lg px-3 text-sm outline-none transition-colors bg-white
              ${forgotEmailError
                ? 'border-red-400 focus:border-red-500'
                : 'border-gray-200 focus:border-[#8FABD4]'
              }`}
          />
          {forgotEmailError && (
            <span className="text-xs text-red-500">{forgotEmailError}</span>
          )}
        </div>

        <button
          onClick={handleSendReset}
          disabled={isSendingReset}
          className="w-full h-11 bg-[#203C67] text-white rounded-lg text-sm font-semibold
            disabled:opacity-60 cursor-pointer hover:bg-[#162d50] transition-colors"
        >
          {isSendingReset ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </div>
    )
  }

  // VIEW: login — main login form
  return (
    <div className="w-full">
      <span className="absolute bg-[#8FABD4] px-3 py-1 rounded-full text-sm">Patient</span>
      <div className="flex items-center gap-14 mb-18">
        <div className="w-full flex flex-col justify-center items-center">
          <h2 className="text-gray-900 font-heading1 text-[23px]">Welcome Back</h2>
          <p className="text-[#6B7280] mt-[2px] text-sm">Log in to access your health dashboard</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 mt-10">
          <CustomFormField
            fieldType={FormFieldType.INPUT}
            control={form.control}
            name='email'
            label='Email Address'
            iconSrc={emailImage}
            iconAlt="Email Icon"
            placeholder='johndoe@example.com'
          />

          <div className="relative">
            <CustomFormField
              fieldType={FormFieldType.PASSWORD}
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
            />
            {/* ✅ Now triggers the inline forgot view instead of a static message */}
            <button
              type="button"
              onClick={() => {
                // Pre-fill forgot email from whatever they typed in the login form
                const currentEmail = form.getValues('email')
                if (currentEmail) setForgotEmail(currentEmail)
                setView('forgot')
              }}
              className="absolute top-0 right-0 text-[#8FABD4] text-xs font-semibold underline underline-offset-2 cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          {/* Unverified email banner */}
          {unverifiedEmail && (
            <div className="flex flex-col gap-2 bg-amber-50 border border-amber-200 rounded-lg py-3 px-4">
              <div className="flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs text-amber-800">
                  <strong>{unverifiedEmail}</strong> is not verified yet.
                  Check your inbox or click below to resend.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending}
                className="self-start text-xs font-semibold text-[#203C67] underline underline-offset-2 disabled:opacity-50 cursor-pointer"
              >
                {resending ? 'Sending...' : 'Resend verification email →'}
              </button>
            </div>
          )}

          <SubmitButton
            isLoading={isLoading}
            className="w-full bg-[#203C67] text-white py-4 border-none rounded-lg cursor-pointer mt-4"
          >
            Log In
          </SubmitButton>
        </form>
      </Form>

      <div className="flex w-full justify-center items-center gap-3 my-4">
        <div className="flex-1 h-px bg-[#E5E7EB]" />
        <span className="text-sm text-[#9CA3AF]">or</span>
        <div className="flex-1 h-px bg-[#E5E7EB]" />
      </div>

      <p className="text-center text-sm text-[#6B7280]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => { setOpenSignIn(true); onClose() }}
          className="text-[#203C67] font-semibold underline underline-offset-2"
        >
          Sign up for free
        </button>
      </p>
    </div>
  )
}