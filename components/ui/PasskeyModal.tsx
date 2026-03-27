'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
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
import { usePathname, useRouter } from "next/navigation"
import { decryptKey, encryptKey } from "@/lib/utils"

const PasskeyModal = () => {
    const router = useRouter()
  const [open, setOpen] = useState(true)
  const [passkey, setPasskey] = useState('')
  const [error, setError] = useState('')
  const path = usePathname()

  const encryptedKey = typeof window !== 'undefined' ? window.localStorage.getItem('accessKey') : null

  useEffect(() => {
    const accessKey = encryptedKey && decryptKey(encryptedKey)
    if (path) {
        if (accessKey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOpen(false)
            router.push('/admin')
    } else {
        setOpen(true)
    }
    }
  },[encryptedKey])

  const validatePasskey = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();

    if (passkey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
        setError('')
        const encryptedKey = encryptKey(passkey)

        localStorage.setItem('accessKey', encryptedKey)

        setOpen(false)
    } else {
        setError('Invalid Passkey. Please try again!')
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="shad-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex w-full justify-between">
            <p>Admin Access Verification</p>
            <Image
                src='/assets/icons/close.svg'
                alt="close"
                height={20}
                width={20}
                onClick={() => {
                    setOpen(false)
                    router.push('/')
                }}
                className="cursor-pointer"
            />
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please enter Passkey to enter as Admin!
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="">
            <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} value={passkey} onChange={(value) => setPasskey(value)}>
                <InputOTPGroup className="shad-otp gap-3">
                    <InputOTPSlot className="shad-otp-slot" index={0} />
                    <InputOTPSlot className="shad-otp-slot" index={1} />
                    <InputOTPSlot className="shad-otp-slot" index={2} />
                    <InputOTPSlot className="shad-otp-slot" index={3} />
                    <InputOTPSlot className="shad-otp-slot" index={4} />
                    <InputOTPSlot className="shad-otp-slot" index={5} />
                </InputOTPGroup>
            </InputOTP>

            {
                error && <p className="shad-error text-14-regular mt-4 flex justify-center">
                    {error}
                </p>
            }
        </div>

          <AlertDialogAction onClick={(e) => {
            validatePasskey(e)
          }}
          className="shad-primary-btn py-5 w-full">
            Enter Admin Passkey
          </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default PasskeyModal
