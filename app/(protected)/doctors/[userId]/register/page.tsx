/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDoctorByName } from '@/lib/actions/doctor.actions'
import { Doctors } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ')
  return {
    title: `Dr. ${decodedName} — CareSync Profile`,
    description: `View the full professional profile of Dr. ${decodedName} on CareSync.`,
  }
}

export async function generateStaticParams() {
  return Doctors.map((doc) => ({
    name: doc.name.replace(/\s+/g, '-'),
  }))
}

function getProfilePic(doctor: any) {
  return doctor.profilePic || '/assets/images/user_default.webp'
}

// ── Helper: normalize a field that could be string | string[] → string[] ──
function toArray(val: string | string[] | undefined | null): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  // legacy single string stored before the array migration
  return [val]
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ')

  let doctor = Doctors.find(
    (d) => d.name.toLowerCase() === decodedName.toLowerCase()
  ) as any

  if (!doctor) {
    doctor = await getDoctorByName(decodedName)
  }

  if (!doctor) notFound()

  const otherDoctors = Doctors.filter(
    (d) => d.name.toLowerCase() !== decodedName.toLowerCase()
  ).slice(0, 4)

  // Normalize both fields to arrays so the template never has to branch
  const specializations = toArray(doctor.specialization)
  const qualifications = toArray(doctor.qualification)

  const dayAbbreviations: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
  }
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <main className="drp-page">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="drp-nav py-3 px-10">
        <Image src={'/logo.png'} alt='logo' height={1000} width={1000} className='h-[45px] w-fit' />
        <div className='text-[20px] font-heading1 flex items-center gap-2'>
          {doctor?.hospitalLogo && (
            <Image src={doctor.hospitalLogo} alt='hospital' width={1000} height={1000} className='h-10 w-10' />
          )}
          {doctor.hospital}
        </div>
        <div className='flex text-[10px] gap-3'>
          <Link className='px-5 py-3 bg-[#203C67] text-white rounded-full' href={'/signin'}>Get Started</Link>
          <Link className='px-5 py-3 bg-[#8FABD4] text-[#203C67] rounded-full' href={'/login'}>Log in</Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className='flex flex-col overflow-y-auto remove-scrollbar p-5'>
        <div className='border border-[#203C67]/20 p-5 max-h-[300px] w-auto rounded-md flex gap-5'>
          <Image
            src={doctor.profilePic}
            alt={doctor.name}
            height={1000}
            width={1000}
            className='rounded-full h-[150px] w-fit'
          />
          <div className='flex flex-col gap-2'>
            <h1 className='font-label text-[25px] text-[#203C67]'>Dr. {doctor.name}</h1>

            {/* Specialization tags */}
            <div className='flex flex-wrap gap-2'>
              {specializations.map((s: string) => (
                <span
                  key={s}
                  className='px-3 py-1 rounded-full text-[12px] font-medium bg-[#203C67] text-white'
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Qualification tags */}
            {qualifications.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {qualifications.map((q: string) => (
                  <span
                    key={q}
                    className='px-3 py-1 rounded-full text-[12px] font-medium bg-[#8FABD4]/30 text-[#203C67] border border-[#8FABD4]'
                  >
                    {q}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────── */}
      <section className="drp-stats-strip">
        <div className="drp-stat-item">
          <span className="drp-stat-number">{doctor.totalPatients?.toLocaleString() || '0'}</span>
          <span className="drp-stat-label">Total Patients</span>
        </div>
        <div className="drp-stat-divider" />
        <div className="drp-stat-item">
          <span className="drp-stat-number">{doctor.experience}</span>
          <span className="drp-stat-label">Experience</span>
        </div>
        <div className="drp-stat-divider" />
        <div className="drp-stat-item">
          <span className="drp-stat-number">₹{doctor.consultationFee}</span>
          <span className="drp-stat-label">Consultation Fee</span>
        </div>
        <div className="drp-stat-divider" />
        <div className="drp-stat-item">
          <span className="drp-stat-number">{doctor.appointmentSpan}</span>
          <span className="drp-stat-label">Per Appointment</span>
        </div>
      </section>

      {/* ── Content Grid ─────────────────────────────────────── */}
      <div className="drp-content">

        {/* Left Column */}
        <div className="drp-col-left">

          {/* About */}
          <section className="drp-card">
            <h2 className="drp-card-title">
              <span className="drp-card-icon">👨‍⚕️</span>
              About Dr. {doctor.name.split(' ')[0]}
            </h2>
            <p className="drp-about-text">{doctor.about}</p>
            {doctor.languages && doctor.languages.length > 0 && (
              <div className="drp-languages">
                <span className="drp-lang-label">Languages:</span>
                <div className="drp-lang-tags">
                  {doctor.languages.map((lang: string) => (
                    <span key={lang} className="drp-lang-tag">{lang}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Availability Schedule */}
          <section className="drp-card">
            <h2 className="drp-card-title">
              <span className="drp-card-icon">📅</span>
              Weekly Availability
            </h2>
            <div className="drp-schedule-grid">
              {allDays.map((day) => {
                const isAvailable = doctor.availableDays?.some(
                  (d: string) => d.toLowerCase() === day.toLowerCase()
                )
                return (
                  <div
                    key={day}
                    className={`drp-schedule-day ${isAvailable ? 'drp-day-active' : 'drp-day-off'}`}
                  >
                    <span className="drp-day-abbr">{dayAbbreviations[day.toLowerCase()]}</span>
                    <span className="drp-day-status">
                      {isAvailable ? doctor.consultationHours : 'Off'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="drp-col-right">

          {/* Contact & Details */}
          <section className="drp-card drp-contact-card">
            <h2 className="drp-card-title">
              <span className="drp-card-icon">📋</span>
              Details
            </h2>
            <div className="drp-detail-rows">
              <div className="drp-detail-row">
                <Image src="/assets/icons/email.svg" alt="" width={18} height={18} className="drp-detail-icon" />
                <div><span className="drp-detail-label">Email</span><span className="drp-detail-value">{doctor.email}</span></div>
              </div>
              <div className="drp-detail-row">
                <Image src="/assets/icons/phone.svg" alt="" width={18} height={18} className="drp-detail-icon" />
                <div><span className="drp-detail-label">Phone</span><span className="drp-detail-value">{doctor.phone}</span></div>
              </div>
              <div className="drp-detail-row">
                <Image src="/assets/icons/map.svg" alt="" width={18} height={18} className="drp-detail-icon" />
                <div><span className="drp-detail-label">Address</span><span className="drp-detail-value">{doctor.address}</span></div>
              </div>
              <div className="drp-detail-row">
                <Image src="/assets/icons/calendar.svg" alt="" width={18} height={18} className="drp-detail-icon" />
                <div><span className="drp-detail-label">Available Days</span><span className="drp-detail-value">{doctor.availableDays?.join(', ')}</span></div>
              </div>
            </div>
          </section>

          {/* Quick Info */}
          <section className="drp-card drp-quick-card">
            <h2 className="drp-card-title">
              <span className="drp-card-icon">⚡</span>
              Quick Info
            </h2>
            <div className="drp-quick-grid">
              <div className="drp-quick-item">
                <span className="drp-quick-label">Gender</span>
                <span className="drp-quick-value">
                  {doctor.gender ? doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1) : 'N/A'}
                </span>
              </div>

              {/* Specialization — tag list */}
              <div className="drp-quick-item">
                <span className="drp-quick-label">Specialization</span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {specializations.map((s: string) => (
                    <span
                      key={s}
                      className='px-2 py-0.5 rounded text-[11px] font-medium bg-[#203C67] text-white'
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Qualification — tag list */}
              <div className="drp-quick-item">
                <span className="drp-quick-label">Qualifications</span>
                <div className='flex flex-wrap gap-1 mt-1'>
                  {qualifications.map((q: string) => (
                    <span
                      key={q}
                      className='px-2 py-0.5 rounded text-[11px] font-medium bg-[#8FABD4]/30 text-[#203C67] border border-[#8FABD4]'
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>

              <div className="drp-quick-item">
                <span className="drp-quick-label">Consultation Hours</span>
                <span className="drp-quick-value">{doctor.consultationHours}</span>
              </div>
              <div className="drp-quick-item">
                <span className="drp-quick-label">Hospital</span>
                <span className="drp-quick-value">{doctor.hospital}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Other Doctors ─────────────────────────────────────── */}
      <section className="drp-others">
        <h2 className="drp-others-title">Other Doctors at CareSync</h2>
        <div className="drp-others-grid">
          {otherDoctors.map((doc) => (
            <Link
              key={doc.name}
              href={`/doctor/${doc.name.replace(/\s+/g, '-')}`}
              className="drp-other-card"
            >
              <div className="drp-other-avatar">
                <Image
                  src={getProfilePic(doc)}
                  alt={doc.name}
                  width={56}
                  height={56}
                  className="drp-other-avatar-img"
                />
              </div>
              <div className="drp-other-info">
                <span className="drp-other-name">Dr. {doc.name}</span>
                {/* Show first specialization only in the card for brevity */}
                <span className="drp-other-spec">
                  {toArray(doc.specialization)[0] ?? ''}
                </span>
                <span className="drp-other-rating">★ {doc.rating}</span>
              </div>
              <span className="drp-other-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="drp-footer">
        <p>© {new Date().getFullYear()} CareSync — Built by Shubh Dewangan</p>
      </footer>
    </main>
  )
}