/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { updateAppointment } from "@/lib/actions/appointment.actions"
import { getDoctorBookedSlots, updateDoctorBookedSlots } from "@/lib/actions/doctor.actions"
import { toLocalDateStr } from "@/lib/utils"
import { useWorkspaceLive } from "@/app/hooks/workSpaceLive"

type AppointmentStatus = "pending" | "scheduled" | "cancelled" | "Completed" | "expired"

interface Patient { $id: string; name: string; email?: string; phone?: string }

interface Appointment {
  $id: string
  schedule: string
  status: AppointmentStatus
  reason: string
  note?: string
  primaryDoctor: string
  doctorId?: string
  patient: Patient | null
}

interface DoctorStats {
  todayCount: number
  pendingCount: number
  scheduledCount: number
  completedCount: number
  totalPatients: number
}

interface EarningsDay { day: string; date: string; thisWeek: number; lastWeek: number }

interface DoctorInfo {
  $id: string
  name: string
  email: string
  specialization: string
  profilePic?: string
  consultationFee: string
  earnedTotal: number
}

interface DashboardTabProps {
  doctor: DoctorInfo
  doctorId: string
  stats: DoctorStats
  earningsData: EarningsDay[]
  pendingRequests: Appointment[]
  userId: string
}

const MAX_BAR_HEIGHT = 100

function toISTDate(iso: string): Date {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Kolkata",
  })
}
function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function DashboardTab({
  doctor,
  doctorId,
  userId,
  stats = { todayCount: 0, pendingCount: 0, scheduledCount: 0, completedCount: 0, totalPatients: 0 },
  earningsData = [],
  pendingRequests: initialRequests = [],
}: DashboardTabProps) {
  const [requests, setRequests] = useState<Appointment[]>(initialRequests)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [localActions, setLocalActions] = useState<Record<string, string>>({})

  useWorkspaceLive({
    doctorId,
    onAppointments: (appointments) => {
      setRequests(
        appointments
          .filter(a => a.status === "pending" || a.status === "scheduled")
          .slice(0, 10)
          .map(a => ({
            $id: a.$id,
            schedule: a.schedule as string,
            status: (localActions[a.$id] ?? a.status) as AppointmentStatus,
            reason: a.reason as string,
            primaryDoctor: a.primaryDoctor as string,
            doctorId,
            patient: {
              $id: (a.patient as any)?.$id ?? "",
              name: (a.patient as any)?.name ?? "Unknown",
            },
          }))
      )
    },
  })

  const handleRequest = async (appointmentId: string, action: "scheduled" | "cancelled") => {
    setLocalActions(prev => ({ ...prev, [appointmentId]: action }))
    setLoading(prev => ({ ...prev, [appointmentId]: true }))
    try {
      const req = requests.find(r => r.$id === appointmentId)
      if (!req) return

      await updateAppointment({
        appointmentId,
        userId,
        appointment: {
          status: action,
          primaryDoctor: req.primaryDoctor,
          schedule: req.schedule,
          ...(action === "cancelled" ? { cancellationReason: "Declined by doctor" } : {}),
        } as any,
        type: action === "scheduled" ? "schedule" : "cancel",
      })

      if (action === "cancelled" && req.doctorId) {
        const dateStr = toLocalDateStr(toISTDate(req.schedule))
        const timeStr = formatTime(req.schedule)
        const current = await getDoctorBookedSlots(req.doctorId)
        if (current[dateStr]) {
          const next = { ...current, [dateStr]: current[dateStr].filter(s => s !== timeStr) }
          if (next[dateStr].length === 0) delete next[dateStr]
          await updateDoctorBookedSlots(req.doctorId, next)
        }
      }

      setRequests(prev =>
        prev.map(r => r.$id === appointmentId ? { ...r, status: action } : r)
      )
    } catch (err) {
      console.error("handleRequest error:", err)
      setLocalActions(prev => { const n = { ...prev }; delete n[appointmentId]; return n })
    } finally {
      setLoading(prev => ({ ...prev, [appointmentId]: false }))
    }
  }

  const thisWeekTotal = earningsData.reduce((s, d) => s + d.thisWeek, 0)
  const lastWeekTotal = earningsData.reduce((s, d) => s + d.lastWeek, 0)
  const diff    = thisWeekTotal - lastWeekTotal
  const diffPct = lastWeekTotal > 0 ? Math.round((diff / lastWeekTotal) * 100) : 0
  const maxEarning = Math.max(...earningsData.flatMap(d => [d.thisWeek, d.lastWeek]), 1)

  const STAT_CARDS = [
    { tag: "TODAY",          value: stats.todayCount,     mention: "appointments", dot: "bg-blue-400",   textColor: "text-blue-700"   },
    { tag: "PENDING",        value: stats.pendingCount,   mention: "needs action", dot: "bg-yellow-400", textColor: "text-yellow-600" },
    { tag: "SCHEDULED",      value: stats.scheduledCount, mention: "confirmed",    dot: "bg-green-500",  textColor: "text-green-700"  },
    { tag: "TOTAL PATIENTS", value: stats.totalPatients,  mention: "all time",     dot: "bg-gray-400",   textColor: "text-gray-600"   },
  ]

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-y-auto min-h-0 remove-scrollbar">

      {/* ── Stat cards — white rounded-2xl like patient dashboard ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 flex-shrink-0">
        {STAT_CARDS.map(stat => (
          <div
            key={stat.tag}
            className="bg-white rounded-2xl p-4 border border-[#e8e4da] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stat.tag}</p>
            </div>
            <p className={`text-[28px] sm:text-[32px] font-semibold leading-none ${stat.textColor}`}>{stat.value}</p>
            <p className="text-[11px] text-gray-400 mt-1.5">{stat.mention}</p>
          </div>
        ))}
      </section>

      {/* ── Bottom row: earnings + requests ── */}
      <section className="flex flex-col lg:flex-row gap-3 sm:gap-4 flex-1 min-h-0">

        {/* Earnings chart */}
        <div className="flex-1 bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5 flex flex-col min-h-[220px]">
                  <span className='text-[9px] text-red-600 mb-2 flex items-center justify-center'>This might show wrong data...for now it is only for representation</span>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="text-gray-800 font-semibold text-[15px]">Earnings</h2>
              <span className="text-gray-400 text-[11px]">this week <span className="text-gray-300">vs</span> last week</span>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#203C67]">₹{thisWeekTotal.toLocaleString("en-IN")}</p>
              {lastWeekTotal > 0 && (
                <p className={`text-[11px] font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {diff >= 0 ? "▲" : "▼"} {Math.abs(diffPct)}% vs last week
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-0.5">
                Total: ₹{doctor.earnedTotal?.toLocaleString("en-IN") ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-1 sm:gap-2 flex-1 mt-4 min-h-0">
            {earningsData.map(d => {
              const lwH = Math.round((d.lastWeek / maxEarning) * MAX_BAR_HEIGHT)
              const twH = Math.round((d.thisWeek / maxEarning) * MAX_BAR_HEIGHT)
              return (
                <><div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-[2px] sm:gap-[3px] w-full" style={{ height: `${MAX_BAR_HEIGHT}px` }}>
                    <div
                      className="flex-1 rounded-t-sm bg-[#C8D9EE] hover:bg-[#a8c2e0] transition-colors cursor-pointer"
                      style={{ height: `${lwH}%` }}
                      title={`Last week: ₹${d.lastWeek.toLocaleString("en-IN")}`}
                    />
                    <div
                      className="flex-1 rounded-t-sm bg-[#203C67] hover:bg-[#2d5494] transition-colors cursor-pointer"
                      style={{ height: `${twH}%` }}
                      title={`This week: ₹${d.thisWeek.toLocaleString("en-IN")}`}
                    />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400">{d.day}</span>
                </div></>
              )
            })}
          </div>

          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#C8D9EE]" />
              <span className="text-[10px] sm:text-[11px] text-gray-500">Last week</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm bg-[#203C67]" />
              <span className="text-[10px] sm:text-[11px] text-gray-500">This week</span>
            </div>
          </div>
        </div>

        {/* Requests panel */}
        <div className="w-full lg:w-[340px] lg:min-w-[300px] bg-white rounded-2xl border border-[#e8e4da] shadow-sm p-5 flex flex-col max-h-[400px] lg:max-h-none">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-gray-800 font-semibold text-[15px]">Requests</h2>
              <span className="text-gray-400 text-[11px]">confirm · decline</span>
            </div>
            <span className="text-[10px] bg-[#fef6e4] text-[#92400e] border border-[#fcd89a] rounded-full px-2.5 py-1 font-semibold">
              {requests.filter(r => r.status === "pending").length} pending
            </span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto custom-scroll flex-1 pr-1">
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8">
                <p className="text-[32px]">📋</p>
                <p className="text-[12px] text-gray-400 text-center">No active requests</p>
              </div>
            ) : (
              requests.map(req => {
                const isPending   = req.status === "pending"
                const isScheduled = req.status === "scheduled"
                const isCompleted = req.status === "Completed"
                const isCancelled = req.status === "cancelled"
                const isLoad      = loading[req.$id]
                const patientName = req.patient?.name ?? "Unknown Patient"

                return (
                  <div
                    key={req.$id}
                    className={`rounded-xl border p-3 transition-all ${
                      isCompleted || isCancelled
                        ? "opacity-50 border-[#ede9e0] bg-[#f7f4ef]"
                        : "border-[#ede9e0] bg-[#f7f4ef] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-full bg-[#dde8f5] flex items-center justify-center text-[11px] font-semibold text-[#203C67] flex-shrink-0">
                        {initials(patientName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] sm:text-[13px] font-medium text-gray-800 truncate">{patientName}</p>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 truncate">{formatDate(req.schedule)} · {formatTime(req.schedule)}</p>
                      </div>
                      {isScheduled && <span className="text-[9px] bg-[#e6f4ea] text-[#2d6b3f] border border-[#b8d4c0] rounded-full px-2 py-0.5 flex-shrink-0 font-semibold">confirmed</span>}
                      {isCancelled && <span className="text-[9px] bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2] rounded-full px-2 py-0.5 flex-shrink-0 font-semibold">declined</span>}
                      {isCompleted && <span className="text-[9px] bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea] rounded-full px-2 py-0.5 flex-shrink-0 font-semibold">done ✓</span>}
                    </div>

                    <p className="text-[11px] text-gray-400 mb-2 pl-10 truncate">{req.reason}</p>

                    {isPending && (
                      <div className="flex gap-2 pl-10">
                        <button
                          onClick={() => handleRequest(req.$id, "scheduled")}
                          disabled={isLoad}
                          className="flex-1 text-[11px] py-1.5 rounded-lg bg-[#203C67] text-white hover:bg-[#2d5494] transition-colors font-semibold disabled:opacity-50"
                        >
                          {isLoad ? "…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => handleRequest(req.$id, "cancelled")}
                          disabled={isLoad}
                          className="flex-1 text-[11px] py-1.5 rounded-lg border border-[#e8e4da] text-gray-500 hover:bg-[#f7f4ef] transition-colors disabled:opacity-50"
                        >
                          {isLoad ? "…" : "Decline"}
                        </button>
                      </div>
                    )}

                    {isScheduled && (
                      <p className="text-[10px] text-gray-400 pl-10 mt-1 italic">
                        Mark complete from Schedule tab.
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}