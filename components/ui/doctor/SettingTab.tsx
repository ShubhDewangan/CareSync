/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Doctor } from "@/types/appwrite"
import { useRouter } from 'next/navigation'
import { updateDoctorSettings } from '@/lib/actions/doctor.actions'
import { useState } from "react"

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface Settings {
  startTime: string; endTime: string; fee: string | number
  appointmentSpan: string; availableDays: string[]
  emailNotif: boolean; smsNotif: boolean; bookingNotif: boolean; reminderNotif: boolean
}

const toTime24 = (t: string) => {
  const match = t.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/)
  if (!match) return "09:00"
  let h = parseInt(match[1])
  const m = match[2]
  const period = match[3]
  if (period === "PM" && h !== 12) h += 12
  if (period === "AM" && h === 12) h = 0
  return `${h.toString().padStart(2, "0")}:${m}`
}
const parseHours = (ch: string) => {
  const parts = ch?.split(" - ")
  if (parts?.length === 2) return { start: toTime24(parts[0].trim()), end: toTime24(parts[1].trim()) }
  return { start: "09:00", end: "17:00" }
}
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed",
  Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun"
}
const DAY_FULL: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
}
const formatTo12Hour = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`
}

export default function SettingsTab({ doctor, doctorId }: { doctor: Doctor; doctorId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { start, end } = parseHours(doctor.consultationHours)

  const [settings, setSettings] = useState<Settings>({
    startTime: start, endTime: end,
    fee: doctor.consultationFee ?? "500",
    appointmentSpan: doctor.appointmentSpan ?? "30",
    availableDays: (doctor.availableDays ?? []).map(d => DAY_SHORT[d] ?? d),
    emailNotif: true, smsNotif: false, bookingNotif: true, reminderNotif: true,
  })
  const [saved, setSaved] = useState(false)

  const toggleDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updated = await updateDoctorSettings(doctorId, {
        consultationHours: `${formatTo12Hour(settings.startTime)} - ${formatTo12Hour(settings.endTime)}`,
        consultationFee: String(settings.fee),
        appointmentSpan: settings.appointmentSpan,
        availableDays: settings.availableDays.map(d => DAY_FULL[d] ?? d),
      })
      if (updated) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        router.refresh()
      }
    } catch (error) {
      console.error('Settings save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative h-5 w-9 rounded-full transition-colors duration-200 flex-shrink-0 ${on ? "bg-[#203C67]" : "bg-gray-300"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  )

  return (
    <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0 overflow-y-auto">

      {/* Main settings */}
      <div className="flex-1 flex flex-col gap-4 max-w-2xl">

        {/* Consultation hours */}
        <div className="border border-[#203C67] rounded-xl p-4 sm:p-5 bg-white/40 backdrop-blur-sm">
          <h2 className="text-[#203C67] font-semibold text-[14px] sm:text-[15px] mb-4 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Consultation Hours
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-gray-500 font-medium">Start time</label>
              <input type="time" value={settings.startTime}
                onChange={e => setSettings(p => ({ ...p, startTime: e.target.value }))}
                className="border border-[#203C6740] rounded-lg px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-gray-500 font-medium">End time</label>
              <input type="time" value={settings.endTime}
                onChange={e => setSettings(p => ({ ...p, endTime: e.target.value }))}
                className="border border-[#203C6740] rounded-lg px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Available days */}
        <div className="border border-[#203C67] rounded-xl p-4 sm:p-5 bg-white/40 backdrop-blur-sm">
          <h2 className="text-[#203C67] font-semibold text-[14px] sm:text-[15px] mb-4 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Available Days
          </h2>
          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
            {ALL_DAYS.map(day => {
              const active = settings.availableDays.includes(day)
              return (
                <button key={day} onClick={() => toggleDay(day)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[12px] font-medium border transition-all ${
                    active ? "bg-[#203C67] text-white border-[#203C67]" : "bg-white/60 text-gray-500 border-[#203C6730] hover:border-[#203C67]"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Fee & span */}
        <div className="border border-[#203C67] rounded-xl p-4 sm:p-5 bg-white/40 backdrop-blur-sm">
          <h2 className="text-[#203C67] font-semibold text-[14px] sm:text-[15px] mb-4 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Fees & Appointment
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-gray-500 font-medium">Consultation fee (₹)</label>
              <input type="number" value={settings.fee}
                onChange={e => setSettings(p => ({ ...p, fee: e.target.value }))}
                className="border border-[#203C6740] rounded-lg px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-gray-500 font-medium">Appointment span (mins)</label>
              <input type="number" value={settings.appointmentSpan}
                onChange={e => setSettings(p => ({ ...p, appointmentSpan: e.target.value }))}
                className="border border-[#203C6740] rounded-lg px-2 sm:px-3 py-2 text-[12px] sm:text-[13px] bg-white/60 focus:outline-none focus:border-[#203C67] text-gray-800"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Slots split into {settings.appointmentSpan}-min windows between {settings.startTime} – {settings.endTime}
          </p>
        </div>

        {/* Notifications */}
        <div className="border border-[#203C67] rounded-xl p-4 sm:p-5 bg-white/40 backdrop-blur-sm">
          <h2 className="text-[#203C67] font-semibold text-[14px] sm:text-[15px] mb-4 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notifications
          </h2>
          <div className="flex flex-col divide-y divide-[#203C6710]">
            {[
              { key: "emailNotif"   as const, label: "Email notifications",  sub: "New bookings and cancellations" },
              { key: "smsNotif"     as const, label: "SMS reminders",         sub: "1 hour before appointment"      },
              { key: "bookingNotif" as const, label: "New booking alerts",    sub: "When a patient books a slot"    },
              { key: "reminderNotif"as const, label: "Daily summary",         sub: "Morning digest of the day"      },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] sm:text-[13px] text-gray-700 font-medium">{n.label}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">{n.sub}</p>
                </div>
                <Toggle on={settings[n.key] as boolean} onToggle={() => setSettings(p => ({ ...p, [n.key]: !p[n.key] }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3 pb-4">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 sm:px-6 py-2.5 bg-[#203C67] text-white rounded-lg text-[12px] sm:text-[13px] font-medium hover:bg-[#2d5494] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving…" : "Save settings"}
          </button>
          {saved && (
            <span className="text-[12px] text-green-600 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Settings saved
            </span>
          )}
        </div>
      </div>

      {/* Right info card — stacks below on mobile */}
      <div className="w-full lg:w-[240px] lg:min-w-[220px] flex flex-col gap-4 lg:self-start">
        <div className="border border-[#203C67] rounded-xl p-4 bg-[#203C6710]">
          <p className="text-[12px] font-semibold text-[#203C67] mb-2">Settings summary</p>
          <div className="flex flex-col gap-2 text-[11px] text-gray-600">
            <div className="flex justify-between"><span>Hours</span><span className="font-medium text-gray-800">{settings.startTime} – {settings.endTime}</span></div>
            <div className="flex justify-between"><span>Fee</span><span className="font-medium text-gray-800">₹{settings.fee}</span></div>
            <div className="flex justify-between"><span>Slot length</span><span className="font-medium text-gray-800">{settings.appointmentSpan} min</span></div>
            <div className="flex justify-between"><span>Active days</span><span className="font-medium text-gray-800">{settings.availableDays.length}/7</span></div>
          </div>
        </div>
        <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
          <p className="text-[11px] font-semibold text-orange-700 mb-1">⚠ Note</p>
          <p className="text-[11px] text-orange-600 leading-relaxed">
            Changes to slots or fees won&apos;t affect already-confirmed appointments.
          </p>
        </div>
      </div>
    </div>
  )
}