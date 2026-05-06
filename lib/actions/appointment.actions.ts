/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Appointment } from "@/types/appwrite";
// import { InputFile } from "node-appwrite/file";
import { APPOINTMENT_COLLECTION_ID, DATABASE_ID, databases } from "../appwrite.config";
import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { parseStringify } from "../utils";
import { scheduleToSlotKey } from "@/lib/utils"
import { getDoctorBookedSlots, updateDoctorBookedSlots } from "@/lib/actions/doctor.actions"

export async function createAppointment(appointment: CreateAppointmentParams) {
  // ── 1. Check slot availability FIRST ──────────────────────
  const doctor = await databases.listDocuments(
    process.env.DATABASE_ID!,
    process.env.DOCTOR_COLLECTION_ID!,
    [Query.equal("name", appointment.primaryDoctor)]
  )

  if (doctor.documents.length === 0) throw new Error("Doctor not found")

  const doctorId = doctor.documents[0].$id
  const { dateStr, timeStr } = scheduleToSlotKey(appointment.schedule)
  const current = await getDoctorBookedSlots(doctorId)
  const existing = current[dateStr] ?? []

  if (existing.includes(timeStr)) {
    return {
      success: false,
      error: "SLOT_TAKEN",
      bookedSlots: current, // ← full updated slots map for UI
    }
  }

  // ── 2. Mark slot as booked immediately ────────────────────
  const updatedSlots = {
    ...current,
    [dateStr]: [...existing, timeStr],
  }
  await updateDoctorBookedSlots(doctorId, updatedSlots)

  // ── 3. Now create the appointment ─────────────────────────
  try {
    const newAppointment = await databases.createDocument(
      process.env.DATABASE_ID!,
      process.env.APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      appointment
    )
    return {
      success: true,
      appointment: parseStringify(newAppointment),
      bookedSlots: updatedSlots, // ← updated slots including this new booking
    }
  } catch (err) {
    // ── 4. Rollback slot if appointment creation fails ───────
    await updateDoctorBookedSlots(doctorId, {
      ...current,
      [dateStr]: existing.filter((t: string) => t !== timeStr),
    })
    throw err
  }
}

export const getAppointment = async (appointmentId: string) => {
    console.log(appointmentId)
    try {
        const appointment = await databases.getDocument(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            appointmentId
        )
        console.log('patient',appointment.patient)
        return parseStringify(appointment);
    } catch (error) {
        console.log(error)
    }
}

export const recentAppointments = async () => {
    try {
        const appointments = await databases.listDocuments(
            DATABASE_ID!,
            APPOINTMENT_COLLECTION_ID!,
            [
                Query.orderDesc('$createdAt'),
                Query.select(['*', 'patient.*'])  // 👈 populate patient
            ]
        )

        const initialCounts = {
            scheduledCount: 0,
            pendingCount: 0,
            cancelledCount: 0
        }

        const counts = (appointments.documents as unknown as Appointment[]).reduce((acc, appointment) => {
            if (appointment.status === 'scheduled') {
                acc.scheduledCount += 1
            } else if (appointment.status === 'pending') {
                acc.pendingCount += 1;
            } else if (appointment.status === 'cancelled') {
                acc.cancelledCount += 1;
            }

            return acc
        }, initialCounts) 

        const data = {
            totalCount: appointments.total,
            ...counts,
            documents: appointments.documents.map(doc => {
                const plainDoc = Object.assign({}, doc)
                if (plainDoc.patient) {
                    plainDoc.patient = Object.assign({}, plainDoc.patient)
                }
                return parseStringify(plainDoc)
            })
        }
        // console.log('first doc patient:', appointments.documents[0]?.patient)

        return {
            ...data
        }

    } catch (error) {
        console.log(error);
        
    }
}

export async function completeAppointment(appointmentId: string) {
  try {
    // ── Fetch appointment to get schedule + primaryDoctor ────────
    const appt = await getAppointment(appointmentId)

    // ── Mark as completed ────────────────────────────────────────
    const updated = await databases.updateDocument(
      process.env.DATABASE_ID!,
      process.env.APPOINTMENT_COLLECTION_ID!,
      appointmentId,
      {
        status: "completed",
        completedAt: new Date().toISOString(),
      }
    )

    // ── Remove from bookedSlots ──────────────────────────────────
    if (appt.primaryDoctor) {
      const doctor = await databases.listDocuments(
        process.env.DATABASE_ID!,
        process.env.DOCTOR_COLLECTION_ID!,
        [Query.equal("name", appt.primaryDoctor)]
      )

      if (doctor.documents.length > 0) {
        const doctorId = doctor.documents[0].$id
        const { dateStr, timeStr } = scheduleToSlotKey(appt.schedule)
        const current = await getDoctorBookedSlots(doctorId)

        if (current[dateStr]) {
          const next = {
            ...current,
            [dateStr]: current[dateStr].filter(s => s !== timeStr),
          }
          if (next[dateStr].length === 0) delete next[dateStr]
          await updateDoctorBookedSlots(doctorId, next)
        }
      }
    }

    return parseStringify(updated)
  } catch (error) {
    console.error("completeAppointment error:", error)
    throw error
  }
}

export async function updateAppointment({ appointmentId, appointment }: UpdateAppointmentParams) {
  const updated = await databases.updateDocument(
    process.env.DATABASE_ID!,
    process.env.APPOINTMENT_COLLECTION_ID!,
    appointmentId,
    appointment
  )

  if (appointment.status === "cancelled") {
    console.log("primaryDoctor:", appointment.primaryDoctor) // check what's arriving
    
    if (!appointment.primaryDoctor) {
      // fetch it directly from the appointment doc instead
      const apptDoc = await databases.getDocument(
        process.env.DATABASE_ID!,
        process.env.APPOINTMENT_COLLECTION_ID!,
        appointmentId
      )
      appointment.primaryDoctor = apptDoc.primaryDoctor
      appointment.schedule = apptDoc.schedule
    }

    if (appointment.primaryDoctor) {
      try {
        const doctor = await databases.listDocuments(
          process.env.DATABASE_ID!,
          process.env.DOCTOR_COLLECTION_ID!,
          [Query.equal("name", appointment.primaryDoctor)]
        )

        if (doctor.documents.length > 0) {
          const doctorId = doctor.documents[0].$id
          const { dateStr, timeStr } = scheduleToSlotKey(appointment.schedule)
          const current = await getDoctorBookedSlots(doctorId)

          if (current[dateStr]) {
            const next = {
              ...current,
              [dateStr]: current[dateStr].filter(s => s !== timeStr),
            }
            if (next[dateStr].length === 0) delete next[dateStr]
            await updateDoctorBookedSlots(doctorId, next)
          }
        }
      } catch (e) {
        console.error("Failed to update bookedSlots on cancel:", e)
      }
    }
  }

  return parseStringify(updated)
}

export const autoExpireAppointments = async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // midnight — start of today

    // Fetch all pending appointments
    const res = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal('status', 'pending')]
    )

    const expired = res.documents.filter((appt) => {
      const scheduleDate = new Date(appt.schedule)
      scheduleDate.setHours(0, 0, 0, 0)
      return scheduleDate < today // strictly before today
    })

    // Update each expired appointment
    await Promise.all(
      expired.map((appt) =>
        databases.updateDocument(
          DATABASE_ID!,
          APPOINTMENT_COLLECTION_ID!,
          appt.$id,
          {
            status: 'expired',
            expiredAt: new Date().toISOString(),
          }
        )
      )
    )

    console.log(`Auto-expired ${expired.length} appointments`)
    return { expired: expired.length }
  } catch (error) {
    console.error('autoExpireAppointments error:', error)
    return { expired: 0 }
  }
}