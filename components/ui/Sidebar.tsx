// components/ui/Sidebar.tsx
"use client"

import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from "next/link"
import SignOutButton from '@/components/ui/signOutButton'
import { Patient, Doctor } from '@/types/appwrite'

// From JWT — always available after mount
type AuthUser = {
  $id: string
  name: string
  userType: "patient" | "doctor"
  email: string
} | null

// From DB — loads after authUser, has profilePic + registrationComplete
type FullUser =
  | (Patient & { userType: "patient" })
  | (Doctor & { userType: "doctor" })
  | null

interface SidebarProps {
  admin: boolean
  authUser: AuthUser
  fullUser: FullUser
  fullUserChecked: boolean
  onLogout: () => void
  stats?: {
    upcoming: number
    lastvisitDoctor?: string
    lastvisitDate?: string
    active?: number
  }
}

export default function Sidebar({ authUser, fullUser, fullUserChecked, onLogout, stats }: SidebarProps) {
  const router = useRouter()

  // ─── Routing helpers ──────────────────────────────────────────────
  const dashboardRoute = authUser
    ? authUser.userType === "patient"
      ? `/patients/${authUser.$id}/dashboard`
      : `/doctors/${authUser.$id}/dashboard`
    : null

  const registerRoute = authUser
    ? authUser.userType === "patient"
      ? `/patients/${authUser.$id}/register`
      : `/doctors/${authUser.$id}/register`
    : null

  // profilePic: use fullUser's if available, else default
  const profilePic = fullUser?.profilePic || '/assets/images/user_default.webp'

  // registrationComplete: only true if fullUser exists from DB
  const registrationComplete = !!fullUser

  return (
    <div className='max-w-[300px] bg-[#EFECE3] w-[300px] ml-5 my-5 rounded-xl flex flex-col items-center drop-shadow-2xl drop-shadow-black z-10'>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className='border-[1px] border-[#203C67] w-full rounded-t-2xl flex flex-col justify-center items-center'>
        <Image
          src='/logo.png'
          alt='logo'
          height={1000}
          width={1000}
          className='mt-2 h-20 w-fit'
        />
        
        {authUser ? (
          // ── Logged in ─────────────────────────────────────────────
          <div className='flex flex-col justify-center items-center gap-2 w-full px-2 pb-5'>
            <div className='flex gap-2 items-center justify-center'>
              <Image
                src={profilePic || 'assets/images/user_default.webp'}
                alt='profile pic'
                height={1000}
                width={1000}
                className='h-20 w-20 rounded-full object-cover'
              />
              <div>
                {/* Name from authUser — available instantly from JWT */}
                <h2 className='text-[20px] font-semibold'>{authUser.name}</h2>
                {/* Email from fullUser — shows once DB loads */}
                {authUser.email && <h4 className='text-[12px]'>{authUser.email}</h4>}
                {/* Small loading indicator while fullUser loads */}
                {!fullUser && !fullUserChecked && (
                  <div className='flex items-center gap-1 mt-1'>
                    <div className='w-3 h-3 border-2 border-[#203C67] border-t-transparent rounded-full animate-spin' />
                    <span className='text-[11px] text-gray-400'>Loading profile...</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              {(registrationComplete) ? (
                // Has DB record → show dashboard link
                <Link
                  href={dashboardRoute!}
                  className='bg-[#8FABD4] text-[14px] rounded-full py-1 px-2 border-[1px] border-[#848282]'
                >
                  Your Dashboard
                </Link>
              ) : fullUser ? (
                // authUser exists but fullUser not loaded yet — show skeleton
                // Once fullUser loads, either dashboard or register shows
                <div className='bg-[#8FABD4] rounded-full px-3 py-2 border-[1px] border-[#848282] opacity-50 text-[13px]'>
                  Loading...
                </div>
              ) : (
                // fullUser loaded but null → no registration yet
                <Link
                  href={registerRoute!}
                  className='bg-[#8FABD4] text-[13px] rounded-full py-1 px-2 border-[1px] border-[#848282]'
                >
                  Complete Registration
                </Link>
              )}
            </div>
          </div>
        ) : (
          // ── Not logged in ─────────────────────────────────────────
          <div className='flex w-full items-center justify-center gap-3 px-5 pb-5'>
            <Image
              src='/assets/images/user_default.webp'
              alt='profile pic'
              height={1000}
              width={1000}
              className='h-20 w-fit'
            />
            <div className='flex flex-col gap-2 items-center justify-center'>
              <button
                onClick={() => router.push('/signin')}
                className='bg-[#203C67] py-1 border-[1px] border-[#203C67] text-white rounded-2xl min-w-[130px]'
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/login')}
                className='bg-transparent py-1 border-[1px] border-[#203C67] rounded-2xl min-w-[130px]'
              >
                Log In?
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Menu ───────────────────────────────────────────────────── */}
      <div className='border-x-[1px] border-[#203C67] w-full p-2'>
        <h3 className='mb-2'>MENU</h3>
        <div className='flex flex-col gap-2'>
          <Link href='/Doctors' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>
            Find Doctors
          </Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>
            Hospitals/Clinic
          </Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>
            Prescriptions
          </Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>
            Medical Records
          </Link>
        </div>
      </div>

      {/* ── Quick Stats ─────────────────────────────────────────────── */}
      <div className='border-[1px] border-[#203C67] w-full p-2'>
        <h3 className='mb-2'>QUICK STATS</h3>
        <div className='flex flex-col w-full gap-2'>
          <div className='flex gap-2'>
            <div className='bg-[#FFFFFF] flex-1 rounded-md p-5'>
              <span>Upcoming</span>
              <h3 className='text-blue-800 font-semibold'>{stats?.upcoming}</h3>
              <span className='text-[13px]'>appointments</span>
            </div>
            <div className='bg-[#FFFFFF] rounded-md p-5'>
              <span>Active</span>
              <h3 className='text-green-700 font-semibold'>{stats?.active}</h3>
              <span className='text-[13px]'>prescriptions</span>
            </div>
          </div>
          <div className='flex items-center justify-between rounded-md p-5 bg-[#FFFFFF]'>
            <div>
              <span>Last visit</span>
              <h2 className='font-semibold'>{stats?.lastvisitDoctor || 'You have not visited any Doctor'}</h2>
            </div>
            <span>{stats?.lastvisitDate}</span>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className='flex flex-1 flex-col w-full rounded-b-2xl justify-center items-center gap-2 p-2 border-b-[1px] border-x-[1px] border-[#203C67]'>
        <div className='w-full flex justify-center px-5'>
          {/* <div className='flex items-center justify-center text-gray-700'>
            <Image
              src='/assets/icons/settings.svg'
              alt='settings'
              height={30}
              width={30}
            />
            Settings
          </div> */}
          {/* SignOutButton calls onLogout */}
          <SignOutButton onLogout={onLogout}/>
        </div>
        <span className='text-red-800 mt-2'><Link href='/help'>Help?</Link> | <Link href='/help/how-to-use'>How to Use!</Link></span>
      </footer>

    </div>
  )
}