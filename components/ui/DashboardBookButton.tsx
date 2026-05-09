/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useState } from "react"
import BookAppointmentModal from "@/components/ui/BookAppointmentModal"
import { getAllDoctors } from "@/lib/actions/doctor.actions"
import { Doctor } from "@/types/appwrite"

export default function DashboardBookButton({
  variant,
  text,
  userId,
  patientId,
  doctorName,
  dateToday,
  authUser,
  fullUser,
}: {
  variant: string
  text: string
  userId: string
  patientId: string
  doctorName?: string | null
  dateToday: string
  authUser: any
  fullUser: any
}) {
  const [doctor, setDoctor] = useState<Doctor | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!doctorName) {
      // No doctor name given — open modal in doctor-picker mode (step 0)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true)
      return
    }
    getAllDoctors()
      .then((docs: Doctor[]) => {
        const match = docs?.find((d) => d.name === doctorName)
        setDoctor(match ?? undefined)
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [doctorName])

  // Always render once ready — if no doctor found, modal opens at step 0 (picker)
  if (!ready) return (
    <span className="text-[11px] text-[#a0afc0] px-2">Loading…</span>
  )

  return (
    <BookAppointmentModal
      variant={variant}
      text={text}
      DateToday={dateToday}
      doctor={doctor}          // undefined → step 0 (doctor picker)
      userId={userId}
      patientId={patientId}
      authUser={authUser}
      fullUser={fullUser}
    />
  )
}