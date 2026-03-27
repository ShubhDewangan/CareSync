'use client'

import { logoutUserAndRedirect } from "@/lib/actions/auth.actions"

const SignOutButton = () => {
  return (
    <form action={logoutUserAndRedirect}>
      <button type="submit" className="dash-signout text-2xl">
        → Sign Out
      </button>
    </form>
  )
}

export default SignOutButton
