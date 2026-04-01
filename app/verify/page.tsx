/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

// This page handles the email verification link click:
// /verify?userId=xxx&secret=yyy

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const userId = searchParams.get('userId')
    const secret = searchParams.get('secret')

    if (!userId || !secret) {
      setStatus('error')
      setMessage('Invalid verification link. Please try signing up again.')
      return
    }

    const verify = async () => {
      try {
        // Call our server action to mark user as verified using the token
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, secret }),
        })

        const data = await res.json()

        if (data.success) {
          setStatus('success')
          setMessage('Email verified! Redirecting you to login...')
          setTimeout(() => router.push('/?login=true'), 2500)
        } else {
          setStatus('error')
          setMessage(data.message || 'Verification failed. The link may have expired.')
        }

      } catch (error) {
        console.log('Verification error:', error)
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verify()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center p-4">
      <div className="bg-white border-4 border-[#203C67] rounded-2xl p-10 max-w-md w-full text-center shadow-xl">

        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-[#8FABD4] border-t-[#203C67] rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-[#203C67] mb-2">Verifying your email...</h2>
            <p className="text-sm text-gray-500">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#203C67] mb-2">Email Verified!</h2>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#203C67] mb-2">Verification Failed</h2>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#203C67] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#162d50] transition-colors"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  )
}