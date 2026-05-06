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
  const [Doctors, setDoctors] = useState<Doctor[] | null>(null)

  useEffect(() => {
    async function loadDoctors() {
      try {
        const doctors = await getAllDoctors()
        setDoctors(doctors)
      } catch {
        setDoctors([])
      }
    }
    loadDoctors()
  }, [])

  if (!Doctors) return <div className="text-[12px] text-[#a0afc0]">Loading…</div>

  const doctor = Doctors.find((d) => d.name === doctorName)
  if (!doctor) return null

  return (
    <BookAppointmentModal
      variant={variant}
      text={text}
      DateToday={dateToday}
      doctor={doctor}
      userId={userId}
      patientId={patientId}
      authUser={authUser}
      fullUser={fullUser}
    />
  )
}