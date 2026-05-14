/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Client, Account, ID, Query, Users, Models } from "node-appwrite"
import { cookies } from "next/headers"
import {
  DATABASE_ID,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  BUCKET_ID,
  APPOINTMENT_COLLECTION_ID,
  getDatabases,
  getStorage
} from "../appwrite.config"
import { InputFile } from 'node-appwrite/file'
import { parseStringify } from "../utils"
import { revalidatePath } from "next/cache"

const DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID!

function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

export const registerDoctor = async ({
  identificationDocument,
  profilePic,        // ← add this
  ...doctor}: RegisterDoctorParams) => {
    const storage = getStorage()
    const databases = getDatabases()
    try {
      let file
        let profilePicFile

        if (identificationDocument) {
              const doc = identificationDocument[0] as File
              const arrayBuffer = await doc.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const inputFile = InputFile.fromBuffer(buffer, doc.name)
              file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
            }
        
            // ── Profile picture ──────────────────────────────────
            if (profilePic && profilePic.length > 0) {
              const pic = profilePic[0]
              const arrayBuffer = await pic.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const inputFile = InputFile.fromBuffer(buffer, pic.name)
              profilePicFile = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
            }
        
            const newDoctor = await databases.createDocument(
              DATABASE_ID!,
              DOCTOR_COLLECTION_ID!,
              ID.unique(),
              {
                identificationDocumentationId: file?.$id || null,
                identificationDocumentUrl: file
                  ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
                  : null,
                // ── Profile pic URL ────────────────────────────
                profilePic: profilePicFile
                  ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${profilePicFile.$id}/view?project=${PROJECT_ID}`
                  : null,
                ...doctor
              })

        return parseStringify(newDoctor)
    } catch (error) {
        console.log(error);
        return null
    }
}

export const getDoctorByName = async (name: string) => {
  try {
    // First check constant doctors list
    // Fallback: query Appwrite DB
    const databases = getDatabases()

    const result = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID,
      [Query.equal('name', name)]
    )
    if (result.documents.length > 0) {
      return parseStringify(result.documents[0])
    }
    return null
  } catch (error) {
    console.log('getDoctorByName error:', error)
    return null
  }
}

export const getAllDoctors = async () => {
    const databases = getDatabases()

  try {
    const result = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID,
      [Query.limit(50)]
    )
    return parseStringify(result.documents)
  } catch (error) {
    console.log('getAllDoctors error:', error)
    return []
  }
}

export const getDoctor = async (userId: string) => {
    const databases = getDatabases()

  try {
    const doctors = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    )

    const d = doctors.documents[0]
    console.log(userId, doctors)
    if (!d) return null

    return {
      $id: d.$id,
      userId: d.userId,
      name: d.name,
      email: d.email,
      phone: d.phone,
      birthDate: d.birthDate,
      profilePic: d.profilePic,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
      hospital: d.hospital,
      address: d.address,
      availableDays: d.availableDays,
      consultationHours: d.consultationHours,
      consultationFee: d.consultationFee,
      appointmentSpan: d.appointmentSpan,
      about: d.about,
      languages: d.languages,
      gender: d.gender,
      rating: d.rating,
      totalPatients: d.totalPatients,
      registrationComplete: true,
      identificationType: d.identificationType,
      identificationDocumentationId: d.identificationDocumentationId,
      identificationDocument: d.identificationDocument,
      privacyConsent: d.privacyConsent,
      disclosureConsent: d.disclosureConsent,
      updationConsent: d.updationConsent,
      slotsAvailable: d.slotsAvailable,
      earnedTotal: d.earnedTotal,
    }
  } catch (error) {
    console.log("getDoctor error:", error)
    return null
  }
}

export const getDoctorById = async (doctorId: string) => {
  const databases = getDatabases()
  try {
    const doc = await databases.getDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId
    )
    return doc ? JSON.parse(JSON.stringify(doc)) : null
  } catch (error) {
    console.error('getDoctorById error:', error)
    return null
  }
}

export const updateDoctor = async (
  doctorId: string,
  { identificationDocument, profilePic, ...doctor }: RegisterDoctorParams
) => {
  const storage = getStorage()
  const databases = getDatabases()

  try {
    let file: Models.File | undefined;
    let profilePicFile: Models.File | undefined;

    // ── fetch existing doc to get old file IDs ──
    const existing = await databases.getDocument(DATABASE_ID!, DOCTOR_COLLECTION_ID!, doctorId)

    if (identificationDocument && identificationDocument.length > 0) {
      const doc = identificationDocument[0]
      const arrayBuffer = await doc.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, doc.name)
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)

      // delete old identification doc
      if (existing.identificationDocumentationId) {
        try { await storage.deleteFile(BUCKET_ID!, existing.identificationDocumentationId) } catch {}
      }
    }

    if (profilePic && profilePic.length > 0) {
      const pic = profilePic[0]
      const arrayBuffer = await pic.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, pic.name)
      profilePicFile = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)

      // delete old profile pic — extract file ID from old URL
      if (existing.profilePic) {
        const oldFileId = existing.profilePic.split('/files/')[1]?.split('/view')[0]
        if (oldFileId) {
          try { await storage.deleteFile(BUCKET_ID!, oldFileId) } catch {}
        }
      }
    }

    const data: any = { ...doctor }

    if (file) {
      data.identificationDocumentationId = file.$id
      data.identificationDocumentUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
    }
    if (profilePicFile) {
      data.profilePic = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${profilePicFile.$id}/view?project=${PROJECT_ID}`
    }

    const updatedDoctor = await databases.updateDocument(DATABASE_ID!, DOCTOR_COLLECTION_ID!, doctorId, data)
    return parseStringify(updatedDoctor)
  } catch (error) {
    console.log(error)
    return null
  }
}
// lib/actions/doctor.actions.ts — add this new action
export const updateDoctorSettings = async (
  doctorId: string,
  settings: {
    consultationHours: string
    consultationFee: string
    appointmentSpan: string
    availableDays: string[]
  }
) => {
    const databases = getDatabases()

  try {
    const updated = await databases.updateDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId,
      {
        consultationHours: settings.consultationHours,
        consultationFee: settings.consultationFee,
        appointmentSpan: settings.appointmentSpan,
        availableDays: settings.availableDays,
      }
    )
    revalidatePath('/doctors')
    return parseStringify(updated)
  } catch (error) {
    console.error('updateDoctorSettings error:', error)
    return null
  }
}

export async function getDoctorBookedSlots(doctorId: string): Promise<Record<string, string[]>> {
    const databases = getDatabases()

  const doc = await databases.getDocument(
    process.env.DATABASE_ID!,
    process.env.DOCTOR_COLLECTION_ID!,
    doctorId
  )
  if (!doc.bookedSlots) return {}
  try { return JSON.parse(doc.bookedSlots) } catch { return {} }
}

export async function updateDoctorBookedSlots(
  doctorId: string,
  bookedSlots: Record<string, string[]>
) {
    const databases = getDatabases()

  await databases.updateDocument(
    process.env.DATABASE_ID!,
    process.env.DOCTOR_COLLECTION_ID!,
    doctorId,
    { bookedSlots: JSON.stringify(bookedSlots) }
  )
}

// lib/actions/doctor.actions.ts
export const updateBlockedSlots = async (
  doctorId: string,
  blockedSlots: Record<string, string[]> // { "2025-04-22": ["9:00 AM"] }
) => {
    const databases = getDatabases()

  try {
    const updated = await databases.updateDocument(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID!,
      doctorId,
      { blockedSlots: JSON.stringify(blockedSlots) } // stored as JSON string
    )
    // revalidatePath(`/doctors`)
    return parseStringify(updated)
  } catch (error) {
    console.error('updateBlockedSlots error:', error)
    return null
  }
}

// lib/actions/doctor.actions.ts
export async function getDoctorBlockedSlots(doctorId: string): Promise<Record<string, string[]>> {
    const databases = getDatabases()

  const doc = await databases.getDocument(
    process.env.DATABASE_ID!,
    process.env.DOCTOR_COLLECTION_ID!,
    doctorId
  )
  if (!doc.blockedSlots) return {}
  try { return JSON.parse(doc.blockedSlots) } catch { return {} }
}
// ============================
// 📊 DOCTOR DASHBOARD STATS
// ============================
// Returns today's stats + all-time stats for a specific doctor

export const getDoctorStats = async (doctorName: string) => {
    const databases = getDatabases()

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = tomorrow.toISOString()

    const [
      todayAppointments,
      pendingAll,
      scheduledAll,
      completedAll,
      allAppointments,
    ] = await Promise.all([
      // Today's appointments for this doctor
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('primaryDoctor', doctorName),
        Query.greaterThanEqual('schedule', todayISO),
        Query.lessThan('schedule', tomorrowISO),
        Query.limit(100),
      ]),
      // All pending
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('primaryDoctor', doctorName),
        Query.equal('status', 'pending'),
        Query.limit(1),
      ]),
      // All scheduled
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('primaryDoctor', doctorName),
        Query.equal('status', 'scheduled'),
        Query.limit(1),
      ]),
      // All completed
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('primaryDoctor', doctorName),
        Query.equal('status', 'completed'),
        Query.limit(1),
      ]),
      // All appointments (for unique patient count + earnings calc)
      databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
        Query.equal('primaryDoctor', doctorName),
        Query.limit(500),
      ]),
    ])

    // Unique patients served
    const uniquePatientIds = new Set(
      allAppointments.documents
        .filter((a: any) => a.patient)
        .map((a: any) => typeof a.patient === 'string' ? a.patient : a.patient?.$id)
        .filter(Boolean)
    )

    return parseStringify({
      todayCount: todayAppointments.total,
      todayAppointments: todayAppointments.documents,
      pendingCount: pendingAll.total,
      scheduledCount: scheduledAll.total,
      completedCount: completedAll.total,
      totalPatients: uniquePatientIds.size,
    })
  } catch (error) {
    console.error('getDoctorStats error:', error)
    return {
      todayCount: 0,
      todayAppointments: [],
      pendingCount: 0,
      scheduledCount: 0,
      completedCount: 0,
      totalPatients: 0,
    }
  }
}

// ============================
// 💰 DOCTOR EARNINGS (weekly)
// ============================
// Returns per-day earnings for this week vs last week
// Earnings = completedCount × consultationFee per day

export const getDoctorEarnings = async (doctorName: string, consultationFee: number) => {
    const databases = getDatabases()

  try {
    const result: {
      day: string
      date: string
      thisWeek: number
      lastWeek: number
    }[] = []

    for (let i = 6; i >= 0; i--) {
      // This week day
      const thisDay = new Date()
      thisDay.setHours(0, 0, 0, 0)
      thisDay.setDate(thisDay.getDate() - i)
      const thisDayNext = new Date(thisDay)
      thisDayNext.setDate(thisDayNext.getDate() + 1)

      // Last week same day
      const lastDay = new Date(thisDay)
      lastDay.setDate(lastDay.getDate() - 7)
      const lastDayNext = new Date(lastDay)
      lastDayNext.setDate(lastDayNext.getDate() + 1)

      const [thisWeekRes, lastWeekRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
          Query.equal('primaryDoctor', doctorName),
          Query.equal('status', 'completed'),
          Query.greaterThanEqual('schedule', thisDay.toISOString()),
          Query.lessThan('schedule', thisDayNext.toISOString()),
          Query.limit(1),
        ]),
        databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
          Query.equal('primaryDoctor', doctorName),
          Query.equal('status', 'completed'),
          Query.greaterThanEqual('schedule', lastDay.toISOString()),
          Query.lessThan('schedule', lastDayNext.toISOString()),
          Query.limit(1),
        ]),
      ])

      result.push({
        day: thisDay.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
        date: thisDay.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }),
        thisWeek: thisWeekRes.total * consultationFee,
        lastWeek: lastWeekRes.total * consultationFee,
      })
    }

    return result
  } catch (error) {
    console.error('getDoctorEarnings error:', error)
    return []
  }
}

// ============================
// 📋 PENDING APPOINTMENT REQUESTS
// ============================
// Returns pending appointments with patient info populated

export const getDoctorPendingRequests = async (doctorName: string) => {
    const databases = getDatabases()

  try {
    const res = await databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
      Query.equal('primaryDoctor', doctorName),
      Query.equal('status', 'pending'),
      Query.orderDesc('$createdAt'),
      Query.limit(20),
      Query.select(['$id', 'schedule', 'status', 'reason', 'note', 'patient.*', '$createdAt']),
    ])

    return res.documents.map((doc: any) => {
      const plain = Object.assign({}, doc)
      if (plain.patient) plain.patient = Object.assign({}, plain.patient)
      return parseStringify(plain)
    })
  } catch (error) {
    console.error('getDoctorPendingRequests error:', error)
    return []
  }
}

export const getDoctorRecentActivity = async (doctorName: string) => {
    const databases = getDatabases()
  try {
    const res = await databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
      Query.equal('primaryDoctor', doctorName),
      Query.orderDesc('$updatedAt'),
      Query.limit(10),
      Query.select(['$id', '$updatedAt', 'status', 'patient.*', 'cancellationReason']),
    ])

    return res.documents.map((doc: any) => {
      const patientName = doc.patient?.name ?? 'Unknown Patient'
      const time = timeAgo(doc.$updatedAt)

      let text = ''
      let color = 'bg-gray-400'

      switch (doc.status) {
        case 'scheduled':
          text = `Confirmed ${patientName}`
          color = 'bg-green-400'
          break
        case 'completed':
          text = `Completed ${patientName} consult`
          color = 'bg-blue-400'
          break
        case 'cancelled':
          text = `Declined ${patientName}`
          color = 'bg-red-400'
          break
        case 'pending':
          text = `New request from ${patientName}`
          color = 'bg-yellow-400'
          break
        case 'expired':
          text = `Expired — ${patientName}`
          color = 'bg-gray-400'
          break
        default:
          text = `Updated ${patientName}`
          color = 'bg-gray-400'
      }

      return { text, time, color }
    })
  } catch (error) {
    console.error('getDoctorRecentActivity error:', error)
    return []
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ============================
// 📋 DOCTOR APPOINTMENTS
// ============================
export const getDoctorAppointments = async (doctorName: string) => {
    const databases = getDatabases()

  try {
    const res = await databases.listDocuments(DATABASE_ID!, APPOINTMENT_COLLECTION_ID!, [
      Query.equal('primaryDoctor', doctorName),
      Query.orderDesc('$createdAt'),
      Query.limit(100),
    ])

    return res.documents.map((doc: any) => ({
      $id: doc.$id,
      schedule: doc.schedule,
      status: doc.status,
      reason: doc.reason,
      note: doc.note ?? '',
      cancellationReason: doc.cancellationReason ?? '',
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      patientName: doc.patient?.name ?? 'Unknown',
      patientEmail: doc.patient?.email ?? '',
      patientPhone: doc.patient?.phone ?? '',
      patientId: doc.patient?.$id ?? '',
      patientPic: doc.patient?.profilePic ?? null,
    }))
  } catch (error) {
    console.error('getDoctorAppointments error:', error)
    return []
  }
}