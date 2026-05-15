/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import DoctorEditProfileModal from "@/components/ui/doctor/EditDoctorProfile"
import PrescriptionModal from "@/components/ui/doctor/PrescriptionModal"
import { completeAppointment } from "@/lib/actions/appointment.actions"
import { getPrescriptionByAppointment } from "@/lib/actions/records.actions"
import { getDoctorBlockedSlots, getDoctorBookedSlots, updateBlockedSlots } from "@/lib/actions/doctor.actions"
import { toLocalDateStr } from "@/lib/utils"
import { useWorkspaceLive } from "@/app/hooks/workSpaceLive"
import WeeklyScheduleTable from "@/components/WeeklySchedule"

interface Appointment {
  $id: string
  schedule: string
  patientName: string
  patientId?: string
  reason: string
  status: "pending" | "scheduled" | "cancelled" | "completed" | "expired"
}

interface DoctorProps {
  doctorId: string
  user: { $id: string; name: string; email: string; phone: string }
  doctor: {
    name: string; phone: string; email: string; profilePic: string
    gender: string; birthDate: string; specialization: string
    qualification: string; experience: string; hospital: string
    address: string; availableDays: string[]; consultationHours: string
    consultationFee: string; appointmentSpan: string; about: string
    languages: string[]; slotsAvailable: string[]; earnedTotal: number
    identificationType: string; updationConsent: boolean
    disclosureConsent: boolean; privacyConsent: boolean
    blockedSlots?: string; bookedSlots?: string
  }
  appointments: Appointment[]
}

function toISTDate(iso: string): Date {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}
function formatApptTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  })
}
function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}
function parseSlots(raw?: string): Record<string, string[]> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

// ── Status pill helper ────────────────────────────────────────────────────────
function statusPill(status: string) {
  switch (status) {
    case "scheduled": return "bg-[#e6f4ea] text-[#2d6b3f] border border-[#b8d4c0]"
    case "completed": return "bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea]"
    case "cancelled": return "bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]"
    case "expired":   return "bg-[#f7f4ef] text-gray-500 border border-[#d4cfc6]"
    case "pending":   return "bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]"
    default:          return "bg-[#f7f4ef] text-gray-500 border border-[#d4cfc6]"
  }
}

interface PatientCardProps {
  appt: Appointment
  userId: string
  onCompleted: (id: string) => void
  onOpenPrescription: (appt: Appointment) => void
}

function PatientAppointmentCard({ appt, userId, onCompleted, onOpenPrescription }: PatientCardProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [hasPrescription, setHasPrescription] = useState<boolean | null>(null)

  const isExpired   = appt.status === "expired"
  const isCompleted = appt.status === "completed"
  const isCancelled = appt.status === "cancelled"
  const isScheduled = appt.status === "scheduled"
  const isPending   = appt.status === "pending"
  const isActive    = isScheduled || isPending

  useEffect(() => {
    if (isCompleted || isCancelled) { setHasPrescription(null); return }
    getPrescriptionByAppointment(appt.$id).then((doc: any) => setHasPrescription(!!doc))
  }, [appt.$id, isCompleted, isCancelled])

  const handleComplete = async () => {
    setCompleting(true)
    try { await completeAppointment(appt.$id); onCompleted(appt.$id) }
    catch (err) { console.error("complete error:", err) }
    finally { setCompleting(false) }
  }

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isCompleted ? "border-[#b8d4c0] bg-[#f0faf2]"
      : isCancelled ? "border-[#ede9e0] bg-[#f7f4ef] opacity-50"
      : "border-[#ede9e0] bg-[#f7f4ef] hover:bg-white"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
          isCompleted ? "bg-[#e6f4ea] text-[#2d6b3f]" : "bg-[#dde8f5] text-[#203C67]"
        }`}>
          {initials(appt.patientName)}
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[12px] font-semibold text-gray-800 truncate cursor-pointer hover:text-[#203C67] hover:underline transition-colors"
            onClick={e => { e.stopPropagation(); if (appt.patientId) router.push(`/doctors/${userId}/patients/${appt.patientId}/records`) }}
          >
            {appt.patientName}
          </p>
          <p className="text-[10px] text-gray-400 truncate">{formatApptTime(appt.schedule)} · {appt.reason}</p>
        </div>
        <div className="flex-shrink-0">
          {isExpired   && <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${statusPill("expired")}`}>expired</span>}
          {isCompleted && <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${statusPill("completed")}`}>done ✓</span>}
          {isCancelled && <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${statusPill("cancelled")}`}>cancelled</span>}
          {isScheduled && <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${statusPill("scheduled")}`}>confirmed</span>}
          {isPending   && <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-semibold ${statusPill("pending")}`}>pending</span>}
        </div>
      </div>

      {isActive && (
        <div className="pl-10 flex flex-col gap-1.5">
          <button
            onClick={() => onOpenPrescription(appt)}
            className="w-full text-[10px] py-1.5 rounded-lg border border-[#203C6730] text-[#203C67] hover:bg-[#203C67] hover:text-white transition-colors font-medium"
          >
            {hasPrescription ? "✏️ Edit Prescription" : "📋 Write Prescription"}
          </button>
          {hasPrescription === null && (
            <div className="w-full text-[10px] py-1.5 rounded-lg bg-[#f7f4ef] text-gray-400 text-center">Checking…</div>
          )}
          {hasPrescription === true && (
            <button onClick={handleComplete} disabled={completing}
              className="w-full text-[10px] py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold disabled:opacity-50">
              {completing ? "…" : "✓ Mark Complete"}
            </button>
          )}
          {hasPrescription === false && (
            <p className="text-[10px] text-[#92400e] text-center py-1 bg-[#fef6e4] rounded-lg">⚠ Write prescription first</p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="pl-10">
          <button
            onClick={() => router.push(`/doctors/${userId}/patients/${appt.patientId}/records`)}
            className="text-[10px] text-[#203C67] hover:underline font-medium"
          >
            📋 View Prescription
          </button>
        </div>
      )}
    </div>
  )
}

function Section({ label, count, color, defaultOpen, children }: {
  label: string; count: number; color: string; defaultOpen: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between mb-1.5 py-1">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${color}`}>{label} ({count})</span>
        <span className={`text-[10px] text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  )
}

export default function ScheduleTab({ doctorId, user, doctor, appointments }: DoctorProps) {
  const today    = new Date()
  const todayIST = toISTDate(today.toISOString())
  const todayStr = toLocalDateStr(todayIST)

  const [liveAppointments, setLiveAppointments] = useState<Appointment[]>(appointments ?? [])
  const [blockedSlots, setBlockedSlots]         = useState(() => doctor.blockedSlots ?? "{}")
  const [bookedSlots,  setBookedSlots]          = useState(() => doctor.bookedSlots  ?? "{}")
  const [savingState, setSavingState]           = useState<"idle" | "pending" | "saved">("idle")
  const [selectedDate, setSelectedDate]         = useState<Date>(today)
  const [showAppointments, setShowAppointments] = useState(false)
  const [prescriptionModal, setPrescriptionModal] = useState<{
    appointmentId: string; patientName: string; patientId: string
    appointmentDate?: string; appointmentReason: string; appointmentStatus: string
  } | null>(null)

  const saveTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestBlocked = useRef<Record<string, string[]>>(parseSlots(doctor.blockedSlots))

  const selectedDateStr = toLocalDateStr(selectedDate)
  const isSelectedToday = selectedDateStr === todayStr

  const handleOpenPrescription = (appt: Appointment) => {
    setPrescriptionModal({
      appointmentId: appt.$id,
      patientName: appt.patientName,
      patientId: appt.patientId ?? "",
      appointmentDate: appt.schedule,
      appointmentReason: appt.reason,
      appointmentStatus: appt.status,
    })
  }

  useWorkspaceLive({
    doctorId,
    onSlots: ({ blockedSlots: bs, bookedSlots: bk }) => {
      setBlockedSlots(JSON.stringify(bs))
      setBookedSlots(JSON.stringify(bk))
      latestBlocked.current = bs
    },
    onAppointments: (live) => {
      setLiveAppointments(
        live.map(a => ({
          $id: a.$id,
          schedule: a.schedule as string,
          status: a.status as Appointment["status"],
          reason: a.reason as string,
          patientName: (a.patient as any)?.name ?? "Unknown",
          patientId: (a.patient as any)?.$id,
        }))
      )
    },
  })

  useEffect(() => {
    let cancelled = false
    const fetch = () => {
      if (document.visibilityState === "hidden") return
      Promise.all([getDoctorBlockedSlots(doctorId), getDoctorBookedSlots(doctorId)])
        .then(([fresh, freshBooked]) => {
          if (cancelled) return
          setBlockedSlots(JSON.stringify(fresh))
          setBookedSlots(JSON.stringify(freshBooked))
          latestBlocked.current = fresh
        })
    }
    fetch()
    document.addEventListener("visibilitychange", fetch)
    return () => { cancelled = true; document.removeEventListener("visibilitychange", fetch) }
  }, [doctorId])

  const handleToggle = (next: Record<string, string[]>) => {
    latestBlocked.current = next
    setBlockedSlots(JSON.stringify(next))
    setSavingState("pending")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await updateBlockedSlots(doctorId, latestBlocked.current)
      setSavingState("saved")
      setTimeout(() => setSavingState("idle"), 1500)
    }, 1500)
  }

  const handleCompleted = (id: string) => {
    setLiveAppointments(prev => prev.map(a => a.$id === id ? { ...a, status: "completed" } : a))
  }

  const selectedAppointments = liveAppointments
    .filter(a => toLocalDateStr(toISTDate(a.schedule)) === selectedDateStr && a.status !== "cancelled")
    .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

  const activeAppointments    = selectedAppointments.filter(a => a.status === "pending" || a.status === "scheduled")
  const completedAppointments = selectedAppointments.filter(a => a.status === "completed")
  const expiredAppointments   = selectedAppointments.filter(a => a.status === "expired")
  const completedCount        = completedAppointments.length

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">

      {/* ── Weekly Calendar ── */}
      <div className="flex-1 min-w-0 overflow-x-auto bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-4">
        <WeeklyScheduleTable
          slotsAvailable={doctor.slotsAvailable}
          availableDays={doctor.availableDays}
          consultationHours={doctor.consultationHours}
          blockedSlots={blockedSlots}
          bookedSlots={bookedSlots}
          readOnly={false}
          onToggle={handleToggle}
          savingState={savingState}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {/* ── Right Column ── */}
      <div className="w-full lg:w-[300px] lg:min-w-[260px] flex flex-col gap-3 sm:gap-4 lg:overflow-y-auto">

        {/* Mobile toggle button */}
        <button
          onClick={() => setShowAppointments(v => !v)}
          className="lg:hidden flex items-center justify-between w-full px-4 py-3 bg-white border border-[#e8e4da] rounded-2xl text-[13px] font-semibold text-[#203C67] shadow-sm"
        >
          <span>
            {isSelectedToday ? "Today's Appointments" : `Appointments · ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            <span className="ml-2 text-[11px] font-normal text-gray-400">{completedCount}/{selectedAppointments.length} done</span>
          </span>
          <span className={`transition-transform duration-200 ${showAppointments ? "rotate-180" : ""}`}>▾</span>
        </button>

        {/* Appointments panel */}
        <div className={`${showAppointments ? "flex" : "hidden"} lg:flex bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-4 flex-col flex-1 min-h-0`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-gray-800 font-semibold text-[14px] sm:text-[15px]">
                  {isSelectedToday ? "Today's List" : "Appointments"}
                </h2>
                {!isSelectedToday && (
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="text-[9px] text-[#203C67] border border-[#203C6730] rounded-full px-2 py-0.5 hover:bg-[#dde8f5] transition-colors"
                  >
                    Back to today
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  year: isSelectedToday ? undefined : "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
            <span className="text-[11px] bg-[#dde8f5] text-[#203C67] rounded-full px-2.5 py-1 font-semibold">
              {completedCount}/{selectedAppointments.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[#f7f4ef] rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-[#203C67] rounded-full transition-all duration-500"
              style={{ width: selectedAppointments.length ? `${(completedCount / selectedAppointments.length) * 100}%` : "0%" }}
            />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto custom-scroll flex-1 max-h-[50vh] lg:max-h-none">
            {selectedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
                <p className="text-[28px]">📅</p>
                <p className="text-[12px] text-gray-400 text-center">
                  No appointments on {isSelectedToday ? "today" : selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                </p>
              </div>
            ) : (
              <>
                {activeAppointments.length > 0 && (
                  <Section label="Active" count={activeAppointments.length} color="text-[#203C67]" defaultOpen>
                    {activeAppointments.map(a => (
                      <PatientAppointmentCard key={a.$id} appt={a} userId={user.$id} onCompleted={handleCompleted} onOpenPrescription={handleOpenPrescription} />
                    ))}
                  </Section>
                )}
                {completedAppointments.length > 0 && (
                  <Section label="Completed" count={completedAppointments.length} color="text-green-600" defaultOpen={false}>
                    {completedAppointments.map(a => (
                      <PatientAppointmentCard key={a.$id} appt={a} userId={user.$id} onCompleted={handleCompleted} onOpenPrescription={handleOpenPrescription} />
                    ))}
                  </Section>
                )}
                {expiredAppointments.length > 0 && (
                  <Section label="Expired" count={expiredAppointments.length} color="text-gray-400" defaultOpen={false}>
                    {expiredAppointments.map(a => (
                      <PatientAppointmentCard key={a.$id} appt={a} userId={user.$id} onCompleted={handleCompleted} onOpenPrescription={handleOpenPrescription} />
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>

        {/* Slot info + Edit Profile */}
        <div className="bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-4 flex flex-col gap-3">
          <div>
            <h3 className="text-[12px] font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Slot legend
            </h3>
            <div className="bg-[#f7f4ef] rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                <span className="text-green-600 font-medium">○ Green</span> → block &nbsp;·&nbsp;
                <span className="text-red-500 font-medium">✕ Red</span> → unblock &nbsp;·&nbsp;
                <span className="text-[#203C67] font-medium">● Blue</span> = booked &nbsp;·&nbsp;
                <span className="text-gray-400 font-medium">✕ Grey</span> = saved block
              </p>
            </div>
          </div>
          <DoctorEditProfileModal doctorId={doctorId} user={user} doctor={doctor} />
        </div>
      </div>

      {/* Prescription Modal */}
      {prescriptionModal && (
        <PrescriptionModal
          isOpen={!!prescriptionModal}
          onClose={() => setPrescriptionModal(null)}
          appointmentId={prescriptionModal.appointmentId}
          appointmentDate={prescriptionModal.appointmentDate}
          appointmentReason={prescriptionModal.appointmentReason}
          appointmentStatus={prescriptionModal.appointmentStatus}
          doctorId={doctorId}
          userId={user.$id}
          doctorName={doctor.name}
          doctorSpecialization={
            Array.isArray(doctor.specialization)
              ? doctor.specialization.join(", ")
              : doctor.specialization
          }
          doctorHospital={doctor.hospital}
          doctorExperience={doctor.experience}
          patientId={prescriptionModal.patientId}
          patientName={prescriptionModal.patientName}
        />
      )}
    </div>
  )
}