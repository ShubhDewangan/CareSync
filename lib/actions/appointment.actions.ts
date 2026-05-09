/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Appointment } from "@/types/appwrite";
// import { InputFile } from "node-appwrite/file";
import { APPOINTMENT_COLLECTION_ID, DATABASE_ID, DOCTOR_COLLECTION_ID, getDatabases } from "../appwrite.config";
import { ID, Query } from "node-appwrite";
import { revalidatePath } from "next/cache";
import { parseStringify } from "../utils";
import { scheduleToSlotKey } from "@/lib/utils"
import { getDoctorBookedSlots, updateDoctorBookedSlots } from "@/lib/actions/doctor.actions"


// lib/actions/appointment.actions.ts
// Replace your createAppointment with this pattern to fix the race condition
// and the SLOT_TAKEN check not working.

// lib/actions/appointment.actions.ts
// Replace your createAppointment with this pattern to fix the race condition
// and the SLOT_TAKEN check not working.

export const createAppointment = async (data: CreateAppointmentParams) => {
  const databases = getDatabases()

  // Keep a reference to whatever bookedSlots we managed to read,
  // so the catch block can always return it and never wipe client state.
  let lastKnownBookedSlots: Record<string, string[]> = {}

  try {
    // 1. Find the doctor document by name to get their $id
    const doctorRes = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      [Query.equal("name", data.primaryDoctor), Query.limit(1)]
    )
    const doctorDoc = doctorRes.documents[0]
    if (!doctorDoc) throw new Error("Doctor not found")

    // 2. Read the LATEST bookedSlots fresh from DB (not from client cache)
    const fresh = doctorDoc.bookedSlots
    const bookedSlots: Record<string, string[]> = fresh
      ? (() => { try { return JSON.parse(fresh) } catch { return {} } })()
      : {}

    lastKnownBookedSlots = bookedSlots  // save for catch

    // 3. Build the date key in IST — must match toLocalDateStr on client
    const scheduleDate = new Date(data.schedule)
    const dateKey = scheduleDate.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })

    // 4. Build the time string — must match the slot label exactly e.g. "11:00 AM"
    //    en-IN gives "11:00 am" → uppercase + strip dots → "11:00 AM"
    const timeKey = scheduleDate
      .toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      })
      .toUpperCase()
      .replace(/\./g, "")
      .trim()

    // 5. SLOT_TAKEN guard — re-checked fresh from DB, not client cache
    const slotsOnDay = bookedSlots[dateKey] ?? []
    if (slotsOnDay.includes(timeKey)) {
      return { success: false, error: "SLOT_TAKEN", bookedSlots }
    }

    // 6. Create the appointment document
    const appointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      {
        userId:        data.userId,
        patient:       data.patient,
        primaryDoctor: data.primaryDoctor,
        schedule:      data.schedule,
        reason:        data.reason,
        note:          data.note,
        status:        data.status,
      }
    )

    // 7. Write the updated bookedSlots back atomically
    const updatedSlots = {
      ...bookedSlots,
      [dateKey]: [...slotsOnDay, timeKey],
    }
    await databases.updateDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorDoc.$id,
      { bookedSlots: JSON.stringify(updatedSlots) }
    )

    revalidatePath(`/patients/${data.userId}/dashboard`)
    revalidatePath(`/doctors/${doctorDoc.userId}/dashboard`)

    // Always return bookedSlots so the modal can update its local state
    return { success: true, appointment: parseStringify(appointment), bookedSlots: updatedSlots }

  } catch (error) {
    console.error("createAppointment error:", error)
    // Return lastKnownBookedSlots (not undefined!) so setBookedSlots(result.bookedSlots)
    // in the modal doesn't wipe out the displayed state and make all slots look free.
    return { success: false, error: "UNKNOWN", bookedSlots: lastKnownBookedSlots }
  }
}

export const getAppointment = async (appointmentId: string) => {
  const databases = getDatabases()
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
  const databases = getDatabases()
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
            documents: appointments.documents.map((doc: any) => {
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
    const databases = getDatabases()

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
  const databases = getDatabases()
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
  const databases = getDatabases()
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // midnight — start of today

    // Fetch all pending appointments
    const res = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.equal('status', 'pending')]
    )

    const expired = res.documents.filter((appt: any) => {
      const scheduleDate = new Date(appt.schedule)
      scheduleDate.setHours(0, 0, 0, 0)
      return scheduleDate < today // strictly before today
    })

    // Update each expired appointment
    await Promise.all(
      expired.map((appt: any) =>
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