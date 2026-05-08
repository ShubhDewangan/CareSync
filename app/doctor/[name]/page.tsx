/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllDoctors, getDoctor, getDoctorByName } from '@/lib/actions/doctor.actions'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import StarRating from '@/components/ui/Rating'
import BookAppointmentModal from '@/components/ui/BookAppointmentModal'
import { FullUser } from '@/context/UserContext'
import { verifyJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { getPatient } from '@/lib/actions/patient.actions'
import DoctorProfileMobileSidebar from './DoctorProfileMobileSidebar'

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ')
  return {
    title: `Dr. ${decodedName} — CareSync`,
    description: `Book an appointment with Dr. ${decodedName} on CareSync.`,
  }
}

export async function generateStaticParams() {
  if (!process.env.NEXT_PUBLIC_ENDPOINT) return []
  const Doctors = await getAllDoctors()
  return Doctors?.map((doc: any) => ({ name: doc.name.replace(/\s+/g, '-') }))
}

function calculateAge(birthDate: string) {
  if (!birthDate) return '—'
  try {
    const parsed = new Date(birthDate)
    if (isNaN(parsed.getTime())) {
      const [day, monthStr, year] = birthDate.split(' ')
      const monthMap: any = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
      const birth = new Date(Number(year), monthMap[monthStr], Number(day))
      let age = new Date().getFullYear() - birth.getFullYear()
      const m = new Date().getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && new Date().getDate() < birth.getDate())) age--
      return `${age} yrs`
    }
    let age = new Date().getFullYear() - parsed.getFullYear()
    const m = new Date().getMonth() - parsed.getMonth()
    if (m < 0 || (m === 0 && new Date().getDate() < parsed.getDate())) age--
    return `${age} yrs`
  } catch { return '—' }
}

function formatBirthDate(birthDate: string) {
  if (!birthDate) return '—'
  try {
    const parsed = new Date(birthDate)
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }
    return birthDate
  } catch { return birthDate }
}

export default async function DoctorProfilePage({ params }: { params: Promise<{ name: string; userId: string }> }) {
  const { name } = await params
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ')

  let userId: string | null = null
  let user: FullUser | null = null
  let userType: string | null = null
  let selfProfile = false

  const Doctors = await getAllDoctors()

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('caresync_token')?.value
    if (token) {
      const payload = await verifyJwt(token)
      if (payload) {
        userId = payload.userId
        userType = payload.userType
        if (userType === 'patient') user = await getPatient(userId) as FullUser
        else if (userType === 'doctor') user = await getDoctor(userId) as FullUser
      }
    }
  } catch { /* not logged in */ }

  let doctor = Doctors.find((d: any) => d.name.toLowerCase() === decodedName.toLowerCase()) as any
  if (!doctor) doctor = await getDoctorByName(decodedName)
  if (!doctor) notFound()
  if (doctor.userId === userId) selfProfile = true

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const initials = doctor.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) ?? 'DR'
  const specs = Array.isArray(doctor.specialization) ? doctor.specialization : [doctor.specialization]
  const quals = Array.isArray(doctor.qualification) ? doctor.qualification : doctor.qualification ? [doctor.qualification] : []

  return (
    <main className="min-h-screen bg-[#EFECE3]">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#E1D7BC]/80 backdrop-blur-md border-b border-white/40">
        <Link href="/">
          <Image src="/logo.png" alt="CareSync" height={1000} width={1000} className="h-10 w-fit" />
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-[#203C67] text-[14px] truncate max-w-[40%]">
          {doctor?.hospitalLogo && (
            <Image src={doctor.hospitalLogo} alt="hospital" width={28} height={28} className="h-7 w-7 rounded-full" />
          )}
          <span className="opacity-40 truncate">{doctor.hospital}</span>
          <span className="opacity-25">/</span>
          <span className="font-semibold">Dr. {doctor.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden sm:flex items-center gap-2.5 bg-white/50 border border-white/80 rounded-full pl-1 pr-4 py-1">
              <Image
                src={user.profilePic || '/assets/images/user_default.webp'}
                alt="profile" height={32} width={32}
                className="h-7 w-7 rounded-full object-cover border border-white/60"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-[#203C67]">{user.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex gap-2 text-[12px]">
              <Link className="px-4 py-2 border border-[#203C67] bg-[#8FABD4] hover:bg-[#203C67] hover:text-white transition-colors rounded-full" href="/signin">
                Get Started
              </Link>
              <Link className="px-4 py-2 border border-white/60 hover:border-[#203C67] hover:text-[#203C67] transition-colors rounded-full" href="/login">
                Log in
              </Link>
            </div>
          )}
          <DoctorProfileMobileSidebar data={{ doctor, userId: userId as string, user: user as FullUser, selfProfile }} user={user} />
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex gap-5 p-5 w-full">

        {/* ── Left / Main ── */}
        <div className="flex flex-col gap-3 w-full lg:flex-1">

          {/* Hero card */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-5">
            {/* Avatar + name row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="h-[58px] w-[58px] rounded-[14px] overflow-hidden bg-[#C8D8EA] flex-shrink-0 flex items-center justify-center text-[#203C67] text-lg font-bold">
                {doctor.profilePic
                  ? <Image src={doctor.profilePic} alt={doctor.name} height={200} width={200} className="h-full w-full object-cover" />
                  : initials}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[16px] font-semibold text-[#1c1c1c] mb-1.5">Dr. {doctor.name}</h1>
                <div className="flex flex-wrap gap-1.5">
                  {specs.map((s: string) => (
                    <span key={s} className="text-[11px] bg-white/70 border border-white/90 text-[#3a5a8a] px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                  <span className="text-[11px] bg-white/70 border border-white/90 text-[#999] px-2.5 py-1 rounded-full capitalize">
                    {doctor.gender}
                  </span>
                </div>
              </div>
              {/* Book button — desktop */}
              <div className="hidden sm:block flex-shrink-0">
                {selfProfile
                  ? <BookAppointmentModal text="Book Appointment" variant="block" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} falseButton={true} />
                  : <BookAppointmentModal text="Book Appointment" variant="block" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} />}
              </div>
            </div>

            {doctor.about && (
              <p className="text-[12.5px] text-[#999] leading-relaxed mb-4">{doctor.about}</p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {doctor.rating && (
                <div className="flex items-center gap-1.5 bg-white/60 border border-white/85 rounded-full px-3 py-1.5 text-[12px] text-[#444]">
                  <StarRating rating={doctor.rating} />
                  <span>{doctor.rating}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/60 border border-white/85 rounded-full px-3 py-1.5 text-[12px] text-[#444]">
                <span className="text-[#bbb] text-[11px]">Patients</span>
                <span>{doctor.totalusers || '0'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/60 border border-white/85 rounded-full px-3 py-1.5 text-[12px] text-[#444]">
                <span className="text-[#bbb] text-[11px]">Exp.</span>
                <span>{doctor.experience}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#203C67] rounded-full px-3 py-1.5 text-[12px] text-white font-semibold">
                ₹{doctor.consultationFee}
                <span className="font-normal text-white/45 text-[11px]">/ visit</span>
              </div>
              <div className="flex items-center bg-white/60 border border-white/85 rounded-full px-3 py-1.5 text-[12px] text-[#888]">
                {doctor.appointmentSpan} slot
              </div>
            </div>

            {/* Mobile book */}
            <div className="flex sm:hidden">
              {selfProfile
                ? <BookAppointmentModal text="Book Appointment" variant="block" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} falseButton={true} />
                : <BookAppointmentModal text="Book Appointment" variant="block" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} />}
            </div>
          </div>

          {/* Personal + Professional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Personal */}
            <div className="bg-white/50 border border-white/85 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[26px] w-[26px] rounded-[8px] bg-white/70 border border-white/90 flex items-center justify-center text-[12px]">👤</div>
                <h2 className="text-[12.5px] font-semibold text-[#203C67]">Personal</h2>
              </div>
              <div className="flex flex-col divide-y divide-black/[0.04]">
                <div className="flex justify-between items-center py-2">
                  <span className="text-[11.5px] text-[#aaa]">Birth Date</span>
                  <span className="text-[12.5px] font-medium text-[#2a2a2a]">{formatBirthDate(doctor.birthDate)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[11.5px] text-[#aaa]">Age</span>
                  <span className="text-[12.5px] font-medium text-[#2a2a2a]">{calculateAge(doctor.birthDate)}</span>
                </div>
                <div className="flex justify-between items-start py-2 pb-0">
                  <span className="text-[11.5px] text-[#aaa] mt-1">Languages</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {doctor.languages?.map((l: string) => (
                      <span key={l} className="text-[10.5px] bg-white/70 border border-white/90 text-[#3a5a8a] px-2.5 py-1 rounded-full font-medium">{l}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional */}
            <div className="bg-white/50 border border-white/85 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-[26px] w-[26px] rounded-[8px] bg-white/70 border border-white/90 flex items-center justify-center text-[12px]">🏥</div>
                <h2 className="text-[12.5px] font-semibold text-[#203C67]">Professional</h2>
              </div>
              <div className="flex flex-col divide-y divide-black/[0.04]">
                <div className="flex justify-between items-center py-2">
                  <span className="text-[11.5px] text-[#aaa]">Experience</span>
                  <span className="text-[12.5px] font-medium text-[#2a2a2a]">{doctor.experience}</span>
                </div>
                {quals.length > 0 && (
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[11.5px] text-[#aaa] mt-1">Qualifications</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {quals.map((q: string) => (
                        <span key={q} className="text-[10.5px] bg-white/70 border border-white/90 text-[#3a5a8a] px-2.5 py-1 rounded-full font-medium">{q}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-2 pb-0">
                  <span className="text-[11.5px] text-[#aaa]">Primary Clinic</span>
                  <div className="mt-2 bg-[#C8D8EA] border border-[#C8D8EA]/50 rounded-[10px] px-3 py-2.5">
                    <p className="text-[12.5px] font-semibold text-[#203C67]">{doctor.hospital}</p>
                    <p className="text-[11px] text-[#5a7a9a] mt-0.5">{doctor.address}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-[26px] w-[26px] rounded-[8px] bg-white/70 border border-white/90 flex items-center justify-center text-[12px]">📅</div>
              <h2 className="text-[12.5px] font-semibold text-[#203C67]">Availability</h2>
              <span className="ml-auto text-[11px] text-[#bbb] font-mono">{doctor.consultationHours} IST</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {allDays.map((day) => {
                const on = doctor.availableDays?.includes(day)
                return (
                  <span
                    key={day}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors ${
                      on
                        ? 'bg-[#203C67] text-[#EFECE3]'
                        : 'bg-white/40 border border-white/70 text-[#ccc]'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </span>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-[11.5px] text-[#bbb] pt-3 border-t border-black/[0.04]">
              <span>Slot: <span className="font-medium text-[#555]">{doctor.appointmentSpan}</span></span>
              <span>·</span>
              <span>Next slot: <i className="text-[#bbb]">not available yet</i></span>
            </div>
          </div>

          <footer className="text-[11px] text-gray-400 text-center py-2">
            © {new Date().getFullYear()} CareSync — Built by Shubh Dewangan
          </footer>
        </div>

        {/* ── Right column — desktop only ── */}
        <div className="hidden lg:flex flex-1 flex-col gap-3 sticky top-[61px] h-[calc(100vh-77px)] overflow-auto remove-scrollbar">

          {/* Quick Contact */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[13.5px] font-semibold text-[#203C67]">Quick Contact</h3>
                <p className="text-[11px] text-[#aaa] mt-0.5">Reach the clinic or assistant</p>
              </div>
              <div className="h-8 w-8 rounded-xl bg-white/70 border border-white/90 flex items-center justify-center">
                <Image src="/assets/icons/phone.svg" alt="call" height={15} width={15} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-white/55 border border-white/90 rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-[#aaa] mb-0.5">Clinic Phone</p>
                  <p className="text-[12.5px] text-[#1c1c1c] font-medium">{doctor.phone}</p>
                </div>
                <button className="bg-[#203C67] text-white text-[11.5px] font-medium px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">Call</button>
              </div>
              <div className="bg-white/55 border border-white/90 rounded-xl px-4 py-3 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-[#aaa] mb-0.5">Email</p>
                  <p className="text-[12.5px] text-[#1c1c1c] font-medium truncate max-w-[170px]">{doctor.email}</p>
                </div>
                <button className="border border-[#203C67]/25 text-[#203C67] text-[11.5px] px-4 py-1.5 rounded-full hover:bg-white/50 transition-colors">Mail</button>
              </div>
            </div>

            <div className="bg-white/60 border border-white/90 rounded-full flex items-center justify-center">
              {selfProfile
                ? <BookAppointmentModal variant="ghost" text="Book Appointment" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} falseButton={true} />
                : <BookAppointmentModal variant="ghost" text="Book Appointment" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} />}
            </div>
          </div>

          {/* Clinic Details */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h3 className="text-[13.5px] font-semibold text-[#203C67]">Clinic Details</h3>
              <p className="text-[11px] text-[#aaa] mt-0.5">{doctor.hospital}</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-white/70">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(doctor.address)}&output=embed`}
                width="100%" height="200"
                style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy"
              />
            </div>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] text-[#666] leading-relaxed">{doctor.address}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[#203C67] text-[11.5px] rounded-full border border-[#203C67]/20 hover:bg-[#203C67] hover:text-white transition-colors"
              >
                <Image src="/assets/icons/map.svg" alt="" width={11} height={11} />
                Directions
              </a>
            </div>
            <div className="flex flex-col gap-2 pt-3 border-t border-black/[0.04]">
              <p className="text-[11px] text-[#aaa]">Consultation Hours</p>
              <div className="flex flex-wrap gap-1.5">
                {doctor.availableDays?.map((day: string) => (
                  <div key={day} className="bg-[#C8D8EA] border border-[#C8D8EA]/50 rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[10.5px]">
                    <span className="font-medium text-[#203C67]">{day.slice(0, 3)}</span>
                    <span className="text-[#203C67]/25">•</span>
                    <span className="text-[#3a5a8a]">{doctor.consultationHours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}