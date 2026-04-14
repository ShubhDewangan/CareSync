/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(root)/page.tsx
'use client'
import Image from 'next/image'
import Sidebar from '@/components/ui/Sidebar'
import { Input } from '@/components/ui/input'
import neuroImg from '../../public/assets/images/neuro_icon_temp.png'
import dermaImg from '../../public/assets/images/derma_icon_temp.png'
import dentistImg from '../../public/assets/images/dentist_icon_temp.png'
import surgeonImg from '../../public/assets/images/surgeon_icon_temp.png'
import psyImg from '../../public/assets/images/psychiatrist_icon_temp.png'
import gynaeImg from '../../public/assets/images/gynae_icon_temp.png'
import pediaImg from '../../public/assets/images/pedia_icon_temp.png'
import CategoryScroll from '@/components/ui/CategoryScroll'
import { Doctors } from '@/constants'
import DoctorCard from '@/components/ui/DoctorCard'
import { Suspense, useEffect, useState } from 'react'
import { getPatient } from '@/lib/actions/patient.actions'
import { getDoctor } from '@/lib/actions/doctor.actions'
import { Patient, Doctor, Appointment } from '@/types/appwrite'
import { useRouter, useSearchParams } from 'next/navigation'
import PasskeyModal from '@/components/ui/PasskeyModal'
import { decryptKey } from '@/lib/utils'
import { recentAppointments } from '@/lib/actions/appointment.actions'

const categories = [
  { tag: 'Neurologist', image: neuroImg },
  { tag: 'Gynaecologist', image: gynaeImg },
  { tag: 'Dentist', image: dentistImg },
  { tag: 'Dermatologist', image: dermaImg },
  { tag: 'Surgeon', image: surgeonImg },
  { tag: 'Psychiatrist', image: psyImg },
  { tag: 'Pediatrician', image: pediaImg },
]

type AuthUser = {
  $id: string
  name: string
  email: string
  userType: "patient" | "doctor"
} | null

type FullUser =
  | (Patient & { userType: "patient" })
  | (Doctor & { userType: "doctor" })
  | null

function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdmin = searchParams.get('admin') === 'true'

  const [authUser, setAuthUser] = useState<AuthUser>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [fullUser, setFullUser] = useState<FullUser>(null)
  const [fullUserChecked, setFullUserChecked] = useState(false)
  const [sidebarStats, setSidebarStats] = useState<{
    upcoming: number
    lastVisitDoctor?: string
    lastVisitDate?: string
    active?: number
  }>({ upcoming: 0 })

  // ── Auto-login ───────────────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/user')
        const data = await res.json()
        setAuthUser(data ?? null)
      } catch {
        setAuthUser(null)
      } finally {
        setAuthChecked(true)
      }
    }
    checkSession()
  }, [])

  // ── Load full user from DB ───────────────────────────────────────
  useEffect(() => {
    if (!authUser) { setFullUser(null); return }

    async function loadFullUser() {
      try {
        if (authUser!.userType === "patient") {
          const patient = await getPatient(authUser!.$id)
          setFullUser(patient ? { ...patient as any, userType: "patient" } : null)
        } else {
          const doctor = await getDoctor(authUser!.$id)
          setFullUser(doctor ? { ...doctor as any, userType: "doctor" } : null)
        }
      } catch {
        setFullUser(null)
      } finally {
        setFullUserChecked(true)
      }
    }
    loadFullUser()
  }, [authUser])

  // ── Ctrl+A → /?admin=true ────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault()
        router.push('/?admin=true')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

    // const encryptedKey = typeof window !== 'undefined'
    //   ? window.localStorage.getItem('accessKey')
    //   : null
  
    // // ── Auto-validate if key already stored ──────────────────────────
    // useEffect(() => {
    //   const accessKey = encryptedKey && decryptKey(encryptedKey)
    //   if (accessKey === process.env.NEXT_PUBLIC_ADMIN_PASSKEY) {
    //     router.push('/admin')
    //   }
    // }, [encryptedKey, router])

  // ── Logout ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return
  
    async function loadStats() {
      try {
        const appointmentData = await recentAppointments()
        const now = new Date()
  
        const appointments: Appointment[] =
          ((appointmentData?.documents as unknown as Appointment[]) ?? [])
            .filter((a) => a.userId === authUser!.$id)
            .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())
  
        const upcoming = appointments.filter(
          (a) => a.status === "scheduled" && new Date(a.schedule) > now
        ).length
  
        const lastVisit = appointments
          .filter((a) => new Date(a.schedule) < now && a.status !== "cancelled")
          .sort((a, b) => {
            const diff = new Date(b.schedule).getTime() - new Date(a.schedule).getTime()
            if (diff !== 0) return diff
            return a.primaryDoctor.localeCompare(b.primaryDoctor)
          })[0]

        const active = appointments.filter(
          (a) => (a.status === 'scheduled' || a.status === 'pending') && new Date(a.schedule) > now 
        ).length
  
        setSidebarStats({
          active,
          upcoming,
          lastVisitDoctor: lastVisit?.primaryDoctor,
          lastVisitDate: lastVisit
            ? new Date(lastVisit.schedule).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : undefined,
        })
      } catch (e) {
        console.error('Failed to load sidebar stats:', e)
      }
    }
  
    loadStats()
  }, [authUser]) // re-runs whenever user changes
  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch { /* still clear */ }
    setAuthUser(null)
    setFullUser(null)
    setFullUserChecked(false)
  }

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#EFECE3]">
        <div className="w-8 h-8 border-4 border-[#203C67] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Replace your stats function and the broken Sidebar props with this:



  return (
    <div className="flex h-screen max-h-screen bg-[#EFECE3]">

      {/* PasskeyModal — only when ?admin=true */}
      {isAdmin && <PasskeyModal />}

      <Sidebar
        admin={typeof window !== 'undefined' && !!localStorage.getItem('accessKey')}
        authUser={authUser}
        fullUser={fullUser}
        fullUserChecked={fullUserChecked}
        onLogout={handleLogout}
        stats={sidebarStats}
      />

      <section className='flex-1 justify-center overflow-x-auto remove-scrollbar'>
        <div className='flex justify-between items-center p-5'>
          <div className='flex bg-[#8FABD4] rounded-full w-[600px] px-3 border-[1px] border-[#203C67]'>
            <Image src='/assets/icons/hamburger.svg' alt='hamburger' height={24} width={24} className='cursor-pointer' />
            <Input placeholder='Search for Doctors | Clinics ...' className='border-none text-white' />
            <Image src='/assets/icons/search.svg' alt='search' height={20} width={20} className='cursor-pointer' />
          </div>

          {/* Admin button — only when not logged in */}
          {!authUser && (
            <button
              onClick={() => router.push('/?admin=true')}
              className=" text-[#737373] text-[12px] px-4 py-2 rounded-full border hover:border-[1.5px] hover:border-[#162d50] transition-colors"
            >
              Admin?
            </button>
          )}
        </div>

        <div className='flex justify-center w-full text-center'>
          <p className='w-[80%] p-10 text-sm text-gray-600'>
            <i>This Project is made by Shubh Dewangan to make the appointment process helpful and clean for patients,
            also accessible by themselves <span className='text-[#297EFF]'>no need to rely on others</span>,
            makes the process much easy because <span className='text-[#297EFF]'>
            this website asks patients every document(s) at once 😉.</span></i>
          </p>
        </div>

        <div className='w-full flex flex-col gap-3 justify-center text-center'>
          <div className='flex flex-col gap-3'>
            <h3>There are many Doctors helping us in these categories given below...</h3>
            <h3><i>{`{ Select one to see every doctor in the respective category! }`}</i></h3>
          </div>
          <CategoryScroll categories={categories} />
        </div>

        <div className='bg-[#8FABD4] h-auto w-[95%] flex p-5 gap-5 rounded-2xl mt-5 flex-wrap items-center justify-center mx-auto mb-5 border-[4px] border-[#203C67]'>
          {Doctors.map((doctor, idx) => (
            <DoctorCard
              doctor={doctor}
              key={idx}
              userId={authUser?.$id as string}
              patientId={fullUser?.$id as string}
              authUser={authUser as unknown as AuthUser}
              fullUser={fullUser as FullUser}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}