/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(root)/page.tsx
'use client'
import Image from 'next/image'
import Sidebar from '@/components/ui/Sidebar'
import { Input } from '@/components/ui/input'
import neuroImg from '../../public/assets/images/neurology.png'
import dermaImg from '../../public/assets/images/dermatology.png'
import dentistImg from '../../public/assets/images/dentistry.png'
import surgeonImg from '../../public/assets/images/surgery.png'
import psyImg from '../../public/assets/images/general_medicine.png'
import gynaeImg from '../../public/assets/images/gynecology.png'
import pediaImg from '../../public/assets/images/pediatrics.png'
import CategoryScroll from '@/components/ui/CategoryScroll'
import DoctorCard from '@/components/ui/DoctorCard'
import { Suspense, useEffect, useState } from 'react'
import { getPatient } from '@/lib/actions/patient.actions'
import { getAllDoctors, getDoctor } from '@/lib/actions/doctor.actions'
import { Patient, Doctor, Appointment } from '@/types/appwrite'
import { useRouter, useSearchParams } from 'next/navigation'
import PasskeyModal from '@/components/ui/PasskeyModal'
import { recentAppointments } from '@/lib/actions/appointment.actions'
import Link from 'next/link'

const categories = [
  { tag: 'Neurologist',    image: neuroImg   },
  { tag: 'Gynaecologist',  image: gynaeImg   },
  { tag: 'Dentist',        image: dentistImg },
  { tag: 'Dermatologist',  image: dermaImg   },
  { tag: 'Surgeon',        image: surgeonImg },
  { tag: 'Psychiatrist',   image: psyImg     },
  { tag: 'Pediatrician',   image: pediaImg   },
]

const STATS = [
  { value: '2,400+', label: 'Fake Appointments Booked' },
  { value: '120+',   label: 'Verified fake Doctors'    },
  { value: '18+',    label: 'Specializations (10 se jyada nhi honge btw)'     },
  { value: '4.8★',   label: 'Average fake Rating'      },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create your profile',    desc: 'Sign up and fill in your health details once — allergies, medications, history, everything.' },
  { step: '02', title: 'Find a doctor',          desc: 'Browse by specialization, filter by availability, and read doctor profiles.' },
  { step: '03', title: 'Book a slot instantly',  desc: 'Pick a date and time that works for you. Confirmation is immediate.' },
  { step: '04', title: 'Get your prescription',  desc: 'After your visit, your prescription and records are stored digitally.' },
]

type AuthUser = {
  $id: string
  name: string
  email: string
  userType: "patient" | "doctor"
} | null

type FullUser =
  | (Patient & { userType: "patient" })
  | (Doctor  & { userType: "doctor"  })
  | null

function Home() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const isAdmin      = searchParams.get('admin') === 'true'

  const [authUser,        setAuthUser]        = useState<AuthUser>(null)
  const [authChecked,     setAuthChecked]     = useState(false)
  const [fullUser,        setFullUser]        = useState<FullUser>(null)
  const [fullUserChecked, setFullUserChecked] = useState(false)
  const [mounted,         setMounted]         = useState(false)
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const [sidebarStats,    setSidebarStats]    = useState<{
    upcoming: number; lastVisitDoctor?: string; lastVisitDate?: string; active?: number
  }>({ upcoming: 0 })
  const [Doctors, setDoctors] = useState<Doctor[] | null>(null)
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => { setTimeout(() => setMounted(true), 60) }, [])

  // Close sidebar on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadDoctors() {
      try {
        const doctors = await getAllDoctors()
        setDoctors(doctors)
      } catch {
        setDoctors([])
      } finally {
        setDoctorsLoading(false)
      }
    }
    loadDoctors()
  }, [])

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
      } catch { setFullUser(null) }
      finally  { setFullUserChecked(true) }
    }
    loadFullUser()
  }, [authUser])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); router.push('/?admin=true') }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  useEffect(() => {
    if (!authUser) return
    async function loadStats() {
      try {
        const appointmentData = await recentAppointments()
        const now = new Date()
        const appointments: Appointment[] =
          ((appointmentData?.documents as unknown as Appointment[]) ?? [])
            .filter(a => a.userId === authUser!.$id)
            .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

        const upcoming  = appointments.filter(a => a.status === "scheduled" && new Date(a.schedule) > now).length
        const lastVisit = appointments
          .filter(a => new Date(a.schedule) < now && a.status !== "cancelled")
          .sort((a, b) => {
            const diff = new Date(b.schedule).getTime() - new Date(a.schedule).getTime()
            return diff !== 0 ? diff : a.primaryDoctor.localeCompare(b.primaryDoctor)
          })[0]
        const active = appointments.filter(
          a => (a.status === 'scheduled' || a.status === 'pending') && new Date(a.schedule) > now
        ).length

        setSidebarStats({
          active, upcoming,
          lastVisitDoctor: lastVisit?.primaryDoctor,
          lastVisitDate: lastVisit
            ? new Date(lastVisit.schedule).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
            : undefined,
        })
      } catch {}
    }
    loadStats()
  }, [authUser])

  useEffect(() => {
    async function checkSession() {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res  = await fetch('/api/user', { signal: controller.signal })
        clearTimeout(timeout)
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

  async function handleLogout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    setAuthUser(null); setFullUser(null); setFullUserChecked(false)
  }

  if (!authChecked) return (
    <div className="flex h-screen items-center justify-center bg-[#EFECE3]">
      <div className="w-8 h-8 border-4 border-[#203C67] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex h-screen max-h-screen bg-[#EFECE3] font-sans overflow-hidden">
      {isAdmin && <PasskeyModal />}

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:flex-shrink-0
      `}>
        <Sidebar
          admin={typeof window !== 'undefined' && !!localStorage.getItem('accessKey')}
          authUser={authUser}
          fullUser={fullUser}
          fullUserChecked={fullUserChecked}
          onLogout={handleLogout}
          stats={sidebarStats}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Main scrollable area ── */}
      <section className="flex-1 overflow-y-auto remove-scrollbar min-w-0">

        {/* ── Sticky topbar ── */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-3 gap-3"
          style={{ background: "rgba(239,236,227,0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(32,60,103,0.1)" }}
        >
          {/* Hamburger — always visible, triggers sidebar */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#203C6710] transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Image src="/assets/icons/hamburger.svg" alt="menu" width={20} height={20} />
          </button>

          {/* Search bar */}
          <div className="flex bg-white/50/70 border border-[#21262eb0] rounded-full px-3 sm:px-4 py-2 gap-2 items-center flex-1 max-w-[500px]">
            <Image src='/assets/icons/search.svg' alt='search' height={16} width={16} className='opacity-50 flex-shrink-0' />
            <Input
              placeholder='Search doctors, specializations…'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/doctors?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              }}
              className='border-none bg-transparent text-[13px] text-gray-600 placeholder:text-gray-400 focus-visible:ring-0 p-0 h-auto min-w-0'
            />
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!authUser && (
              <>
                <Link href="/signin" className="hidden sm:block text-[13px] text-[#203C67] font-medium px-4 py-2 rounded-full border border-[#203C6730] hover:bg-[#203C6710] transition-colors">
                  Sign in
                </Link>
                <Link href="/signin" className="text-[12px] sm:text-[13px] text-white font-medium px-3 sm:px-4 py-2 rounded-full bg-[#203C67] hover:bg-[#2d5494] transition-colors whitespace-nowrap">
                  Get started
                </Link>
                <button
                  onClick={() => router.push('/?admin=true')}
                  className="hidden md:block text-[11px] text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#203C67] transition-colors"
                >
                  Admin
                </button>
              </>
            )}
            {authUser && (
              <span className="text-[12px] sm:text-[13px] text-gray-600 hidden sm:block">
                Welcome, <span className="font-semibold text-[#203C67]">{authUser.name.split(" ")[0]}</span>
              </span>
            )}
          </div>
        </div>

        {/* ── Hero ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #e8f0e4 0%, #d8e8d0 40%, #c8dac0 100%)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
          className="mx-3 sm:mx-5 mt-4 rounded-2xl px-5 sm:px-10 py-8 sm:py-12 flex items-center justify-between overflow-hidden relative gap-6"
        >
          {/* Decorative circles */}
          <div className="absolute right-0 top-0 w-72 h-72 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #3d6b3f, transparent)", transform: "translate(30%, -30%)" }} />
          <div className="absolute right-20 bottom-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #203C67, transparent)", transform: "translateY(40%)" }} />

          <div className="flex flex-col gap-4 sm:gap-5 max-w-[520px] relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold bg-white/50/60 text-[#3d6b3f] border border-[#3d6b3f30] rounded-full px-3 py-1 tracking-wide uppercase">
                Healthcare · Simplified
              </span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-bold text-[#1a2e10] leading-tight">
              Book your doctor,<br />
              <span style={{ color: "#3d6b3f" }}>skip the wait.</span>
            </h1>
            <p className="text-[13px] text-[#3a4a2a] leading-relaxed opacity-80 max-w-md hidden sm:block">
              CareSync connects you with verified doctors instantly. Your health records, prescriptions, and appointments — all in one place.
            </p>
            <div className="flex gap-3 items-center flex-wrap">
              <Link
                href={authUser ? `/patients/${authUser.$id}/dashboard` : "/signin"}
                className="text-[12px] sm:text-[13px] font-semibold bg-[#2a3320] text-[#e8ede0] px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-[#3d6b3f] transition-colors whitespace-nowrap"
              >
                {authUser ? "Go to Dashboard →" : "Book an Appointment →"}
              </Link>
              <a
                href="#doctors"
                className="text-[12px] sm:text-[13px] font-medium text-[#3d6b3f] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-[#3d6b3f50] hover:bg-white/50/40 transition-colors"
              >
                Browse Doctors
              </a>
            </div>
          </div>

          {/* Hero visual — hidden on mobile/tablet */}
          <div className="hidden xl:flex flex-col gap-3 relative z-10 flex-shrink-0">
            <div className="bg-white/50/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3 border border-white">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-lg">✅</div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Appointment confirmed</p>
                <p className="text-[11px] text-gray-400">Dr. Shubh · Today 11:00 AM</p>
              </div>
            </div>
            <div className="bg-white/50/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3 border border-white ml-6">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">💊</div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Prescription ready</p>
                <p className="text-[11px] text-gray-400">Amoxicillin · 500mg · 5 days</p>
              </div>
            </div>
            <div className="bg-white/50/80 backdrop-blur rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3 border border-white">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">📋</div>
              <div>
                <p className="text-[12px] font-bold text-gray-800">Lab report uploaded</p>
                <p className="text-[11px] text-gray-400">CBC Blood Test · 2 min ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div
          className="mx-3 sm:mx-5 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.6s ease 0.15s" }}
        >
          {STATS.map((s, i) => (
            <div key={i} className="bg-white/50/60 border border-[#203C6715] rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-center">
              <p className="text-[18px] sm:text-[22px] font-bold text-[#203C67]">{s.value}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── How it works ── */}
        <div className="mx-3 sm:mx-5 mt-8 mb-2">
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1a2e10] whitespace-nowrap">How CareSync works</h2>
            <div className="flex-1 h-px bg-[#203C6715]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {HOW_IT_WORKS.map((h, i) => (
              <div
                key={i}
                className="bg-white/50/60 border border-[#203C6715] rounded-xl p-4 sm:p-5 hover:bg-white/50/80 transition-colors"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 0.5s ease ${0.1 * i + 0.2}s, transform 0.5s ease ${0.1 * i + 0.2}s`,
                }}
              >
                <span className="text-[11px] font-bold text-[#3d6b3f] bg-[#f0f7ec] border border-[#b8d4a8] rounded-full px-2 py-0.5 inline-block mb-3">
                  {h.step}
                </span>
                <p className="text-[13px] font-semibold text-[#1a2e10] mb-2">{h.title}</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Specializations ── */}
        <div className="mx-3 sm:mx-5 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1a2e10] whitespace-nowrap">Browse by specialization</h2>
            <div className="flex-1 h-px bg-[#203C6715]" />
          </div>
          <CategoryScroll categories={categories} />
        </div>

        {/* ── Doctors grid ── */}
        <div id="doctors" className="mx-3 sm:mx-5 mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1a2e10]">Our Doctors</h2>
              <div className="h-px bg-[#203C6715] w-10 sm:w-20" />
            </div>
            <span className="text-[11px] sm:text-[12px] text-gray-400">
              {doctorsLoading ? "Loading..." : `${Doctors?.length ?? 0} verified doctors`}
            </span>
          </div>

          {/* ── Doctors grid ── */}
          <div id="doctors" className="mx-3 sm:mx-5 mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-[16px] sm:text-[18px] font-bold text-[#1a2e10]">Our Doctors</h2>
                <div className="h-px bg-[#203C6715] w-10 sm:w-20" />
              </div>
              <span className="text-[11px] sm:text-[12px] text-gray-400">
                {doctorsLoading ? "Loading..." : `${Doctors?.length ?? 0} verified doctors`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
              {doctorsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-[160px] sm:w-[220px] h-[240px] sm:h-[280px] rounded-2xl bg-white/50/40 animate-pulse border border-[#203C6715]" />
                ))
              ) : Doctors && Doctors.length > 0 ? (
                Doctors.slice(0, 6).map((doctor, idx) => (
                  <DoctorCard
                    doctor={doctor as unknown as Doctor}
                    key={idx}
                    userId={authUser?.$id as string}
                    patientId={fullUser?.$id as string}
                    authUser={authUser as unknown as AuthUser}
                    fullUser={fullUser as FullUser}
                  />
                ))
              ) : (
                <p className="text-[13px] text-gray-400">No doctors found.</p>
              )}
            </div>

            {/* See More — only shown when there are more than 5 doctors */}
            {!doctorsLoading && (Doctors?.length ?? 0) > 5 && (
              <div className="flex justify-center mt-6">
                <Link
                  href="/doctors"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/50 border-[2px] border-[#203C67] text-[#203C67] text-[13px] font-semibold rounded-xl hover:bg-[#203C67] hover:text-white transition-all duration-200"
                >
                  See all {Doctors?.length} doctors
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── CTA Banner ── */}
        {!authUser && (
          <div
            className="mx-3 sm:mx-5 mt-8 rounded-2xl overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #2a3320 0%, #3d6b3f 100%)" }}
          >
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #c8dab8, transparent)", transform: "translate(20%, -40%)" }} />
            <div className="relative z-10 px-5 sm:px-10 py-7 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <h2 className="text-[18px] sm:text-[24px] font-bold text-[#e8ede0] mb-2">Ready to take control of your health?</h2>
                <p className="text-[12px] sm:text-[13px] text-[#8aaa7a] max-w-md leading-relaxed">
                  Join thousands of patients who book smarter, track their health records, and never miss a follow-up.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link
                  href="/signin"
                  className="text-[13px] font-semibold bg-white/50 text-[#2a3320] px-5 sm:px-6 py-3 rounded-xl hover:bg-[#f0f7ec] transition-colors whitespace-nowrap"
                >
                  Create free account →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mx-3 sm:mx-5 mt-8 mb-5 rounded-2xl bg-[#2a3320] px-5 sm:px-8 py-7 sm:py-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <Image src="/logo-white.png" alt="CareSync" width={100} height={40} className="h-8 w-auto brightness-150" />
              </div>
              <p className="text-[12px] text-[#6a8a5a] leading-relaxed max-w-[240px]">
                Making healthcare accessible, organized, and stress-free for everyone.
              </p>
              <div className="flex gap-3 mt-4">
                {["𝕏", "in", "f"].map((s, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#3d5230] flex items-center justify-center text-[12px] text-[#8aaa7a] cursor-pointer hover:bg-[#4d6b3f] transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                heading: "For Patients",
                links: ["Book Appointment", "My Records", "Active Prescriptions", "Find Doctors", "Health Dashboard"],
              },
              {
                heading: "For Doctors",
                links: ["Doctor Dashboard", "Manage Schedule", "Patient Records", "Earnings", "Profile Settings"],
              },
              {
                heading: "Company",
                links: ["About CareSync", "How it works", "Privacy Policy", "Terms of Service", "Contact Us"],
              },
            ].map(col => (
              <div key={col.heading}>
                <p className="text-[11px] font-bold text-[#c8dab8] uppercase tracking-widest mb-3 sm:mb-4">{col.heading}</p>
                <div className="flex flex-col gap-2 sm:gap-2.5">
                  {col.links.map(link => (
                    <a key={link} href="#" className="text-[12px] text-[#6a8a5a] hover:text-[#c8dab8] transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#3d5230] pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[11px] text-[#4a6a3a]">© 2026 CareSync · Built by Shubh Dewangan</p>
            <p className="text-[11px] text-[#4a6a3a]">Made with ♥ for better healthcare</p>
          </div>
        </footer>

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