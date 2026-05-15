// app/(protected)/patients/[userId]/dashboard/page.tsx
// Navigation moved to top nav bar (Records-page style). Sidebar no longer contains nav.
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"
import { redirect } from "next/navigation"
import Link from "next/link"
import DashboardBookButton from "@/components/ui/DashboardBookButton"
import { recentAppointments } from "@/lib/actions/appointment.actions"
import { getPatientsPrescriptions, getPatientReports } from "@/lib/actions/records.actions"
import { Appointment } from "@/types/appwrite"
import PatientSidebar from "@/components/ui/patient/PatientSidebar"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatSchedule(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (d.toDateString() === now.toDateString()) {
    return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`
  }
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`
  }
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) +
    `, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`
  )
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
}

function statusStyle(status: string) {
  switch (status) {
    case "scheduled": return "bg-[#e6f4ea] text-[#2d6b3f] border border-[#b8d4c0]"
    case "pending":   return "bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]"
    case "cancelled": return "bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]"
    default:          return "bg-[#f7f4ef] text-[#5a6a7e] border border-[#d4cfc6]"
  }
}

const STATUS_PRIORITY: Record<string, number> = {
  "scheduled":           0,
  "pending":             1,
  "completed":           2,
  "cancelled":           3,
  "expired":             4,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PatientDashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const authUser = await getLoggedInUser()
  const { userId } = await params

  if (!authUser || authUser.$id !== userId) redirect("/")
  if (authUser.userType !== "patient") redirect(`/doctors/${authUser.$id}/dashboard`)

  const patient = await getPatient(userId)
  if (!patient) redirect(`/patients/${userId}/register`)

  const appointmentData = await recentAppointments()
  const rawPrescriptions = await getPatientsPrescriptions(patient.$id)
  const medicalReports = await getPatientReports(patient.$id)

  const appointments: Appointment[] =
    ((appointmentData?.documents as unknown as Appointment[]) ?? [])
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

  const now = new Date()

  function sortAppointments(list: Appointment[]) {
    return [...list].sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 5
      const pb = STATUS_PRIORITY[b.status] ?? 5
      if (pa !== pb) return pa - pb
      return new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
    })
  }

  const allAppointmentsSorted = sortAppointments(appointments)
  const upcomingAppointments = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "pending"
  )
  const myDoctors = Array.from(
    new Map(appointments.map((a) => [a.primaryDoctor, a.primaryDoctor])).values()
  )
  const recentActivity = sortAppointments(appointments).slice(0, 5).map((a) => ({
    text: `${a.primaryDoctor} — ${a.status}`,
    time: `${new Date(a.schedule).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}`,
    color: a.status === "scheduled" ? "bg-green-400" : a.status === "cancelled" ? "bg-red-400" : a.status === "completed" ? "bg-blue-400" : "bg-yellow-400",
  }))

  const stats = {
    upcoming:       upcomingAppointments.length,
    cancelled:      appointments.filter((a) => a.status === "cancelled").length,
    total:          appointments.length,
    todayCount:     appointments.filter((a) => new Date(a.schedule).toDateString() === now.toDateString()).length,
    pendingCount:   appointments.filter((a) => a.status === "pending").length,
    scheduledCount: appointments.filter((a) => a.status === "scheduled").length,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prescriptions: any[] = (rawPrescriptions ?? []).map((p: any) => ({
    ...p,
    medications: Array.isArray(p.medications)
      ? p.medications
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((m: any) => {
            if (typeof m === 'string') { try { return JSON.parse(m) } catch { return null } }
            return m
          })
          .filter(Boolean)
      : [],
  }))

  const recentPrescriptions = [...prescriptions]
    .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
    .slice(0, 3)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reports: any[] = medicalReports ?? []
  const greeting = getGreeting()

  return (
    <div className="h-screen bg-[#EFECE3] flex flex-col overflow-hidden">

      {/* ── PatientSidebar (fixed desktop, drawer mobile) ── */}
      <PatientSidebar
        patient={patient}
        userId={userId}
        authUser={authUser}
        stats={{ upcoming: stats.upcoming }}
        prescriptions={prescriptions}
        recentActivity={recentActivity}
        activeNav="overview"
      />

      {/* ── Main area (offset by sidebar on desktop) ── */}
      <div className="flex flex-col flex-1 lg:pl-[264px] xl:pl-[276px] overflow-hidden">

        {/* ── Top Nav Bar (like Records page) ── */}
        <header className="sticky top-0 z-30 bg-[#EFECE3]/90 backdrop-blur-md border-b border-[#d8d4c8] px-4 py-3 flex items-center justify-center">
          {/* mobile left spacer for hamburger button */}
          <div className="lg:hidden absolute left-14" />

          <nav className="flex items-center gap-1 bg-[#e2ddd3] rounded-xl p-1">
            {[
              { label: "Homepage",     href: `/`,                             active: false },
              { label: "Dashboard",    href: `/patients/${userId}/dashboard`, active: true  },
              { label: "Records",      href: `/patients/${userId}/records`,   active: false },
              { label: "Find Doctors", href: `/alldoctors`,                   active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                  item.active
                    ? "bg-[#203C67] text-white shadow-sm"
                    : "text-gray-600 hover:bg-[#d0ccc2]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {/* ── Scrollable Body ── */}
        <main className="flex-1 overflow-y-auto remove-scrollbar p-4 sm:p-6 flex flex-col gap-5">

          {/* Greeting */}
          <div>
            <h1 className="text-[20px] sm:text-[24px] font-semibold text-gray-800">
              {greeting}, {patient.name.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Here&apos;s your health summary for today</p>
          </div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {[
              { dot: "bg-[#185FA5]", label: "TODAY",     value: stats.todayCount,     sub: "appointments",  color: "text-[#185FA5]" },
              { dot: "bg-[#D4A017]", label: "PENDING",   value: stats.pendingCount,   sub: "needs action",  color: "text-[#92400e]" },
              { dot: "bg-[#3B8C4B]", label: "SCHEDULED", value: stats.scheduledCount, sub: "confirmed",     color: "text-[#2d6b3f]" },
              { dot: "bg-gray-400",  label: "TOTAL",      value: stats.total,          sub: "all time",      color: "text-gray-700"  },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-4 border border-[#e8e4da] shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${card.dot} inline-block`} />
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                </div>
                <p className={`text-[32px] font-semibold leading-none ${card.color}`}>{card.value}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Appointments + My Doctors ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">

            {/* All Appointments */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-[15px] text-gray-800">All Appointments</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">scheduled · pending · completed · cancelled · expired</p>
                </div>
                <span className="text-[9px] text-gray-500">scroll to see through</span>
              </div>

              {allAppointmentsSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[13px] text-gray-400">No appointments yet</p>
                  <DashboardBookButton variant='ghost' text='Book one now →' userId={userId} patientId={patient.$id} doctorName={patient.primaryDoctor} dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} authUser={authUser} fullUser={patient} />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1 remove-scrollbar">
                  {allAppointmentsSorted.map((a, i) => {
                    const initials = a.primaryDoctor
                      .replace(/^Dr\.?\s*/i, '')
                      .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f4ef] border border-[#ede9e0]">
                        <div className="w-9 h-9 rounded-full bg-[#dde8f5] flex items-center justify-center text-[12px] font-semibold text-[#203C67] shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate text-[#1a2535]">{a.primaryDoctor}</p>
                          <p className="text-[11px] text-gray-400">{formatSchedule(a.schedule)}</p>
                          {a.reason && <p className="text-[11px] text-gray-300 truncate italic">{a.reason}</p>}
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusStyle(a.status)}`}>
                          {a.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* My Doctors */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-[15px] text-gray-800">My Doctors</h3>
                <span className="text-[10px] bg-[#fef6e4] text-[#92400e] border border-[#fcd89a] px-2.5 py-1 rounded-full font-semibold">
                  {myDoctors.length} total
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mb-3">book · view history</p>

              <div className="flex flex-col gap-2.5 flex-1">
                {myDoctors.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <p className="text-[13px] text-gray-400">No doctors yet</p>
                    <Link href="/alldoctors" className="text-[12px] text-[#185FA5]">Find a doctor →</Link>
                  </div>
                ) : (
                  myDoctors.slice(0, 4).map((doctorName, i) => {
                    const initials = doctorName
                      .replace(/^Dr\.?\s*/i, '')
                      .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                    const apptCount = appointments.filter((a) => a.primaryDoctor === doctorName).length
                    const lastAppt = appointments
                      .filter((a) => a.primaryDoctor === doctorName)
                      .sort((a, b) => new Date(b.schedule).getTime() - new Date(a.schedule).getTime())[0]
                    const lastStatus = lastAppt?.status ?? ''
                    return (
                      <div key={i} className="p-3 rounded-xl bg-[#f7f4ef] border border-[#ede9e0]">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-[#dde8f5] flex items-center justify-center text-[11px] font-semibold text-[#203C67] shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold truncate text-[#1a2535]">{doctorName}</p>
                            <p className="text-[10px] text-gray-400">{apptCount} appointment{apptCount !== 1 ? 's' : ''}</p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusStyle(lastStatus)}`}>
                            {lastStatus || '—'}
                          </span>
                        </div>
                        <div className="flex gap-2 justify-between items-center px-5">
                          <DashboardBookButton
                            userId={userId} patientId={patient.$id} doctorName={doctorName}
                            dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
                            variant='ghost' text='Book appointment →' authUser={authUser} fullUser={patient}
                          />
                          <Link className='text-[10px] text-gray-700' href={`/doctor/${doctorName}`}>view profile</Link>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Recent Records ── */}
          <div className="bg-white rounded-2xl border border-[#e8e4da] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-0">
              <div>
                <h3 className="font-semibold text-[15px] text-gray-800">Recent Records</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">prescriptions &amp; reports</p>
              </div>
              <Link href={`/patients/${userId}/records`} className="text-[12px] text-[#185FA5] hover:underline">
                View all
              </Link>
            </div>

            <div className="flex gap-1 px-5 pt-3 pb-0">
              <div className="flex gap-1 bg-[#f7f4ef] border border-[#e8e4da] rounded-xl p-1">
                <span className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-[#203C67] text-white shadow-sm">
                  💊 Rx ({prescriptions.length})
                </span>
                <Link
                  href={`/patients/${userId}/records`}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-[#d0ccc2] transition-colors"
                >
                  📄 Reports ({reports.length})
                </Link>
              </div>
            </div>

            <div className="p-5">
              {recentPrescriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <p className="text-[13px] text-gray-400">No prescriptions yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentPrescriptions.map((rx: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#f7f4ef] border border-[#ede9e0]">
                      <div className="w-9 h-9 rounded-xl bg-[#dde8f5] flex items-center justify-center text-base shrink-0">💊</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate text-[#1a2535]">
                          {rx.diagnosis || "General Prescription"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatDate(rx.$createdAt)}
                          {rx.followUpDate && (
                            <span className="ml-2 text-[#92400e]">· Follow-up: {formatDate(rx.followUpDate)}</span>
                          )}
                        </p>
                        {rx.medications?.length > 0 && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {rx.medications.length} med{rx.medications.length !== 1 ? 's' : ''}
                            {rx.medications[0]?.name && ` · ${rx.medications[0].name}`}
                            {rx.medications.length > 1 && ` +${rx.medications.length - 1} more`}
                          </p>
                        )}
                      </div>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                        rx.type === 'image' ? 'bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]' : 'bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea]'
                      }`}>
                        {rx.type === 'image' ? '🖼 scanned' : '📝 typed'}
                      </span>
                    </div>
                  ))}
                  {prescriptions.length > 3 && (
                    <Link href={`/patients/${userId}/records`} className="text-center text-[12px] text-[#185FA5] hover:underline py-1">
                      View all {prescriptions.length} prescriptions →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Health Vitals + Primary Doctor ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <div className="bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-[15px] text-gray-800">Health Vitals</h3>
                <span className="text-[11px] text-gray-400">From registration</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Blood Group", value: patient.bloodGroup        ?? '—', dot: 'bg-red-400' },
                  { label: "Weight",      value: patient.weight ? `${patient.weight} kg` : '—', dot: 'bg-blue-400' },
                  { label: "Height",      value: patient.height ? `${patient.height} cm` : '—', dot: 'bg-green-400' },
                  { label: "Gender",      value: patient.gender            ?? '—', dot: 'bg-purple-400' },
                  { label: "Allergies",   value: patient.allergies         ?? "None", dot: 'bg-orange-400' },
                  { label: "Medication",  value: patient.currentMedication ?? "None", dot: 'bg-teal-400' },
                ].map((v, i) => (
                  <div key={i} className="bg-[#f7f4ef] rounded-xl p-3 border border-[#ede9e0]">
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${v.dot} shrink-0`} />
                      <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium truncate">{v.label}</p>
                    </div>
                    <p className="text-[12px] font-semibold text-[#1a2535] truncate" title={v.value}>{v.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {patient.primaryDoctor ? (
              <div className="bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5 flex flex-col justify-between">
                <h3 className="font-semibold text-[15px] text-gray-800 mb-4">Primary Doctor</h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-12 h-12 rounded-full bg-[#dde8f5] flex items-center justify-center text-[14px] font-semibold text-[#203C67] shrink-0">
                    {patient.primaryDoctor.replace(/^Dr\.?\s*/i, '').split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] text-[#1a2535]">{patient.primaryDoctor}</p>
                    <p className="text-[12px] text-gray-400">Primary care physician</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {appointments.filter((a) => a.primaryDoctor === patient.primaryDoctor).length} visits recorded
                    </p>
                  </div>
                  <DashboardBookButton
                    variant="block" text="Book Appointment"
                    userId={userId} patientId={patient.$id} doctorName={patient.primaryDoctor}
                    dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
                    authUser={authUser} fullUser={patient}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5 flex flex-col items-center justify-center gap-3 py-8">
                <p className="text-[13px] text-gray-400">No primary doctor set</p>
                <Link href="/alldoctors" className="text-[12px] text-[#185FA5] hover:underline">Find a doctor →</Link>
              </div>
            )}
          </div>

          {/* Mobile nav links */}
          <div className="lg:hidden flex flex-wrap gap-2 pb-4">
            {[
              { label: "Records",  href: `/patients/${userId}/records` },
              { label: "Settings", href: `/patients/${userId}/settings` },
              { label: "Help",     href: "/help" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="text-[12px] text-[#185FA5] bg-white border border-[#e8e4da] px-3 py-1.5 rounded-full hover:bg-[#f0f4fa] transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

        </main>
      </div>
    </div>
  )
}