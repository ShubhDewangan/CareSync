'use client'

import { useRouter } from "next/navigation"

const SignOutButton = () => {
    const router = useRouter()

    const handleSignOut = () => {
        localStorage.removeItem('signinKey')
        router.push('/')
    }
  return (
    <button onClick={handleSignOut} className="dash-signout text-2xl">
        → Sign Out
    </button>
  )
}

export default SignOutButton
