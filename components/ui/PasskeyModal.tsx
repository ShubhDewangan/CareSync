/* eslint-disable react-hooks/set-state-in-effect */
// components/ui/PasskeyModal.tsx
'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { decryptKey, encryptKey } from "@/lib/utils"

const PasskeyModal = () => {
  const router = useRouter()
  const [open, setOpen] = useState(true)
  const [passkey, setPasskey] = useState('')
  const [error, setError] = useState('')

  const encryptedKey = typeof window !== 'undefined'
    ? window.localStorage.getItem('accessKey')
    : null

  // ── Auto-validate if key already stored ──────────────────────────
  useEffect(() => {
    const accessKey = encryptedKey && decryptKey(encryptedKey)
    if (accessKey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
      setOpen(false)
      router.push('/admin')
    }
  }, [encryptedKey])

  // ── Validate passkey on submit ───────────────────────────────────
  function validatePasskey(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()

    if (passkey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
      setError('')
      localStorage.setItem('accessKey', encryptKey(passkey))
      setOpen(false)
      router.push('/admin')   // ← redirect to admin
    } else {
      setError('Invalid passkey. Please try again!')
      setPasskey('')
    }
  }

  // ── Close modal → go back to homepage ───────────────────────────
  function handleClose() {
    setOpen(false)
    router.push('/')
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex w-full justify-between items-center">
            <p>Admin Access Verification</p>
            <Image
              src='/assets/icons/close.svg'
              alt="close"
              height={20}
              width={20}
              onClick={handleClose}
              className="cursor-pointer"
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please enter the 6-digit passkey to access the admin panel.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div>
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
            value={passkey}
            onChange={(value) => setPasskey(value)}
            onComplete={(value) => {
              // Auto submit when all 6 digits entered
              if (value === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
                setError('')
                localStorage.setItem('accessKey', encryptKey(value))
                setOpen(false)
                router.push('/admin')
              } else {
                setError('Invalid passkey. Please try again!')
                setPasskey('')
              }
            }}
          >
            <InputOTPGroup className="shad-otp gap-3">
              <InputOTPSlot className="shad-otp-slot" index={0} />
              <InputOTPSlot className="shad-otp-slot" index={1} />
              <InputOTPSlot className="shad-otp-slot" index={2} />
              <InputOTPSlot className="shad-otp-slot" index={3} />
              <InputOTPSlot className="shad-otp-slot" index={4} />
              <InputOTPSlot className="shad-otp-slot" index={5} />
            </InputOTPGroup>
          </InputOTP>

          {error && (
            <p className="shad-error text-14-regular mt-4 flex justify-center">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={validatePasskey}
          className="shad-primary-btn py-5 w-full mt-2"
        >
          Enter Admin Passkey
        </button>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PasskeyModal