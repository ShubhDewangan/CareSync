/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/patients/[userId]/dashboard/DashboardBookButton.tsx
"use client"

import { useState } from "react"
import BookAppointmentModal from "@/components/ui/BookAppointmentModal"
import { Doctors } from "@/constants"

export default function DashboardBookButton({
  variant,
  text,
  userId,
  patientId,
  doctorName,
  dateToday,
  authUser,
  fullUser
}: {
  variant: string
  text: string
  userId: string
  patientId: string
  doctorName: string
  dateToday: string
  authUser: any
  fullUser: any
}) {
  const [isOpen, setIsOpen] = useState(false)

  const doctor = Doctors.find((d) => d.name === doctorName)
  if (!doctor) return null

  return (
    <BookAppointmentModal
    variant={variant}
    text={text}
      DateToday={dateToday}
      doctor={doctor as any}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      userId={userId}
      patientId={patientId} authUser={authUser} fullUser={fullUser}/>
  )
}