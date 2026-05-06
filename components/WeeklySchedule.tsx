/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useRef, useState } from "react"
import { toLocalDateStr } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotStatus = "available" | "booked" | "off" | "blocked" | "dbblocked"

export interface WeeklyScheduleTableProps {
  /** Slots the doctor has configured e.g. ["9:00 AM", "9:30 AM", …] */
  slotsAvailable: string[]
  /** Days the doctor works e.g. ["Monday", "Wednesday"] */
  availableDays: string[]
  /** "9:00 AM - 5:00 PM" */
  consultationHours: string
  /** JSON string of blocked slots keyed by date string */
  blockedSlots?: string
  /** JSON string of booked slots keyed by date string */
  bookedSlots?: string

  /**
   * Read-only mode — hides toggle interactions.
   * Use for receptionist / external views.
   */
  readOnly?: boolean

  /**
   * Called with the updated blocked map whenever a slot is toggled.
   * Only fired when readOnly is false.
   */
  onToggle?: (next: Record<string, string[]>) => void

  /** Saving indicator controlled by parent */
  savingState?: "idle" | "pending" | "saved"

  /**
   * Currently selected date — highlights that column.
   * Controlled externally so parent can sync the appointments panel.
   */
  selectedDate?: Date

  /**
   * Fires when the user clicks a column header date.
   * Parent should update selectedDate accordingly.
   */
  onDateSelect?: (date: Date) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ORDER = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSlots(raw?: string): Record<string, string[]> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function parseTime(t: string) {
  const m = t.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/)
  if (!m) return null
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  if (m[3] === "PM" && h !== 12) h += 12
  if (m[3] === "AM" && h === 12) h = 0
  return { hours: h, minutes: min }
}

function parseConsultationHours(ch: string) {
  const parts = ch.split(" - ")
  if (parts.length !== 2) return null
  const start = parseTime(parts[0].trim())
  const end   = parseTime(parts[1].trim())
  if (!start || !end) return null
  return { start, end }
}

function isSlotOutsideHours(slot: string, consultationHours: string) {
  const range    = parseConsultationHours(consultationHours)
  const slotTime = parseTime(slot)
  if (!range || !slotTime) return false
  const slotMin  = slotTime.hours * 60 + slotTime.minutes
  const startMin = range.start.hours * 60 + range.start.minutes
  const endMin   = range.end.hours * 60 + range.end.minutes
  return slotMin < startMin || slotMin >= endMin
}

/** Returns the 7 dates of the week containing the given anchor date */
function getWeekDates(anchor: Date): Date[] {
  const sunday = new Date(anchor)
  sunday.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

function toISTDate(iso: string): Date {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function fmtMonthDay(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeeklyScheduleTable({
  slotsAvailable,
  availableDays,
  consultationHours,
  blockedSlots: blockedSlotsProp,
  bookedSlots:  bookedSlotsProp,
  readOnly      = false,
  onToggle,
  savingState   = "idle",
  selectedDate,
  onDateSelect,
}: WeeklyScheduleTableProps) {
  const today = new Date()

  // ── Anchor date drives which week is shown ────────────────────────────────
  const [anchorDate, setAnchorDate] = useState<Date>(today)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerValue, setPickerValue] = useState("")
  const pickerRef = useRef<HTMLDivElement>(null)

  const weekDates    = getWeekDates(anchorDate)
  const isCurrentWeek = sameDay(weekDates[0], getWeekDates(today)[0])
  const todayIndex   = today.getDay()

  // ── Slot state ─────────────────────────────────────────────────────────────
  const [blocked, setBlocked] = useState<Record<string, string[]>>(() => parseSlots(blockedSlotsProp))
  const [bookedSlots]         = useState<Record<string, string[]>>(() => parseSlots(bookedSlotsProp))

  // Keep in sync if parent pushes new props (e.g. live updates)
  useEffect(() => { setBlocked(parseSlots(blockedSlotsProp)) }, [blockedSlotsProp])

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowDatePicker(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goWeek = (dir: -1 | 1) => {
    const next = new Date(anchorDate)
    next.setDate(anchorDate.getDate() + dir * 7)
    setAnchorDate(next)
  }

  const goToDate = (dateStr: string) => {
    if (!dateStr) return
    // dateStr is YYYY-MM-DD (local), create a local date
    const [y, m, d] = dateStr.split("-").map(Number)
    setAnchorDate(new Date(y, m - 1, d))
    setShowDatePicker(false)
    setPickerValue("")
  }

  const goToToday = () => { setAnchorDate(today); setShowDatePicker(false) }

  // ── Slot logic ─────────────────────────────────────────────────────────────
  function getSlotStatus(dayDate: Date, slot: string): SlotStatus {
    const fullDayName = DAY_ORDER[dayDate.getDay()]
    if (!availableDays.includes(fullDayName)) return "off"
    const dateStr = toLocalDateStr(dayDate)
    if (bookedSlots[dateStr]?.includes(slot)) return "booked"
    if (blocked[dateStr]?.includes(slot))     return "blocked"
    return "available"
  }

  const toggleSlot = (date: Date, slot: string) => {
    if (readOnly) return
    const dateStr  = toLocalDateStr(date)
    const existing = blocked[dateStr] ?? []
    const next = existing.includes(slot)
      ? { ...blocked, [dateStr]: existing.filter(s => s !== slot) }
      : { ...blocked, [dateStr]: [...existing, slot] }
    if (next[dateStr]?.length === 0) delete next[dateStr]
    setBlocked(next)
    onToggle?.(next)
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const slotStyle: Record<SlotStatus, string> = {
    available: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 cursor-pointer",
    booked:    "bg-[#C8D9EE] text-[#203C67] border-[#A6BAD7] cursor-not-allowed opacity-80",
    off:       "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed",
    blocked:   "bg-red-50 text-red-400 border-red-200 cursor-pointer hover:bg-red-100",
    dbblocked: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70",
  }

  const slotIcon: Record<SlotStatus, string> = {
    available: "○", booked: "●", off: "—", blocked: "✕", dbblocked: "✕",
  }

  const outOfRangeSlots = slotsAvailable.filter(s =>
    isSlotOutsideHours(s, consultationHours)
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[#203C67] font-semibold text-[16px]">Weekly Calendar</h2>
            {readOnly && (
              <span className="text-[10px] bg-[#203C6715] text-[#203C67] border border-[#203C6730] rounded-full px-2 py-0.5 font-medium">
                View only
              </span>
            )}
            {savingState === "pending" && <span className="text-[11px] text-orange-400">Saving…</span>}
            {savingState === "saved"   && <span className="text-[11px] text-green-500">Saved ✓</span>}
          </div>

          {/* Week range + navigation */}
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => goWeek(-1)}
              className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-[#203C67] hover:bg-[#203C6710] transition-colors text-[13px]"
              title="Previous week"
            >‹</button>

            {/* Clickable date range — opens picker */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setShowDatePicker(v => !v)}
                className="text-[12px] text-gray-500 hover:text-[#203C67] transition-colors flex items-center gap-1 group"
                title="Jump to a date"
              >
                <span>
                  {fmtMonthDay(weekDates[0])} – {fmtMonthDay(weekDates[6])},{" "}
                  {weekDates[6].getFullYear()}
                </span>
                {/* Calendar icon */}
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  className="opacity-40 group-hover:opacity-100 transition-opacity"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8"  y1="2" x2="8"  y2="6" />
                  <line x1="3"  y1="10" x2="21" y2="10" />
                </svg>
              </button>

              {/* Date picker dropdown */}
              {showDatePicker && (
                <div
                  className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-[#203C6725] rounded-xl shadow-xl p-3 flex flex-col gap-2"
                  style={{ minWidth: 210 }}
                >
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Jump to week containing</p>
                  <input
                    type="date"
                    value={pickerValue}
                    onChange={e => setPickerValue(e.target.value)}
                    className="text-[12px] text-gray-700 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#203C67] transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => goToDate(pickerValue)}
                      disabled={!pickerValue}
                      className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg bg-[#203C67] text-white disabled:opacity-40 hover:bg-[#2d5494] transition-colors"
                    >
                      Go
                    </button>
                    <button
                      onClick={goToToday}
                      className="flex-1 text-[11px] font-medium py-1.5 rounded-lg border border-[#203C67] text-[#203C67] hover:bg-[#203C6710] transition-colors"
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => goWeek(1)}
              className="w-5 h-5 flex items-center justify-center rounded-md text-gray-400 hover:text-[#203C67] hover:bg-[#203C6710] transition-colors text-[13px]"
              title="Next week"
            >›</button>

            {!isCurrentWeek && (
              <button
                onClick={goToToday}
                className="text-[10px] text-[#203C67] border border-[#203C6730] rounded-full px-2 py-0.5 hover:bg-[#203C6710] transition-colors"
              >
                Today
              </button>
            )}
          </div>

          {!readOnly && (
            <p className="text-[11px] text-gray-400 mt-0.5">Click a slot to block/unblock</p>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-[11px] items-center flex-wrap">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-300" />Available</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#A6BAD7]" />Booked</span>
          {!readOnly && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-200" />Blocked</span>}
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gray-200" />Off</span>
        </div>
      </div>

      {/* Out-of-range warning */}
      {outOfRangeSlots.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <svg className="mt-0.5 flex-shrink-0 text-red-500" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-[11px] text-red-600 leading-relaxed">
            Slots <strong>{outOfRangeSlots.join(", ")}</strong> fall outside consultation hours ({consultationHours}).
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-auto flex-1 custom-scroll">
        <table className="w-full text-[11px] border-collapse table-fixed">
          <colgroup>
            <col className="w-20" />
            {weekDates.map((_, i) => <col key={i} />)}
          </colgroup>
          <thead>
            <tr className="border-b border-[#203C6720]">
              <th className="text-left text-gray-400 font-normal pb-3 pr-3 sticky left-0 bg-white/60 backdrop-blur-sm z-10">Time</th>
              {weekDates.map((date, i) => {
                const isToday     = isCurrentWeek && i === todayIndex
                const fullDay     = DAY_ORDER[date.getDay()]
                const isAvailable = availableDays.includes(fullDay)
                const isSelected  = selectedDate ? sameDay(date, selectedDate) : false
                return (
                  <th
                    key={i}
                    onClick={() => onDateSelect?.(date)}
                    className={`text-center font-medium pb-3 px-1 transition-colors
                      ${onDateSelect ? "cursor-pointer" : ""}
                      ${isToday ? "text-[#203C67]" : isAvailable ? "text-gray-600" : "text-gray-300"}
                    `}
                    title={onDateSelect ? `View appointments for ${fmtMonthDay(date)}` : undefined}
                  >
                    <div className="text-[10px] font-normal tracking-wide uppercase">{DAY_SHORT[date.getDay()]}</div>
                    <div
                      className={`text-[15px] font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full transition-all
                        ${isSelected && !isToday ? "bg-[#203C6720] ring-2 ring-[#203C67] ring-offset-1 text-[#203C67]" : ""}
                        ${isToday ? "bg-[#203C67] text-white" : ""}
                      `}
                    >
                      {date.getDate()}
                    </div>
                    {/* Selected underline indicator */}
                    {isSelected && (
                      <div className="w-4 h-0.5 rounded-full bg-[#203C67] mx-auto mt-1" />
                    )}
                    {/* Past week dim dot */}
                    {!isCurrentWeek && date < today && !isToday && !isSelected && (
                      <div className="w-1 h-1 rounded-full bg-gray-300 mx-auto mt-0.5" />
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {slotsAvailable.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-400 text-[12px]">
                  No time slots configured.
                </td>
              </tr>
            ) : (
              slotsAvailable.map((slot, rowIdx) => (
                <tr
                  key={slot}
                  className={`border-b border-[#203C6710] ${rowIdx % 2 === 0 ? "bg-transparent" : "bg-[#203C6704]"}`}
                >
                  <td className="text-gray-500 pr-3 py-2 whitespace-nowrap font-medium sticky left-0 bg-inherit z-10 text-[10px] tracking-wide">
                    {slot}
                  </td>
                  {weekDates.map((date, di) => {
                    const status      = getSlotStatus(date, slot)
                    const isClickable = !readOnly && status !== "booked" && status !== "off" && status !== "dbblocked"
                    return (
                      <td key={di} className="px-1.5 py-2">
                        <div
                          onClick={() => isClickable && toggleSlot(date, slot)}
                          className={`rounded-md border text-center py-2 transition-colors text-[11px] font-semibold select-none ${slotStyle[status]}`}
                          title={
                            readOnly
                              ? status === "booked"    ? "Booked"
                              : status === "blocked"   ? "Blocked"
                              : status === "off"       ? "Unavailable"
                              : "Available"
                            : status === "booked"    ? "Patient booked — cannot modify"
                            : status === "blocked"   ? "Blocked — click to unblock"
                            : status === "dbblocked" ? "Blocked (saved)"
                            : status === "off"       ? "Unavailable day"
                            : "Available — click to block"
                          }
                        >
                          {slotIcon[status]}
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
  )
}