/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/doctors/[userId]/dashboard/page.tsx
import { getDoctor } from "@/lib/actions/doctor.actions"
import { recentAppointments } from "@/lib/actions/appointment.actions"
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { redirect } from "next/navigation"
import DoctorDashboardClient from "@/components/ui/doctor/DoctorDashboardPage"
import { Appointment } from "@/types/appwrite"

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const user = await getLoggedInUser()
  const doctor = await getDoctor(userId)
  const appointmentData = await recentAppointments()

  if (!doctor) redirect("/")

  const allAppointments = (appointmentData?.documents as unknown as Appointment[]) ?? []

  const appointments = allAppointments
    .filter((a) => doctor?.name.includes(a.primaryDoctor) || a.primaryDoctor === doctor?.name)
    .map((a) => ({
      $id: a.$id,
      schedule: a.schedule,
      patientName: (a as any).patient?.name ?? "Unknown",
      reason: a.reason,
      status: a.status as "pending" | "scheduled" | "cancelled",
    }))

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  const todayCount = appointments.filter((a) =>
    new Date(a.schedule).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === todayStr
  ).length

  const pendingCount = appointments.filter((a) => a.status === "pending").length
  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length
  const completedCount = appointments.filter((a) => a.status === "Completed" as any).length
  const totalPatients = new Set(appointments.map((a) => (a as any).patient?.$id).filter(Boolean)).size

  const stats = { todayCount, pendingCount, scheduledCount, completedCount, totalPatients }

  // ── Earnings data (last 7 days vs previous 7 days) ──────────────
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const earningsData = Array.from({ length: 7 }, (_, i) => {
    const thisDay = new Date(now)
    thisDay.setDate(now.getDate() - (6 - i))
    const lastDay = new Date(thisDay)
    lastDay.setDate(thisDay.getDate() - 7)

    const thisDayStr = thisDay.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    const lastDayStr = lastDay.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    const fee = parseFloat(doctor.consultationFee ?? "0")

    const thisWeek = appointments.filter(
      (a) =>
        new Date(a.schedule).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === thisDayStr &&
        a.status === "scheduled"
    ).length * fee

    const lastWeek = appointments.filter(
      (a) =>
        new Date(a.schedule).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === lastDayStr &&
        a.status === "scheduled"
    ).length * fee

    return {
      day: DAY_LABELS[thisDay.getDay()],
      date: thisDayStr,
      thisWeek,
      lastWeek,
    }
  })

  // ── Recent activity ──────────────────────────────────────────────
  const recentActivity = appointments
    .slice(0, 4)
    .map((a) => ({
      text: `${a.patientName} — ${a.status}`,
      time: new Date(a.schedule).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      color:
        a.status === "scheduled"
          ? "bg-green-400"
          : a.status === "pending"
          ? "bg-amber-400"
          : "bg-red-400",
    }))

  // ── Pending requests ─────────────────────────────────────────────
  const pendingRequests = allAppointments
    .filter((a) => a.primaryDoctor === doctor.name && 
      (a.status === "pending" || a.status === "scheduled")
    )
    .slice(0, 5)
    .map((a) => ({
      $id: a.$id,
      schedule: a.schedule,
      status: a.status as "pending",
      reason: a.reason,
      note: a.note,
      primaryDoctor: a.primaryDoctor,   // ← add this
      patient: (a as any).patient ?? null,
    }))

  return (
    <DoctorDashboardClient
      doctor={doctor as any}
      user={user as any}
      appointments={appointments as any}
      stats={stats}
      earningsData={earningsData}
      pendingRequests={pendingRequests}
      recentActivity={recentActivity}
    />
  )
}