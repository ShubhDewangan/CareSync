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
      isCompleted ? "border-green-200 bg-green-50/60"
      : isCancelled ? "border-gray-200 bg-gray-50/60 opacity-50"
      : "border-[#203C6730] bg-white/60 hover:bg-white/80"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${
          isCompleted ? "bg-green-200 text-green-800" : "bg-[#A6BAD7] text-[#203C67]"
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
          {isExpired   && <span className="text-[9px] bg-gray-100 text-gray-500 border border-gray-200 rounded-full px-1.5 py-0.5">expired</span>}
          {isCompleted && <span className="text-[9px] bg-green-100 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5">done ✓</span>}
          {isCancelled && <span className="text-[9px] bg-red-100 text-red-600 border border-red-200 rounded-full px-1.5 py-0.5">cancelled</span>}
          {isScheduled && <span className="text-[9px] bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-1.5 py-0.5">confirmed</span>}
          {isPending   && <span className="text-[9px] bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full px-1.5 py-0.5">pending</span>}
        </div>
      </div>

      {isActive && (
        <div className="pl-10 flex flex-col gap-1.5">
          <button
            onClick={() => onOpenPrescription(appt)}
            className="w-full text-[10px] py-1.5 rounded-md border border-[#203C67] text-[#203C67] hover:bg-[#203C67] hover:text-white transition-colors font-medium"
          >
            {hasPrescription ? "✏️ Edit Prescription" : "📋 Write Prescription"}
          </button>
          {hasPrescription === null && (
            <div className="w-full text-[10px] py-1.5 rounded-md bg-gray-100 text-gray-400 text-center">Checking…</div>
          )}
          {hasPrescription === true && (
            <button onClick={handleComplete} disabled={completing}
              className="w-full text-[10px] py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors font-medium disabled:opacity-50">
              {completing ? "…" : "✓ Mark Complete"}
            </button>
          )}
          {hasPrescription === false && (
            <p className="text-[10px] text-amber-600 text-center py-1">⚠ Write prescription first</p>
          )}
        </div>
      )}

      {isCompleted && (
        <div className="pl-10">
          <button
            onClick={() => router.push(`/doctors/${userId}/patients/${appt.patientId}/records`)}
            className="text-[10px] text-[#203C67] hover:underline"
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
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between mb-1.5">
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
  const [showAppointments, setShowAppointments] = useState(false) // mobile toggle
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
      <div className="flex-1 min-w-0 overflow-x-auto">
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
          className="lg:hidden flex items-center justify-between w-full px-4 py-3 bg-white/60 border border-[#203C6730] rounded-xl text-[13px] font-semibold text-[#203C67]"
        >
          <span>
            {isSelectedToday ? "Today's Appointments" : `Appointments · ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            <span className="ml-2 text-[11px] font-normal text-gray-400">{completedCount}/{selectedAppointments.length} done</span>
          </span>
          <span className={`transition-transform duration-200 ${showAppointments ? "rotate-180" : ""}`}>▾</span>
        </button>

        {/* Appointments panel — always visible on lg, toggle on mobile */}
        <div className={`${showAppointments ? "flex" : "hidden"} lg:flex border border-[#203C67] rounded-xl p-4 bg-white/40 backdrop-blur-sm flex-col flex-1 min-h-0`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[#203C67] font-semibold text-[14px] sm:text-[15px]">
                  {isSelectedToday ? "Today's List" : "Appointments"}
                </h2>
                {!isSelectedToday && (
                  <button
                    onClick={() => setSelectedDate(today)}
                    className="text-[9px] text-[#203C67] border border-[#203C6730] rounded-full px-2 py-0.5 hover:bg-[#203C6710] transition-colors"
                  >
                    Back to today
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  year: isSelectedToday ? undefined : "numeric",
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            </div>
            <span className="text-[11px] bg-[#A6BAD7] text-[#203C67] rounded-full px-2 py-0.5 font-medium">
              {completedCount}/{selectedAppointments.length} done
            </span>
          </div>

          <div className="h-1.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-[#203C67] rounded-full transition-all duration-500"
              style={{ width: selectedAppointments.length ? `${(completedCount / selectedAppointments.length) * 100}%` : "0%" }}
            />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto custom-scroll flex-1 max-h-[50vh] lg:max-h-none">
            {selectedAppointments.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center mt-4">
                No appointments on {isSelectedToday ? "today" : selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
              </p>
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
        <div className="border border-[#203C67] rounded-xl p-4 bg-[#203C6710] flex flex-col gap-3">
          <div>
            <h3 className="text-[12px] font-semibold text-[#203C67] mb-1 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Slot info
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Green ○ → block. Red ✕ → unblock. Blue ● = booked. Grey ✕ = saved block.
            </p>
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