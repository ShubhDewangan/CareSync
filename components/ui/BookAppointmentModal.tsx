"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image'
import { useEffect, useState } from 'react'
import * as React from "react"
import { addDays, format } from "date-fns"

import { Dialog, DialogContent } from './dialog'
import { Doctor } from '@/types/appwrite'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { cn, toLocalDateStr } from "@/lib/utils"
import { createAppointment } from "@/lib/actions/appointment.actions"
import { showToast } from "@/components/ui/toaster"
import { usePathname } from 'next/navigation'
import { AuthUser, FullUser } from '@/context/UserContext'
import { getDoctorBlockedSlots, getDoctorBookedSlots, getAllDoctors } from '@/lib/actions/doctor.actions'

const QUICK_DATES = [
  { label: "Today",      value: 0  },
  { label: "Tomorrow",   value: 1  },
  { label: "In 3 days",  value: 3  },
  { label: "In a week",  value: 7  },
  { label: "In 2 weeks", value: 14 },
]

const BookAppointmentModal = ({
  text, variant, DateToday, doctor: doctorProp,
  userId, patientId, authUser, fullUser, falseButton,
}: {
  text?:        string
  variant?:     string
  DateToday:    string
  doctor?:      Doctor
  userId:       string
  patientId?:   string
  authUser?:    AuthUser
  fullUser:     FullUser
  falseButton?: boolean
}) => {
  const [isOpen,         setIsOpen]         = useState(false)
  const [step,           setStep]           = useState<0 | 1 | 2 | 3>(doctorProp ? 1 : 0)
  const [isLoading,      setIsLoading]      = useState(false)
  const [allDoctors,     setAllDoctors]     = useState<Doctor[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(false)
  const [doctorSearch,   setDoctorSearch]   = useState("")
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | undefined>(doctorProp)
  const [date,           setDate]           = useState<Date | undefined>(new Date())
  const [currentMonth,   setCurrentMonth]   = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [selectedTime,   setSelectedTime]   = useState<string | null>(null)
  const [reason,         setReason]         = useState("")
  const [note,           setNote]           = useState("")
  const [blockedSlots,   setBlockedSlots]   = useState<Record<string, string[]>>({})
  const [bookedSlots,    setBookedSlots]     = useState<Record<string, string[]>>({})

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const path = usePathname()
  const doctor = selectedDoctor

  useEffect(() => {
    if (!doctorProp && isOpen) {
      setDoctorsLoading(true)
      getAllDoctors()
        .then((docs: Doctor[]) => setAllDoctors(docs ?? []))
        .catch(() => setAllDoctors([]))
        .finally(() => setDoctorsLoading(false))
    }
  }, [doctorProp, isOpen])

  useEffect(() => {
    if (!doctor) return
    getDoctorBlockedSlots(doctor.$id).then(setBlockedSlots)
    getDoctorBookedSlots(doctor.$id).then(setBookedSlots)
  }, [doctor, date])

  const canProceed = !!date && !!selectedTime

  function getPeriod(slot: string): string {
    const match = slot.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/)
    if (!match) return "Other"
    let hours = parseInt(match[1])
    const period = match[3]
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    if (hours < 12) return "Morning"
    if (hours < 17) return "Afternoon"
    return "Evening"
  }

  const TIME_SLOTS = (doctor?.slotsAvailable as string[] ?? []).map(slot => ({
    label: slot, period: getPeriod(slot),
  }))

  const groupedSlots = TIME_SLOTS.reduce<Record<string, string[]>>((acc, s) => {
    if (!acc[s.period]) acc[s.period] = []
    acc[s.period].push(s.label)
    return acc
  }, {})

  function getSelectedDayName(d: Date): string {
    return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]
  }

  const selectedDayName = date ? getSelectedDayName(date) : null
  const isDayOff = selectedDayName ? !(doctor?.availableDays ?? []).includes(selectedDayName) : false

  function isBlocked(slot: string): boolean {
    if (isDayOff) return true
    if (!date) return false
    return blockedSlots[toLocalDateStr(date)]?.includes(slot) ?? false
  }

  function isBooked(slot: string): boolean {
    if (!date) return false
    return bookedSlots[toLocalDateStr(date)]?.includes(slot) ?? false
  }

  function handleDateChange(d: Date | undefined) {
    setDate(d)
    if (d && selectedTime) {
      if (blockedSlots[toLocalDateStr(d)]?.includes(selectedTime)) setSelectedTime(null)
    }
    if (d) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
  }

  function handleQuickDate(days: number) {
    handleDateChange(addDays(new Date(), days))
  }

  function buildSchedule(): Date {
    if (!date || !selectedTime) return new Date()
    const [time, meridiem] = selectedTime.split(" ")
    // eslint-disable-next-line prefer-const
    let [hours, minutes] = time.split(":").map(Number)
    if (meridiem === "PM" && hours !== 12) hours += 12
    if (meridiem === "AM" && hours === 12) hours = 0
    const scheduled = new Date(date)
    scheduled.setHours(hours, minutes, 0, 0)
    return scheduled
  }

  async function handleConfirm() {
    if (!canProceed || !doctor) return
    setIsLoading(true)
    try {
      const appointmentData: CreateAppointmentParams = {
        userId,
        patient:       fullUser?.$id as any,
        primaryDoctor: doctor.name,
        schedule:      buildSchedule(),
        reason:        reason || "General consultation",
        note:          note   || "",
        status:        "pending" as Status,
      }
      const result = await createAppointment(appointmentData)
      if (result.bookedSlots) setBookedSlots(result.bookedSlots)
      if (!result.success && result.error === "SLOT_TAKEN") {
        setSelectedTime(null)
        setStep(1)
        showToast("error", "That slot was just taken! Please pick another time.", "top-right")
        return
      }
      if (!result.success) {
        showToast("error", "Could not book appointment. Please try again.", "top-right")
        return
      }
      showToast("success", "Appointment booked successfully!", "top-right")
      setStep(3)
      await new Promise(r => setTimeout(r, 3000))
      handleClose()
    } catch (error) {
      console.error("Appointment error:", error)
      showToast("error", "Could not book appointment. Please try again.", "top-right")
    } finally {
      setIsLoading(false)
    }
  }

  function handleBookingButton() {
    if (authUser?.userType === "doctor") {
      showToast("info", "Doctors cannot book appointments as patients.", "top-right")
      return
    }
    if (falseButton) {
      showToast("info", "You cannot book an appointment for yourself!", "top-right")
      return
    }
    if (!fullUser) {
      showToast("info", "Complete Registration to book an appointment!", "top-right")
      return
    }
    setIsOpen(true)
    setStep(doctorProp ? 1 : 0)
    setSelectedDoctor(doctorProp)
  }

  function handleClose() {
    setIsOpen(false)
    setStep(doctorProp ? 1 : 0)
    setSelectedDoctor(doctorProp)
    setDate(new Date())
    setSelectedTime(null)
    setReason("")
    setNote("")
    setDoctorSearch("")
  }

  const filteredDoctors = allDoctors.filter(d =>
    d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
    (d.specialization ?? []).some((s: string) => s.toLowerCase().includes(doctorSearch.toLowerCase()))
  )

  const stepsConfig = doctorProp
    ? [{ n: 1, label: "Schedule" }, { n: 2, label: "Confirm" }]
    : [{ n: 0, label: "Doctor" },   { n: 1, label: "Schedule" }, { n: 2, label: "Confirm" }]

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Trigger button */}
      {variant === 'ghost' ? (
        <button onClick={handleBookingButton}
          className="group inline-flex items-center justify-center gap-1.5 h-8 px-3 sm:px-4 rounded-full text-[10px] sm:text-[11px] text-[#34578b] font-medium text-nowrap mt-1 bg-transparent">
          <span>{text || 'Book Appointment'}</span>
        </button>
      ) : variant === 'sidebar' ? (
        <button onClick={handleBookingButton}
          className="w-full flex items-center justify-between gap-2 bg-[#203C67] hover:bg-[#162d50] text-white rounded-xl px-3.5 py-3 transition-colors group">
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-white leading-tight text-left">{text || 'Book Appointment'}</p>
            <p className="text-[10px] text-blue-200/60 mt-0.5 text-left">Find &amp; schedule a visit</p>
          </div>
          <div className="shrink-0 w-7 h-7 rounded-lg bg-white/50/10 group-hover:bg-white/50/20 flex items-center justify-center transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
        </button>
      ) : (
        <button onClick={handleBookingButton}
          className="group inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:border-[#4A70A9] hover:text-[#4A70A9] transition-all duration-200 h-8 px-3 sm:px-4 rounded-full text-[10px] sm:text-[11px] text-gray-600 font-medium text-nowrap mt-1 bg-[#e1d7bc]">
          <span>{text || 'Book Appointment'}</span>
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn(
          "p-0 border-[#c8d4de] bg-[#EFECE3] shadow-2xl overflow-hidden flex flex-col",
          "h-[100dvh] w-screen rounded-none",
          "sm:h-auto sm:max-h-[95vh] sm:w-[92vw] sm:rounded-2xl sm:max-w-[640px]",
          "lg:max-w-[860px] lg:max-h-[90vh] lg:w-[90vw]",
        )}>

          {/* ── Header ── */}
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-7 py-4 sm:py-5 border-b border-[#c8d4de] shrink-0">
            {doctor ? (
              <div className="flex items-center gap-3 min-w-0">
                {doctor.profilePic ? (
                  <Image src={doctor.profilePic} alt="profile" height={1000} width={1000} className="h-10 w-10 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#CEDBE3] flex items-center justify-center font-semibold text-sm shrink-0">
                    {doctor.name?.charAt(0) ?? "D"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-[14px] sm:text-[15px] leading-none truncate">Dr. {doctor.name}</p>
                  <p className="text-[#8FABD4] text-[11px] sm:text-[12px] mt-1 truncate">
                    {doctor.specialization?.length ? doctor.specialization[0] : "General Physician"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#e2ddd4] border border-[#d8d4c8] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0afc0" strokeWidth="1.8">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[14px] text-[#1a2535]">Book an Appointment</p>
                  <p className="text-[11px] text-[#a0afc0] mt-0.5">Select a doctor to get started</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 pr-8 sm:pr-5">
              <div className="flex items-center gap-2">
                {stepsConfig.map((s, i) => (
                  <React.Fragment key={s.n}>
                    <div className={cn(
                      "w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all",
                      step === s.n ? "bg-[#4A70A9] text-white"
                        : step > s.n ? "bg-[#CEDBE3] text-[#343641]"
                        : "bg-[#3d4050] text-[#8FABD4]"
                    )}>
                      {step > s.n ? "✓" : i + 1}
                    </div>
                    {i < stepsConfig.length - 1 && (
                      <div className={cn("w-6 sm:w-8 h-px", step > s.n ? "bg-[#CEDBE3]" : "bg-[#3d4050]")} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="text-[#585858] text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 rounded-full border border-[#585858] whitespace-nowrap">
                {DateToday}
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

            {/* Step 0 — Doctor Picker */}
            {step === 0 && (
              <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto remove-scrollbar flex-1">
                <p className="text-[11px] font-semibold text-[#343641]/60 uppercase tracking-wider">Choose a Doctor</p>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a0afc0]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)}
                    placeholder="Search by name or specialization…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#c8d4de] bg-white/50 text-[13px] text-[#343641] placeholder:text-[#bbc3cf] focus:outline-none focus:border-[#4A70A9] transition-colors"
                  />
                </div>
                {doctorsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <svg className="animate-spin text-[#4A70A9]" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    <p className="text-[12px] text-[#a0afc0]">Loading doctors…</p>
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <p className="text-[13px] text-[#a0afc0]">No doctors found</p>
                    {doctorSearch && (
                      <button onClick={() => setDoctorSearch("")} className="text-[12px] text-[#4A70A9] hover:underline">Clear search</button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredDoctors.map((doc) => {
                      const isSelected = selectedDoctor?.$id === doc.$id
                      const initials = doc.name.replace(/^Dr\.?\s*/i, '').split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                      return (
                        <button key={doc.$id} onClick={() => setSelectedDoctor(doc)}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                            isSelected ? "bg-[#dde8f5] border-[#4A70A9] shadow-sm" : "bg-white/50 border-[#e2ddd4] hover:border-[#4A70A9] hover:bg-[#f5f8fd]"
                          )}>
                          <div className="shrink-0">
                            {doc.profilePic ? (
                              <Image src={doc.profilePic} alt={doc.name} height={100} width={100} className="w-11 h-11 rounded-xl object-cover" />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[13px] font-bold text-[#203C67]">{initials}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#1a2535] truncate">Dr. {doc.name}</p>
                            <p className="text-[11px] text-[#8FABD4] truncate mt-0.5">
                              {doc.specialization?.length ? doc.specialization[0] : "General Physician"}
                            </p>
                            {doc.availableDays?.length > 0 && (
                              <p className="text-[10px] text-[#a0afc0] mt-1 truncate">
                                {doc.availableDays.slice(0, 3).join(", ")}
                                {doc.availableDays.length > 3 && ` +${doc.availableDays.length - 3} more`}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="shrink-0 w-5 h-5 rounded-full bg-[#4A70A9] flex items-center justify-center">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="flex justify-end pt-2">
                  <Button disabled={!selectedDoctor} onClick={() => setStep(1)}
                    className="bg-[#343641] hover:bg-[#4A70A9] text-[#EFECE3] px-7 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40">
                    Continue →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 1 — Schedule */}
            {step === 1 && (
              <div className="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto remove-scrollbar flex-1">
                <div className="flex flex-col lg:flex-row gap-5">
                  {/* Calendar */}
                  <div className="bg-white/50/70 backdrop-blur-md border border-[#d8e1ea] rounded-3xl p-3 sm:p-4 shadow-sm flex flex-col gap-4 lg:w-[300px] shrink-0">
                    <p className="text-[11px] font-semibold text-[#7c8da3] uppercase tracking-[0.18em]">Select Date</p>
                    <div className="flex gap-1 overflow-x-auto pb-1 remove-scrollbar">
                      {QUICK_DATES.map((qd) => (
                        <button key={qd.value} onClick={() => handleQuickDate(qd.value)}
                          className="shrink-0 px-2 py-1 rounded-full text-[11px] font-medium border border-[#d8e1ea] bg-white/50 hover:border-[#4A70A9] hover:text-[#4A70A9] transition-all">
                          {qd.label}
                        </button>
                      ))}
                    </div>
                    <Card className="w-full rounded-2xl border border-[#d9e3ec] shadow-sm bg-white/50 overflow-hidden">
                      <CardContent className="p-2 sm:p-3">
                        <Calendar mode="single" selected={date} onSelect={handleDateChange}
                          month={currentMonth} onMonthChange={setCurrentMonth}
                          fixedWeeks disabled={{ before: new Date() }} className="p-0"
                          classNames={{
                            months:       "flex flex-col",
                            month:        "space-y-2",
                            caption:      "flex justify-between items-center px-1 mb-2",
                            caption_label:"text-[11px] sm:text-[12px] font-semibold text-[#203C67]",
                            nav:          "flex items-center gap-1",
                            nav_button:   "h-6 w-6 rounded-lg border border-[#d9e3ec] hover:bg-[#f3f7fb]",
                            table:        "border-collapse w-full",
                            head_row:     "grid grid-cols-7",
                            head_cell:    "flex items-center justify-center text-[8px] sm:text-[9px] font-medium text-[#9db0c7] mb-1",
                            row:          "grid grid-cols-7 mt-1",
                            cell:         "flex items-center justify-center p-[2px]",
                            day:          "h-7 w-7 sm:h-8 sm:w-8 rounded-xl text-[9px] sm:text-[10px] font-medium transition-all flex items-center justify-center bg-[#f7f9fc] hover:bg-[#eaf2fc] hover:text-[#4A70A9]",
                            day_selected: "bg-[#4A70A9] text-white hover:bg-[#4A70A9] hover:text-white",
                            day_today:    "border border-[#4A70A9] text-[#4A70A9] bg-white/50",
                            day_outside:  "text-[#d3d3d3] bg-transparent",
                            day_disabled: "text-[#dcdcdc] bg-[#f5f5f5] opacity-50",
                          }}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Time slots */}
                  <div className="flex-1 min-w-0 bg-white/50/70 backdrop-blur-md border border-[#d8e1ea] rounded-3xl p-3 sm:p-4 shadow-sm flex flex-col gap-4">
                    <p className="text-[11px] sm:text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider">
                      Select Time
                      {date && <span className="ml-2 normal-case font-normal text-[#4A70A9] text-[11px] sm:text-[12px]">— {format(date, "EEE, MMM d")}</span>}
                    </p>
                    {isDayOff ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                        <div className="w-10 h-10 rounded-xl bg-[#fef6e4] border border-[#fcd89a] flex items-center justify-center text-xl">🗓</div>
                        <p className="text-[13px] font-semibold text-[#92400e]">Day off</p>
                        <p className="text-[11px] text-[#a0afc0]">
                          Dr. {doctor?.name} is not available on {selectedDayName}s.<br />
                          Available: {doctor?.availableDays?.join(", ")}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 overflow-y-auto remove-scrollbar">
                        {Object.entries(groupedSlots).map(([period, slots]) => (
                          <div key={period}>
                            <p className="text-[10px] sm:text-[11px] text-[#343641]/50 font-medium mb-2">{period}</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-1.5">
                              {slots.map((slot) => {
                                const blocked = isBlocked(slot)
                                const booked  = isBooked(slot)
                                const unavailable = blocked || booked
                                return (
                                  <button key={slot} disabled={unavailable}
                                    onClick={() => !unavailable && setSelectedTime(slot)}
                                    className={cn(
                                      "py-2 px-2 rounded-lg border text-[11px] sm:text-[12px] font-medium transition-all duration-150 min-h-[42px]",
                                      booked    ? "bg-[#C8D9EE] text-[#203C67] border-[#A6BAD7] cursor-not-allowed opacity-60"
                                      : blocked ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                                      : selectedTime === slot ? "bg-[#4A70A9] text-white border-[#4A70A9] shadow-sm"
                                      : "bg-white/50 text-[#343641] border-[#c8d4de] hover:border-[#4A70A9] hover:text-[#4A70A9]"
                                    )}
                                    title={booked ? "Already booked" : blocked ? "Blocked by doctor" : undefined}>
                                    {slot}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason & Note — plain controlled textareas, no wrapper component */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[11px] sm:text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-2">
                      Reason for Visit <span className="normal-case font-normal">(optional)</span>
                    </p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Brief description of symptoms or reason…"
                      className="w-full rounded-xl border border-[#c8d4de] bg-white/50 px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] text-[#343641] placeholder:text-[#bbc3cf] focus:outline-none focus:border-[#4A70A9] resize-none transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-2">
                      Additional Notes <span className="normal-case font-normal">(optional)</span>
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Any additional comments or notes…"
                      className="w-full rounded-xl border border-[#c8d4de] bg-white/50 px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] text-[#343641] placeholder:text-[#bbc3cf] focus:outline-none focus:border-[#4A70A9] resize-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between sm:items-center">
                  {!doctorProp ? (
                    <button onClick={() => setStep(0)} className="text-[12px] text-[#4A70A9] font-medium hover:underline flex items-center gap-1">
                      ← Change doctor
                    </button>
                  ) : (
                    <span className="text-[#7c7a7a] text-[11px] sm:text-[12px] leading-relaxed">
                      {`Booking with Dr. ${doctor?.name}`}
                    </span>
                  )}
                  <Button disabled={!canProceed} onClick={() => setStep(2)}
                    className="w-full sm:w-auto bg-[#343641] hover:bg-[#4A70A9] text-[#EFECE3] px-6 sm:px-8 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-medium transition-all disabled:opacity-40">
                    Review Booking →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 — Confirm */}
            {step === 2 && (
              <div className="p-4 sm:p-6 flex flex-col gap-5 overflow-y-auto remove-scrollbar flex-1">
                <p className="text-[11px] sm:text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider">
                  Confirm Your Appointment
                </p>
                <div className="bg-white/50 rounded-2xl border border-[#c8d4de] overflow-hidden">
                  <div className="flex items-center gap-4 px-4 sm:px-6 py-5 border-b border-[#e8ecef]">
                    <div className="w-12 h-12 rounded-full bg-[#CEDBE3] flex items-center justify-center text-[#343641] font-bold text-lg shrink-0">
                      {doctor?.name?.charAt(0) ?? "D"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#343641] font-semibold text-[14px] sm:text-[15px] truncate">Dr. {doctor?.name}</p>
                      <p className="text-[#8FABD4] text-[11px] sm:text-[12px] mt-0.5 truncate">
                        {doctor?.specialization?.length ? doctor.specialization[0] : "General Physician"}
                      </p>
                    </div>
                  </div>
                  {[
                    { label: "Date",     value: date ? format(date, "EEEE, MMMM d, yyyy") : "—" },
                    { label: "Time",     value: selectedTime ?? "—" },
                    { label: "Duration", value: doctor?.appointmentSpan ?? "30 minutes" },
                    { label: "Status",   value: "Pending confirmation" },
                    ...(reason ? [{ label: "Reason", value: reason }] : []),
                    ...(note   ? [{ label: "Note",   value: note   }] : []),
                  ].map((row, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-4 sm:items-start sm:justify-between px-4 sm:px-6 py-3.5 border-b border-[#f0f0ec] last:border-b-0">
                      <span className="text-[11px] sm:text-[13px] text-[#bbc3cf]">{row.label}</span>
                      <span className="text-[12px] sm:text-[13px] text-[#343641] font-medium sm:text-right break-words sm:max-w-[60%]">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2.5 items-start bg-[#ddeaf8] rounded-xl px-4 py-3 border border-[#8FABD4]/30">
                  <span className="text-[#4A70A9] text-base mt-px">ℹ</span>
                  <p className="text-[11px] sm:text-[12px] text-[#4A70A9] leading-relaxed">
                    You&apos;ll receive a confirmation shortly. Please arrive 10 minutes early for in-person visits.
                  </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
                  <button onClick={() => setStep(1)} disabled={isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#c8d4de] text-[12px] sm:text-[13px] text-[#343641] font-medium hover:border-[#4A70A9] transition-colors disabled:opacity-50">
                    ← Edit
                  </button>
                  <Button onClick={handleConfirm} disabled={isLoading}
                    className="w-full sm:w-auto sm:flex-1 px-5 bg-[#4A70A9] hover:bg-[#3a5c8e] text-white rounded-xl text-[12px] sm:text-[13px] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Booking…</>
                    ) : "Confirm Appointment"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 — Success */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center flex-1">
                <span className="text-[18px] sm:text-[20px] font-heading1">Success</span>
                <Image src="/assets/gifs/success.gif" alt="success" height={1000} width={1000} className="w-[220px] sm:w-[320px] h-auto" />
                <p className="text-[12px] sm:text-[13px] text-center leading-relaxed max-w-[320px]">
                  <i>Be active — we&apos;ll send you the status of your booking shortly.</i>
                </p>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BookAppointmentModal