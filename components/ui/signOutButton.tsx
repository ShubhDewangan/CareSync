'use client'

import { logoutUserAndRedirect } from "@/lib/actions/auth.actions"
import Image from 'next/image'

const SignOutButton = () => {
  return (
    <form action={logoutUserAndRedirect}>
      <button type="submit"className='flex items-center justify-center text-[#d23737]'>
          <Image
            src='/assets/icons/exit.svg'
            alt='settings'
            height={30}
            width={30}
          />
          Sign Out
      </button>
    </form>
  )
}

export default SignOutButton
