"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image'
import { JSX, useEffect, useState } from 'react'
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
import { redirect } from 'next/dist/server/api-utils'
import { usePathname, useRouter } from 'next/navigation'
import { AuthUser, FullUser } from '@/context/UserContext'
import { getDoctorBlockedSlots, getDoctorBookedSlots } from '@/lib/actions/doctor.actions'



const QUICK_DATES = [
  { label: "Today", value: 0 },
  { label: "Tomorrow", value: 1 },
  { label: "In 3 days", value: 3 },
  { label: "In a week", value: 7 },
  { label: "In 2 weeks", value: 14 },
]

const BookAppointmentModal = ({
  text,
  variant,
  DateToday,
  doctor,
  userId,
  patientId,
  authUser,
  fullUser,
  falseButton
}: {
  text?: string
  variant?: string
  DateToday: string
  doctor: Doctor
  userId: string
  patientId?: string
  authUser?: AuthUser
  fullUser: FullUser
  falseButton?: boolean
}) => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const path = usePathname()
  
    const [blockedSlots, setBlockedSlots] = useState<Record<string, string[]>>({})
  
  // Fetch on mount
  useEffect(() => {
    getDoctorBlockedSlots(doctor.$id).then(setBlockedSlots)
  }, [doctor.$id])
  
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({})
  
  useEffect(() => {
    getDoctorBookedSlots(doctor.$id).then(setBookedSlots)
  }, [doctor.$id])

  // In the slot button — add booked check alongside blocked:
  
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
  
  function buildTimeSlots(slotsAvailable: string[]) {
    return slotsAvailable.map(slot => ({
      label: slot,
      period: getPeriod(slot),
    }))
  }
  
  const TIME_SLOTS = buildTimeSlots(doctor?.slotsAvailable as string[] ?? [])
  
  const groupedSlots = TIME_SLOTS.reduce<Record<string, string[]>>((acc, s) => {
    if (!acc[s.period]) acc[s.period] = []
    acc[s.period].push(s.label)
    return acc
  }, {})

// Helper to check if a slot is blocked for the selected date

// Add this helper
function getSelectedDayName(d: Date): string {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]
}

// Add this derived value inside the component (recomputes on date change)
const selectedDayName = date ? getSelectedDayName(date) : null
const isDayOff = selectedDayName ? !doctor.availableDays.includes(selectedDayName) : false

  function isBlocked(slot: string): boolean {
  if (isDayOff) return true  // entire day is off
  if (!date) return false
  const dateStr = toLocalDateStr(date)
  return blockedSlots[dateStr]?.includes(slot) ?? false
}

function isBooked(slot: string): boolean {
  if (!date) return false
  const dateStr = toLocalDateStr(date)
  return bookedSlots[dateStr]?.includes(slot) ?? false
}

function handleDateChange(d: Date | undefined) {
  setDate(d)
  if (d && selectedTime) {
    const dateStr = toLocalDateStr(d)  // ← fix
    if (blockedSlots[dateStr]?.includes(selectedTime)) {
      setSelectedTime(null)
    }
  }
  if (d) setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1))
}
  
  function handleQuickDate(days: number) {
    handleDateChange(addDays(new Date(), days))
  }
  
  // ─── Build schedule datetime from date + time string ─────────────
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
    
    // ─── Confirm — calls createAppointment server action ─────────────
    async function handleConfirm() {
  if (!canProceed) return
  setIsLoading(true)

  try {
    const appointmentData: CreateAppointmentParams = {
      userId,
      patient: fullUser?.$id as any,
      primaryDoctor: doctor.name,
      schedule: buildSchedule(),
      reason: reason || "General consultation",
      note: note || "",
      status: "pending" as Status,
    }

    const result = await createAppointment(appointmentData)

    // ── Slot was just taken by someone else ──
    if (!result.success && result.error === "SLOT_TAKEN") {
      setBookedSlots(result.bookedSlots) // refresh calendar UI
      setSelectedTime(null)              // clear stale selection
      setStep(1)                         // send back to picker
      showToast("error", "That slot was just taken! Please pick another time.", "top-right")
      return
    }

    // ── Success ──
    if (result.success) {
      setBookedSlots(result.bookedSlots) // keep local state in sync
      showToast("success", "Appointment booked successfully!", "top-right")
      setStep(3)
      await new Promise(resolve => setTimeout(resolve, 3000))
      setIsOpen(false)
      setDate(new Date())
      setSelectedTime(null)
      setReason("")
      setNote("")
      setStep(1)
    }

  } catch (error) {
    console.error("Appointment error:", error)
    showToast("error", "Could not book appointment. Please try again.", "top-right")
  } finally {
    setIsLoading(false)
  }
}
  const handleBookingButton = () => {
    if (!fullUser) {
      showToast('info', 'Please log in to book an Appointment!', 'top-right')
    } else {
      setIsOpen(true)
      setStep(1)
  }

  if (falseButton) {
    showToast('info', 'You cannot book an Appointment for yourself!')
    setIsOpen(false)
  }
  // only open modal if user is logged i
} 

  function handleClose() {
    setIsOpen(false)
    setStep(1)
    setSelectedTime(null)
    setReason("")
    setNote("")
  }

  return (
    <>
      {/* Trigger Button */}
      {variant==='ghost' ? <button
        onClick={handleBookingButton}
        className="group inline-flex items-center justify-center gap-1.5 h-8 px-4 rounded-full text-[11px] text-[#34578b] font-medium text-nowrap mt-1 bg-transparent"
      >
        <Image
          src="/assets/icons/edit-profile.svg"
          alt="edit profile"
          height={24}
          width={24}
          className="h-3.5 w-3.5"
        />
        <span>{text || 'Book Appointment'}</span>
      </button>
      :<button
        onClick={handleBookingButton}
        className="group inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:border-[#4A70A9] hover:text-[#4A70A9] transition-all duration-200 h-8 px-4 rounded-full text-[11px] text-gray-600 font-medium text-nowrap mt-1 bg-[#e1d7bc]"
      >
        <Image
          src="/assets/icons/edit-profile.svg"
          alt="edit profile"
          height={24}
          width={24}
          className="h-3.5 w-3.5"
        />
        <span>{text || 'Book Appointment'}</span>
      </button>}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-h-[95vh] w-[90vw] max-w-[900px] overflow-hidden p-0 border-[#c8d4de] bg-[#EFECE3] rounded-2xl shadow-2xl">

          {/* ── Header ── */}
          <div className="relative flex items-center justify-between px-7 py-5 border-b border-[#c8d4de]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#CEDBE3] flex items-center justify-center font-semibold text-sm shrink-0">
                {doctor?.name?.charAt(0) ?? "D"}
              </div>
              <div>
                <p className="font-semibold text-[15px] leading-none">Dr. {doctor?.name}</p>
                <p className="text-[#8FABD4] text-[12px] mt-1">{doctor?.specialization ?? "General Physician"}</p>
              </div>
            </div>

            <div className="flex items-center gap-5 pr-5">
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                {[1, 2].map((s) => (
                  <React.Fragment key={s}>
                    <div className={cn(
                      "w-6 h-6 rounded-full text-[11px] font-semibold flex items-center justify-center transition-all",
                      step === s
                        ? "bg-[#4A70A9] text-white"
                        : step > s
                          ? "bg-[#CEDBE3] text-[#343641]"
                          : "bg-[#3d4050] text-[#8FABD4]"
                    )}>
                      {step > s ? "✓" : s}
                    </div>
                    {s < 2 && <div className={cn("w-8 h-px", step > s ? "bg-[#CEDBE3]" : "bg-[#3d4050]")} />}
                  </React.Fragment>
                ))}
              </div>
              <span className="text-[#585858] text-[11px] px-3 py-1 rounded-full border border-[#585858]">
                {DateToday}
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">

            {/* ── Step 1: Pick date + time + reason ── */}
            {step === 1 && (
              <div className="p-6 flex flex-col gap-6">

                <div className="flex gap-6 flex-col md:flex-row">

                  {/* Calendar */}
                  <div className="flex-shrink-0">
                    <p className="text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-3">
                      Select Date
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {QUICK_DATES.map((qd) => (
                        <button
                          key={qd.value}
                          onClick={() => handleQuickDate(qd.value)}
                          className="text-[11px] px-2.5 py-1 rounded-full border border-[#c8d4de] bg-white hover:border-[#4A70A9] hover:text-[#4A70A9] text-[#343641] transition-all"
                        >
                          {qd.label}
                        </button>
                      ))}
                    </div>
                    <Card className="w-fit shadow-sm border-[#c8d4de]">
                      <CardContent className="p-3">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateChange}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          fixedWeeks
                          disabled={{ before: new Date() }}
                          className="p-0 [--cell-size:2.25rem]"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Time Slots */}
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-3">
                      Select Time
                      {date && (
                        <span className="ml-2 normal-case font-normal text-[#4A70A9]">
                          — {format(date, "EEE, MMM d")}
                        </span>
                      )}
                    </p>
                    <div className="flex flex-col gap-4">
                      {Object.entries(groupedSlots).map(([period, slots]) => (
                        <div key={period}>
                          <p className="text-[11px] text-[#343641]/50 font-medium mb-2">{period}</p>
                          <div className="grid grid-cols-3 gap-1.5">
                            {slots.map((slot) => {
                              const blocked = isBlocked(slot)
                              const booked = isBooked(slot)
                              const unavailable = blocked || booked
                              return (
                                <button
                                  key={slot}
                                  disabled={unavailable}
                                  onClick={() => !unavailable && setSelectedTime(slot)}
                                  className={cn(
                                    "py-2 px-2 rounded-lg border text-[12px] font-medium transition-all duration-150",
                                    booked
                                      ? "bg-[#C8D9EE] text-[#203C67] border-[#A6BAD7] cursor-not-allowed opacity-60"
                                      : blocked
                                        ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                                        : selectedTime === slot
                                          ? "bg-[#4A70A9] text-white border-[#4A70A9] shadow-sm"
                                          : "bg-white text-[#343641] border-[#c8d4de] hover:border-[#4A70A9] hover:text-[#4A70A9]"
                                  )}
                                  title={booked ? "Already booked" : blocked ? "Blocked by doctor" : undefined}
                                >
                                  {slot}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reason + Note */}
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-2">
                      Reason for Visit <span className="normal-case font-normal">(optional)</span>
                    </p>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      placeholder="Brief description of symptoms or reason…"
                      className="w-full rounded-xl border border-[#c8d4de] bg-white px-4 py-3 text-[13px] text-[#343641] placeholder:text-[#bbc3cf] focus:outline-none focus:border-[#4A70A9] resize-none transition-colors"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider mb-2">
                      Additional Notes <span className="normal-case font-normal">(optional)</span>
                    </p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Any additional comments or notes…"
                      className="w-full rounded-xl border border-[#c8d4de] bg-white px-4 py-3 text-[13px] text-[#343641] placeholder:text-[#bbc3cf] focus:outline-none focus:border-[#4A70A9] resize-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#7c7a7a] text-[12px]">
                    {`Fill this form to book an appointment with Dr. ${doctor?.name}`}
                  </span>
                  <Button
                    disabled={!canProceed}
                    onClick={() => setStep(2)}
                    className="bg-[#343641] hover:bg-[#4A70A9] text-[#EFECE3] px-8 py-2.5 rounded-xl text-[13px] font-medium transition-all disabled:opacity-40"
                  >
                    Review Booking →
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Review + Confirm ── */}
            {step === 2 && (
              <div className="p-6 flex flex-col gap-5">
                <p className="text-[12px] font-semibold text-[#343641]/60 uppercase tracking-wider">
                  Confirm Your Appointment
                </p>

                {/* Summary Card */}
                <div className="bg-white rounded-2xl border border-[#c8d4de] overflow-hidden">
                  <div className="flex items-center gap-4 px-6 py-5 border-b border-[#e8ecef]">
                    <div className="w-12 h-12 rounded-full bg-[#CEDBE3] flex items-center justify-center text-[#343641] font-bold text-lg shrink-0">
                      {doctor.name?.charAt(0) ?? "D"}
                    </div>
                    <div>
                      <p className="text-[#343641] font-semibold text-[15px]">Dr. {doctor.name}</p>
                      <p className="text-[#8FABD4] text-[12px] mt-0.5">{doctor.specialization ?? "General Physician"}</p>
                    </div>
                  </div>

                  {[
                    { label: "Date", value: date ? format(date, "EEEE, MMMM d, yyyy") : "—" },
                    { label: "Time", value: selectedTime ?? "—" },
                    { label: "Duration", value: doctor.appointmentSpan ?? "30 minutes" },
                    { label: "Status", value: "Pending confirmation" },
                    ...(reason ? [{ label: "Reason", value: reason }] : []),
                    ...(note ? [{ label: "Note", value: note }] : []),
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between px-6 py-3.5 border-b border-[#f0f0ec] last:border-b-0"
                    >
                      <span className="text-[13px] text-[#bbc3cf]">{row.label}</span>
                      <span className="text-[13px] text-[#343641] font-medium text-right max-w-[60%]">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2.5 items-center bg-[#ddeaf8] rounded-xl px-4 py-3 border border-[#8FABD4]/30">
                  <span className="text-[#4A70A9] text-base mt-px">ℹ</span>
                  <p className="text-[12px] text-[#4A70A9] leading-relaxed">
                    You&apos;ll receive a confirmation shortly. Please arrive 10 minutes early for in-person visits.
                  </p>
                </div>

                <div className="flex gap-3 justify-between">
                  <button
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl border border-[#c8d4de] text-[13px] text-[#343641] font-medium hover:border-[#4A70A9] transition-colors disabled:opacity-50"
                  >
                    ← Edit
                  </button>
                  <Button
                    onClick={
                      handleConfirm
                    }
                    disabled={isLoading}
                    className="flex-1 px-5 bg-[#4A70A9] hover:bg-[#3a5c8e] text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                        </svg>
                        Booking...
                      </>
                    ) : "Confirm Appointment"}
                  </Button>
                </div>
              </div>
            )}
            { step === 3 && (<div className='flex flex-col items-center justify-center p-8'>
              <span className='text-[20px] font-heading1'>Success</span>
              <Image
                src='/assets/gifs/success.gif'
                alt='success'
                height={1000}
                width={1000}
              />
              <p><i>Be active we&apos;ll be sending you status of your booking in some times </i></p>
            </div>)}

          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BookAppointmentModal