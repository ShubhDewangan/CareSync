"use client"

// components/doctor/tabs/ScheduleTab.tsx

import { useState } from "react"

type SlotStatus = "available" | "booked" | "off" | "today-booked"

interface Slot {
  time: string
  status: SlotStatus
}

interface DaySchedule {
  day: string
  date: string
  slots: Slot[]
}

interface TodayAppointment {
  id: string
  time: string
  name: string
  reason: string
  avatar: string
  done: boolean
}

const TIMES = ["9:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"]

const WEEK_SCHEDULE: DaySchedule[] = [
  {
    day: "Mon", date: "14",
    slots: ["available","booked","available","off","available","available","booked","available"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Tue", date: "15",
    slots: ["booked","booked","available","available","off","available","available","booked"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Wed", date: "16",
    slots: ["available","available","booked","available","available","booked","off","available"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Thu", date: "17",
    slots: ["booked","today-booked","available","booked","available","off","available","booked"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Fri", date: "18",
    slots: ["available","available","booked","available","booked","available","available","off"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Sat", date: "19",
    slots: ["booked","available","off","off","off","off","off","off"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
  {
    day: "Sun", date: "20",
    slots: ["off","off","off","off","off","off","off","off"].map((s, i) => ({ time: TIMES[i], status: s as SlotStatus })),
  },
]

const INITIAL_TODAY: TodayAppointment[] = [
  { id: "1", time: "9:00 AM", name: "Kavya Rao", reason: "Headache & follow-up", avatar: "KR", done: false },
  { id: "2", time: "11:00 AM", name: "Deepak Soni", reason: "Skin allergy review", avatar: "DS", done: false },
  { id: "3", time: "2:00 PM", name: "Meena Patil", reason: "General check-up", avatar: "MP", done: true },
  { id: "4", time: "4:00 PM", name: "Raj Kumar", reason: "BP monitoring", avatar: "RK", done: false },
]

const slotStyle: Record<SlotStatus, string> = {
  available: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer",
  booked: "bg-[#C8D9EE] text-[#203C67] border-[#A6BAD7] cursor-not-allowed opacity-70",
  off: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed",
  "today-booked": "bg-[#203C67] text-white border-[#203C67] cursor-not-allowed",
}

export default function ScheduleTab() {
  const [today, setToday] = useState<TodayAppointment[]>(INITIAL_TODAY)
  const [schedule, setSchedule] = useState<DaySchedule[]>(WEEK_SCHEDULE)

  const markDone = (id: string) => {
    setToday((prev) => prev.map((a) => (a.id === id ? { ...a, done: true } : a)))
  }

  const toggleSlot = (dayIdx: number, slotIdx: number) => {
    setSchedule((prev) =>
      prev.map((day, di) =>
        di !== dayIdx
          ? day
          : {
              ...day,
              slots: day.slots.map((slot, si) =>
                si !== slotIdx || slot.status === "booked" || slot.status === "today-booked"
                  ? slot
                  : { ...slot, status: slot.status === "available" ? "off" : "available" }
              ),
            }
      )
    )
  }

  const doneCount = today.filter((a) => a.done).length

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Weekly calendar */}
      <div className="flex-1 border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[#203C67] font-semibold text-[16px]">Weekly Calendar</h2>
            <p className="text-[12px] text-gray-500">Apr 14 – 20, 2025 · Click available/off to toggle block</p>
          </div>
          <div className="flex gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-300" />Available</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#A6BAD7]" />Booked</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" />Off</span>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="w-14 text-left text-gray-400 font-normal pb-2 pr-2">Time</th>
                {schedule.map((d) => (
                  <th key={d.day} className={`text-center font-medium pb-2 px-1 ${d.day === "Thu" ? "text-[#203C67]" : "text-gray-500"}`}>
                    <div>{d.day}</div>
                    <div className={`text-[13px] font-semibold ${d.day === "Thu" ? "text-[#203C67]" : "text-gray-700"}`}>{d.date}</div>
                    {d.day === "Thu" && <div className="h-1 w-1 rounded-full bg-[#203C67] mx-auto mt-0.5" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map((time, si) => (
                <tr key={time} className="border-t border-[#203C6710]">
                  <td className="text-gray-400 pr-2 py-1 whitespace-nowrap">{time}</td>
                  {schedule.map((day, di) => {
                    const slot = day.slots[si]
                    return (
                      <td key={day.day} className="px-1 py-1">
                        <div
                          className={`rounded border text-center py-1.5 transition-colors text-[10px] font-medium ${slotStyle[slot.status]}`}
                          onClick={() => toggleSlot(di, si)}
                          title={slot.status === "booked" ? "Booked — cannot unblock" : "Click to toggle"}
                        >
                          {slot.status === "booked" && "●"}
                          {slot.status === "today-booked" && "●"}
                          {slot.status === "available" && "○"}
                          {slot.status === "off" && "—"}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right column */}
      <div className="w-[300px] min-w-[260px] flex flex-col gap-4">
        {/* Today's list */}
        <div className="border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[#203C67] font-semibold text-[15px]">Today&apos;s List</h2>
              <p className="text-[11px] text-gray-500">Thu, Apr 17</p>
            </div>
            <span className="text-[11px] bg-[#A6BAD7] text-[#203C67] rounded-full px-2 py-0.5 font-medium">
              {doneCount}/{today.length} done
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-[#203C67] rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / today.length) * 100}%` }}
            />
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto flex-1">
            {today.map((appt) => (
              <div
                key={appt.id}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-opacity ${
                  appt.done ? "opacity-50 border-gray-200 bg-gray-50" : "border-[#203C6730] bg-white/60"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-[#A6BAD7] flex items-center justify-center text-[10px] font-semibold text-[#203C67] flex-shrink-0">
                  {appt.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-medium truncate ${appt.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {appt.name}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{appt.time} · {appt.reason}</p>
                </div>
                {appt.done ? (
                  <span className="text-green-500 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                ) : (
                  <button
                    onClick={() => markDone(appt.id)}
                    className="text-[10px] bg-[#203C67] text-white rounded-md px-2 py-1 hover:bg-[#2d5494] transition-colors flex-shrink-0"
                  >
                    Done
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Slot blocking info */}
        <div className="border border-[#203C67] rounded-xl p-4 bg-[#203C6710]">
          <h3 className="text-[12px] font-semibold text-[#203C67] mb-1 flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Slot blocking
          </h3>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Booked slots are greyed out and unclickable. Click available (○) or off (—) slots in the calendar to toggle them. Confirmed appointments automatically block their time slot.
          </p>
        </div>
      </div>
    </div>
  )
}