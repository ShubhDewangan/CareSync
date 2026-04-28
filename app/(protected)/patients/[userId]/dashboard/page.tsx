// app/(protected)/patients/[userId]/dashboard/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"
import { redirect } from "next/navigation"
import Image from 'next/image'
import EditDetailsModal from "@/components/ui/EditDetailsModal"
import Link from "next/link"
import SignOutButton from "@/components/ui/signOutButton"
import DashboardBookButton from "@/components/ui/DashboardBookButton"
import { recentAppointments } from "@/lib/actions/appointment.actions"
import { Appointment } from "@/types/appwrite"

// ─── Greeting based on time of day ───────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// ─── Format appointment date nicely ──────────────────────────────────────────
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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) +
    `, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`
}

// ─── Status badge colors ──────────────────────────────────────────────────────
function statusStyle(status: string) {
  switch (status) {
    case "scheduled": return "bg-[#EAF3DE] text-[#3B6D11]"
    case "pending":   return "bg-[#FAEEDA] text-[#854F0B]"
    case "cancelled": return "bg-[#FDECEA] text-[#C0392B]"
    default:          return "bg-gray-100 text-gray-600"
  }
}

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

  // All appointments for this patient, ordered by schedule ascending
  const appointments: Appointment[] =
    ((appointmentData?.documents as unknown as Appointment[]) ?? [])
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "scheduled" || a.status === "pending"
  )
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length

  // Last completed appointment
// ✅ Correct — any appointment whose scheduled time has already passed
const now = new Date()

const lastVisit = appointments
  .filter((a) => new Date(a.schedule) < now && a.status !== "cancelled")            // past only
  .sort((a, b) => {
    // nearest to today = largest timestamp first
    const diff = new Date(b.schedule).getTime() - new Date(a.schedule).getTime()
    if (diff !== 0) return diff

    // exact same datetime → alphabetical by doctor name
    return a.primaryDoctor.localeCompare(b.primaryDoctor)
  })[0]

  console.log(appointments.filter((a) => new Date(a.schedule) < now))
  console.log(lastVisit)

  const myDoctors = Array.from(
    new Map(
      appointments.map((a) => [a.primaryDoctor, a.primaryDoctor])
    ).values()
  )

  const stats = {
    upcoming: upcomingAppointments.length,
    cancelled: cancelledCount,
    total: appointments.length,
  }

  const greeting = getGreeting()

  function onLogout(): void {
    throw new Error("Function not implemented.")
  }

  return (
    <div className="flex h-screen bg-[#EFECE3]">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="py-5 px-5 mr-5 h-full max-w-[300px] sticky w-[300px]">
        <div className="h-full max-w-[300px] w-[300px] rounded-xl flex flex-col items-center drop-shadow-xl bg-[#EFECE3] border border-[#203C67] self-start sticky top-4 remove-scrollbar overflow-y-auto">

          {/* Header */}
          <div className="w-full rounded-t-xl flex flex-col items-center border-b border-[#203C67] pb-4">
            <Image src="/logo.png" alt="logo" height={1000} width={1000} className="mt-2 h-16 w-fit" />
            <div className="flex gap-3 items-center mt-3 px-4 w-full">
              <div className="h-20 min-w-20 w-20 rounded-full border p-1 border-[#203C67]">
                <Image
                  src={patient.profilePic || '/assets/images/user_default.webp'}
                  alt="profile"
                  height={200}
                  width={200}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold truncate">{patient.name}</h2>
                <p className="text-[12px] text-gray-500 truncate">{patient.email}</p>
                <div className='flex gap-1 items-center'>
                  <span className="text-[11px] bg-[#8FABD4] px-3 py-1.5 rounded-full border border-[#848282] mt-1 inline-block">
                    Patient
                  </span>
                  <EditDetailsModal userId={userId} patientId={patient.$id} user={authUser} patient={patient} />
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="w-full p-3 border-b border-[#203C67]">
            <p className="text-[14px] text-gray-500 mb-2 px-1">MENU</p>
            <div className="flex flex-col gap-1">
              {[
                { label: "Dashboard", href: `/patients/${userId}/dashboard`, active: true },
                { label: "Book Appointment", href: `/patients/${userId}/appointments` },
                { label: "Find Doctors", href: "/doctors" },
                { label: "Medical Records", href: `/patients/${userId}/records` },
                { label: "Prescriptions", href: `/patients/${userId}/prescriptions` },
                { label: "Settings", href: `/patients/${userId}/settings` },
              ].map((item) => (
                <div key={item.label} className='px-2 py-2 rounded-lg bg-[#8FABD4] w-full flex items-center'>
                  <Link
                    href={item.href}
                    className={`px-3 py-1 rounded-lg text-[14px] transition-colors w-full
                      ${item.active
                        ? "bg-[#203C67] text-white"
                        : "bg-[#8FABD4] text-gray-800 hover:bg-[#7a9bc4]"
                      }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats — real data */}
          <div className="w-full p-3 border-b border-[#203C67]">
            <p className="text-[14px] text-gray-500 mb-2 px-1">QUICK STATS</p>
            <div className="flex gap-2">
              <div className="bg-[#FFFFFF] flex-1 rounded-lg p-2 text-center">
                <p className="text-[11px]">Upcoming</p>
                <p className="text-blue-800 font-semibold text-lg">{stats.upcoming}</p>
                <p className="text-[11px]">appointments</p>
              </div>
              <div className="bg-[#FFFFFF] flex-1 rounded-lg p-2 text-center">
                <p className="text-[11px]">Cancelled</p>
                <p className="text-red-700 font-semibold text-lg">{stats.cancelled}</p>
                <p className="text-[11px]">appointments</p>
              </div>
            </div>

            {/* Last visit — real or empty state */}
            <div className="flex items-center justify-between rounded-lg p-3 bg-[#FFFFFF] mt-2">
              {lastVisit ? (
                <>
                  <div>
                    <p className="text-[11px]">Last visit</p>
                    <p className="font-semibold text-[13px]">{lastVisit.primaryDoctor}</p>
                  </div>
                  <span className="text-[11px] text-gray-600">
                    {new Date(lastVisit.schedule).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                  </span>
                </>
              ) : (
                <p className="text-[12px] text-gray-600 w-full text-center">No past visits yet</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="w-full p-3 rounded-b-xl flex flex-col items-center justify-center gap-3">
            {/* <SignOutButton onLogout={onLogout} /> */}
            <p className="text-red-800 text-[15px]">
              <Link href="/help">Help?</Link> | <Link href="/help/how-to-use">How to Use!</Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="flex-1 p-6 flex flex-col gap-5 overflow-auto remove-scrollbar">

        {/* Topbar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-800">
              {greeting}, {patient.name.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Here&apos;s your health summary</p>
          </div>
          <div className='flex gap-5 items-center'>
            <Link href={'/'} className="border border-[#203C67] text-[#203C67] text-[13px] px-4 py-2 rounded-full">
              Back to Home {'->'}
            </Link>
            <DashboardBookButton
              userId={userId}
              patientId={patient.$id}
              doctorName={patient.primaryDoctor}
              dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} 
              variant={"block"} 
              text={"Book Appointment"}
              authUser={authUser}
              fullUser={patient}           />
          </div>
        </div>

        {/* Stat cards — real where possible, coming soon for unbuilt features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#e0ddd5]">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Upcoming appointments</p>
            <p className="text-[28px] font-semibold text-blue-800">{stats.upcoming}</p>
            <p className="text-[11px] text-gray-400 mt-1">
              {upcomingAppointments[0]
                ? `Next: ${formatSchedule(upcomingAppointments[0].schedule)}`
                : "No upcoming appointments"}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#e0ddd5]">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Total appointments</p>
            <p className="text-[28px] font-semibold text-[#203C67]">{stats.total}</p>
            <p className="text-[11px] text-gray-400 mt-1">{stats.cancelled} cancelled</p>
          </div>
          {/* Prescriptions — coming soon */}
          <div className="bg-white rounded-xl p-4 border border-[#e0ddd5] opacity-60">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Active prescriptions</p>
            <p className="text-[28px] font-semibold text-green-700">—</p>
            <p className="text-[11px] text-gray-400 mt-1">Coming soon</p>
          </div>
          {/* Medical records — coming soon */}
          <div className="bg-white rounded-xl p-4 border border-[#e0ddd5] opacity-60">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-2">Medical records</p>
            <p className="text-[28px] font-semibold text-amber-700">—</p>
            <p className="text-[11px] text-gray-400 mt-1">Coming soon</p>
          </div>
        </div>

        {/* Appointments + Doctors row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Upcoming appointments — real */}
          <div className="bg-white rounded-xl border border-[#e0ddd5] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[15px]">Upcoming appointments</h3>
              <Link href={`/patients/${userId}/appointments`} className="text-[12px] text-[#185FA5]">View all</Link>
            </div>
            <div className="flex flex-col gap-3">
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-[13px]">No upcoming appointments</p>
                  <DashboardBookButton variant='ghost' text='Book one now ->' userId={userId} patientId={patient.$id} doctorName={patient.primaryDoctor} dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} authUser={authUser} fullUser={patient}/>
                </div>
              ) : (
                upcomingAppointments.slice(0, 4).map((a, i) => (
                  <div key={i} className="flex items-center gap-3 pb-3 border-b border-[#f0ece4] last:border-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'scheduled' ? 'bg-[#185FA5]' : 'bg-[#854F0B]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate">{a.primaryDoctor}</p>
                      <p className="text-[11px] text-gray-400">{formatSchedule(a.schedule)}</p>
                      {a.reason && <p className="text-[11px] text-gray-300 truncate">{a.reason}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusStyle(a.status)}`}>
                      {a.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My doctors — derived from real appointments */}
          <div className="bg-white rounded-xl border border-[#e0ddd5] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[15px]">My doctors</h3>
              <Link href="/doctors" className="text-[12px] text-[#185FA5]">Find more</Link>
            </div>
            <div className="flex flex-col gap-3">
              {myDoctors.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-[13px]">No doctors yet</p>
                  <Link href="/doctors" className="text-[12px] text-[#185FA5] mt-1 inline-block">
                    Find a doctor →
                  </Link>
                </div>
              ) : (
                myDoctors.slice(0, 4).map((doctorName, i) => {
                  const initials = doctorName
                    .replace(/^Dr\.?\s*/i, '')
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                  const apptCount = appointments.filter(a => a.primaryDoctor === doctorName).length
                  return (
                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-[#f0ece4] last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-full bg-[#E6F1FB] flex items-center justify-center text-[12px] font-semibold text-[#185FA5] flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{doctorName}</p>
                        <p className="text-[11px] text-gray-400">{apptCount} appointment{apptCount !== 1 ? 's' : ''}</p>
                      </div>
                      <DashboardBookButton
                        userId={userId}
                        patientId={patient.$id}
                        doctorName={doctorName}
                        dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} 
                        variant='block' 
                        text='Book Appointment'
                        authUser={authUser}
                        fullUser={patient}  
                      />
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Health vitals + Prescriptions placeholder row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Health vitals — real */}
          <div className="bg-white rounded-xl border border-[#e0ddd5] p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[15px]">Health vitals</h3>
              <span className="text-[12px] text-gray-400">From registration</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Blood group", value: patient.bloodGroup ?? '—' },
                { label: "Weight",      value: patient.weight    ?? '—' },
                { label: "Height",      value: patient.height    ?? '—' },
                { label: "Gender",      value: patient.gender    ?? '—' },
                { label: "Allergies",   value: patient.allergies ?? "None" },
                { label: "Medication",  value: patient.currentMedication ?? "None" },
              ].map((v, i) => (
                <div key={i} className="bg-[#f8f6f0] rounded-lg p-3 border border-[#e0ddd5]">
                  <p className="text-[10px] text-gray-400 mb-1">{v.label}</p>
                  <p className="text-[13px] font-semibold text-gray-800 truncate" title={v.value}>{v.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prescriptions — coming soon placeholder */}
          <div className="bg-white rounded-xl border border-[#e0ddd5] p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[15px]">Active prescriptions</h3>
              <span className="text-[11px] bg-[#FAEEDA] text-[#854F0B] px-2 py-0.5 rounded-full">Coming soon</span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-2 py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[13px] text-gray-400">Prescriptions will appear here</p>
              <p className="text-[11px] text-gray-300">once the feature is built</p>
            </div>
          </div>
        </div>

        {/* Primary doctor card — real */}
        {patient.primaryDoctor && (
          <div className="bg-white rounded-xl border border-[#e0ddd5] p-5">
            <h3 className="font-semibold text-[15px] mb-3">Primary doctor</h3>
            <div className="flex justify-between items-center gap-4">
              <div className="flex">
                <div className="w-12 h-12 rounded-full bg-[#E6F1FB] flex items-center justify-center text-[14px] font-semibold text-[#185FA5]">
                {patient.primaryDoctor
                  .replace(/^Dr\.?\s*/i, '')
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[15px]">{patient.primaryDoctor}</p>
                <p className="text-[12px] text-gray-400">Primary care physician</p>
              </div>
              </div>
              <DashboardBookButton
              variant="block"
              text="Book Appointment"
                userId={userId}
                patientId={patient.$id}
                doctorName={patient.primaryDoctor}
                dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })}
                authUser={authUser}
                fullUser={patient}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}