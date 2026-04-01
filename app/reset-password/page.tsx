'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { completePasswordReset } from '@/lib/actions/auth.actions'

// Appwrite redirects here after user clicks the reset link in email:
// https://yourapp.com/reset-password?userId=xxx&secret=yyy

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const userId = searchParams.get('userId')
  const secret = searchParams.get('secret')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState('')

  // Invalid link — no userId or secret in URL
  if (!userId || !secret) {
    return (
      <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-[#203C67] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#203C67] mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-gray-500 mb-6">This link is invalid or has already been used.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#203C67] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#162d50] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  function validate() {
    const newErrors: { password?: string; confirm?: string } = {}

    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.'
    }
    if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      const res = await completePasswordReset({ userId, secret, password })

      if (res.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(res.message || 'Reset failed. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-[#203C67] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#203C67] mb-2">Password Updated!</h2>
          <p className="text-sm text-gray-500 mb-6">Your password has been reset. You can now log in with your new password.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#203C67] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#162d50] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-[#203C67] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#203C67] mb-2">Reset Failed</h2>
          <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#203C67] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#162d50] transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center p-4">
      <div className="bg-white border-4 border-[#203C67] rounded-2xl p-10 max-w-md w-full shadow-xl">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[#203C67] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EFECE3" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#203C67]">Set New Password</h2>
            <p className="text-sm text-gray-500">Choose a strong password for your account.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors(prev => ({ ...prev, password: undefined }))
              }}
              placeholder="At least 8 characters"
              className={`h-10 border rounded-lg px-3 text-sm outline-none transition-colors
                ${errors.password ? 'border-red-400' : 'border-gray-200 focus:border-[#8FABD4]'}`}
            />
            {errors.password && (
              <span className="text-xs text-red-500">{errors.password}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setErrors(prev => ({ ...prev, confirm: undefined }))
              }}
              placeholder="Repeat your new password"
              className={`h-10 border rounded-lg px-3 text-sm outline-none transition-colors
                ${errors.confirm ? 'border-red-400' : 'border-gray-200 focus:border-[#8FABD4]'}`}
            />
            {errors.confirm && (
              <span className="text-xs text-red-500">{errors.confirm}</span>
            )}
          </div>

          {/* Password strength hint */}
          <ul className="text-xs text-gray-400 flex flex-col gap-1 pl-1">
            <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-green-600' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {password.length >= 8
                  ? <polyline points="20 6 9 17 4 12"/>
                  : <circle cx="12" cy="12" r="10"/>
                }
              </svg>
              At least 8 characters
            </li>
            <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {/[A-Z]/.test(password)
                  ? <polyline points="20 6 9 17 4 12"/>
                  : <circle cx="12" cy="12" r="10"/>
                }
              </svg>
              At least one uppercase letter
            </li>
            <li className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {/[0-9]/.test(password)
                  ? <polyline points="20 6 9 17 4 12"/>
                  : <circle cx="12" cy="12" r="10"/>
                }
              </svg>
              At least one number
            </li>
          </ul>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#203C67] text-white rounded-lg text-sm font-semibold
              disabled:opacity-60 cursor-pointer hover:bg-[#162d50] transition-colors mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}