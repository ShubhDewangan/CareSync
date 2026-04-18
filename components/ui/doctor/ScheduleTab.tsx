"use client"

// components/doctor/tabs/ScheduleTab.tsx

import { useEffect, useState } from "react"
import DoctorEditProfileModal from "@/components/ui/doctor/EditDoctorProfile"

type SlotStatus = "available" | "booked" | "off"

interface Appointment {
  $id: string
  schedule: string        // ISO date string — e.g. "2025-04-17T09:00:00"
  patientName: string
  reason: string
  status: "pending" | "scheduled" | "cancelled"
}

interface DoctorProps {
  doctorId: string
  user: {
    $id: string
    name: string
    email: string
    phone: string
  }
  doctor: {
    name: string
    phone: string
    email: string
    profilePic: string
    gender: string
    birthDate: string
    specialization: string
    qualification: string
    experience: string
    hospital: string
    address: string
    availableDays: string[]       // ["Monday", "Wednesday", ...]
    consultationHours: string     // "9:00 AM - 5:00 PM"
    consultationFee: string
    appointmentSpan: string
    about: string
    languages: string[]
    slotsAvailable: string[]      // ["9:00 AM", "10:00 AM", ...]
    earnedTotal: number
    identificationType: string
    updationConsent: boolean
    disclosureConsent: boolean
    privacyConsent: boolean
  }
  appointments: Appointment[]     // fetched appointments for the week
}

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Parse "9:00 AM" → { hours: 9, minutes: 0 }
function parseTime(t: string): { hours: number; minutes: number } | null {
  const match = t.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/)
  if (!match) return null
  let hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const period = match[3]
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return { hours, minutes }
}

// Parse "9:00 AM - 5:00 PM" → { start, end } in { hours, minutes }
function parseConsultationHours(ch: string) {
  const parts = ch.split(" - ")
  if (parts.length !== 2) return null
  const start = parseTime(parts[0].trim())
  const end = parseTime(parts[1].trim())
  if (!start || !end) return null
  return { start, end }
}

function isSlotOutsideHours(slot: string, consultationHours: string): boolean {
  const range = parseConsultationHours(consultationHours)
  const slotTime = parseTime(slot)
  if (!range || !slotTime) return false
  const slotMinutes = slotTime.hours * 60 + slotTime.minutes
  const startMinutes = range.start.hours * 60 + range.start.minutes
  const endMinutes = range.end.hours * 60 + range.end.minutes
  return slotMinutes < startMinutes || slotMinutes >= endMinutes
}

// Get the Mon–Sun dates for the current week
function getCurrentWeekDates(): Date[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

export default function ScheduleTab({ doctorId, user, doctor, appointments }: DoctorProps) {
  const weekDates = getCurrentWeekDates()
  const today = new Date()
  const todayDayIndex = today.getDay()

  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  // ← ADD THIS GUARD
  
  if (!doctor) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400 text-sm">
        Loading schedule...
      </div>
    )
  }

  const outOfRangeSlots = (doctor.slotsAvailable ?? []).filter(s =>
    isSlotOutsideHours(s, doctor.consultationHours)
  )

  // Build a set of booked keys: "YYYY-MM-DD|9:00 AM"
  const bookedKeys = new Set<string>()
for (const appt of appointments ?? []) {
  if (appt.status === "cancelled") continue
  const d = new Date(appt.schedule)
  const dateStr = d.toISOString().split("T")[0]
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const period = hours >= 12 ? "PM" : "AM"
  if (hours > 12) hours -= 12
  if (hours === 0) hours = 12
  const timeStr = `${hours}:${minutes.toString().padStart(2, "0")} ${period}`
  bookedKeys.add(`${dateStr}|${timeStr}`)
}

  // Today's appointments (for right panel)
  const todayStr = today.toISOString().split("T")[0]
  const todayAppointments = (appointments ?? [])
    .filter(a => {
      const d = new Date(a.schedule)
      return d.toISOString().split("T")[0] === todayStr && a.status !== "cancelled"
    })
    .sort((a, b) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())

  const markDone = (id: string) => setDoneIds(prev => new Set([...prev, id]))

  const doneCount = todayAppointments.filter(a => doneIds.has(a.$id)).length

  function getSlotStatus(dayDate: Date, slot: string): SlotStatus {
    const fullDayName = DAY_ORDER[dayDate.getDay()]
    if (!doctor.availableDays.includes(fullDayName)) return "off"
    const dateStr = dayDate.toISOString().split("T")[0]
    if (bookedKeys.has(`${dateStr}|${slot}`)) return "booked"
    return "available"
  }

  const slotStyle: Record<SlotStatus, string> = {
    available: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-default",
    booked: "bg-[#C8D9EE] text-[#203C67] border-[#A6BAD7] cursor-not-allowed opacity-80",
    off: "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed",
  }

  // Format appointment time for display
  function formatApptTime(isoStr: string): string {
    const d = new Date(isoStr)
    let hours = d.getHours()
    const minutes = d.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    if (hours > 12) hours -= 12
    if (hours === 0) hours = 12
    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Initials from name
  function initials(name: string): string {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
  }

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Weekly Calendar */}
      <div className="flex-1 border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[#203C67] font-semibold text-[16px]">Weekly Calendar</h2>
            <p className="text-[12px] text-gray-500">
              {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
              {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {" · "}Gray days = unavailable per your profile
            </p>
          </div>
          <div className="flex gap-3 text-[11px] items-center">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-300" />Available</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#A6BAD7]" />Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" />Off</span>
          </div>
        </div>

        {/* Out-of-range warning */}
        {outOfRangeSlots.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <svg className="mt-0.5 flex-shrink-0 text-red-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] text-red-600 leading-relaxed">
              Slots <strong>{outOfRangeSlots.join(", ")}</strong> fall outside your consultation hours ({doctor.consultationHours}).
              Please update either in{" "}
              <DoctorEditProfileModal doctorId={doctorId} user={user} doctor={doctor} />
            </p>
          </div>
        )}

        <div className="overflow-auto flex-1 remove-scrollbar">
  <table className="w-full text-[11px] border-collapse table-fixed">
    <colgroup>
      <col className="w-20" />
      {weekDates.map((_, i) => (
        <col key={i} className="w-[calc((100%-5rem)/7)]" />
      ))}
    </colgroup>
    <thead>
      <tr className="border-b border-[#203C6720]">
        <th className="text-left text-gray-400 font-normal pb-3 pr-3 sticky left-0 bg-white/60 backdrop-blur-sm z-10">
          Time
        </th>
        {weekDates.map((date, i) => {
          const isToday = i === todayDayIndex
          const fullDay = DAY_ORDER[date.getDay()]
          const isAvailableDay = doctor.availableDays.includes(fullDay)
          return (
            <th
              key={i}
              className={`text-center font-medium pb-3 px-1 ${
                isToday
                  ? "text-[#203C67]"
                  : isAvailableDay
                  ? "text-gray-600"
                  : "text-gray-300"
              }`}
            >
              <div className="text-[10px] font-normal tracking-wide uppercase">
                {DAY_SHORT[date.getDay()]}
              </div>
              <div
                className={`text-[15px] font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                  isToday ? "bg-[#203C67] text-white" : ""
                }`}
              >
                {date.getDate()}
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
    <tbody>
      {doctor.slotsAvailable.length === 0 ? (
        <tr>
          <td
            colSpan={8}
            className="text-center py-10 text-gray-400 text-[12px]"
          >
            No time slots added yet. Add slots via Edit Profile.
          </td>
        </tr>
      ) : (
        doctor.slotsAvailable.map((slot, rowIdx) => (
          <tr
            key={slot}
            className={`border-b border-[#203C6710] ${
              rowIdx % 2 === 0 ? "bg-transparent" : "bg-[#203C6704]"
            }`}
          >
            <td className="text-gray-500 pr-3 py-2 whitespace-nowrap font-medium sticky left-0 bg-inherit backdrop-blur-sm z-10 text-[10px] tracking-wide">
              {slot}
            </td>
            {weekDates.map((date, di) => {
              const status = getSlotStatus(date, slot)
              return (
                <td key={di} className="px-1.5 py-2">
                  <div
                    className={`rounded-md border text-center py-2 transition-colors text-[11px] font-semibold ${slotStyle[status]}`}
                    title={
                      status === "booked"
                        ? "Booked"
                        : status === "off"
                        ? "Doctor unavailable this day"
                        : "Available"
                    }
                  >
                    {status === "booked" && "●"}
                    {status === "available" && "○"}
                    {status === "off" && "—"}
                  </div>
                </td>
              )
            })}
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
      </div>

      {/* Right Column */}
      <div className="w-[300px] min-w-[260px] flex flex-col gap-4">

        {/* Today's List */}
        <div className="border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#203C67] font-semibold text-[15px]">Today&apos;s List</h2>
              <p className="text-[11px] text-gray-500">
                {today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
            <span className="text-[11px] bg-[#A6BAD7] text-[#203C67] rounded-full px-2 py-0.5 font-medium">
              {doneCount}/{todayAppointments.length} done
            </span>
          </div>

          <div className="h-1.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-[#203C67] rounded-full transition-all duration-500"
              style={{ width: todayAppointments.length ? `${(doneCount / todayAppointments.length) * 100}%` : "0%" }}
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {todayAppointments.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center mt-4">No appointments today.</p>
            ) : (
              todayAppointments.map((appt) => {
                const done = doneIds.has(appt.$id)
                return (
                  <div
                    key={appt.$id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-opacity ${
                      done ? "opacity-50 border-gray-200 bg-gray-50" : "border-[#203C6730] bg-white/60"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#A6BAD7] flex items-center justify-center text-[10px] font-semibold text-[#203C67] flex-shrink-0">
                      {initials(appt.patientName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {appt.patientName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {formatApptTime(appt.schedule)} · {appt.reason}
                      </p>
                    </div>
                    {done ? (
                      <span className="text-green-500 flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    ) : (
                      <button
                        onClick={() => markDone(appt.$id)}
                        className="text-[10px] bg-[#203C67] text-white rounded-md px-2 py-1 hover:bg-[#2d5494] transition-colors flex-shrink-0"
                      >
                        Done
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Edit Profile + Info */}
        <div className="border border-[#203C67] rounded-xl p-4 bg-[#203C6710] flex flex-col gap-3">
          <div>
            <h3 className="text-[12px] font-semibold text-[#203C67] mb-1 flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Slot info
            </h3>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Gray columns mean you&apos;re unavailable that day. Booked slots are locked. To change your available days or time slots, use Edit Profile below.
            </p>
          </div>
          <DoctorEditProfileModal doctorId={doctorId} user={user} doctor={doctor} />
        </div>

      </div>
    </div>
  )
}