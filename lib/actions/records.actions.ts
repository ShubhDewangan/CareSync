/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { ID, Query } from 'node-appwrite'
import {
  DATABASE_ID,
  BUCKET_ID,
  getDatabases,
  getStorage,
} from '../appwrite.config'
import { parseStringify } from '../utils'
import { revalidatePath } from 'next/cache'
import { InputFile } from 'node-appwrite/file'

// Collection IDs — add these to your .env
const PRESCRIPTION_COLLECTION_ID = process.env.PRESCRIPTION_COLLECTION_ID!
const MEDICAL_REPORT_COLLECTION_ID = process.env.RECORD_COLLECTION_ID!

// ── Replace the TOP section of prescriptions.actions.ts ──────────────────────
// Delete the old CreatePrescriptionParams interface + createPrescription function
// and replace with this:

export interface CreatePrescriptionParams {
  appointmentId: string
  patientId: string
  doctorId: string
  type: "typed" | "image"
  content?: string
  imageFileId?: string
  notes?: string
  // ✅ fields the editor actually fills
  diagnosis?: string
  medications?: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }[]
  followUpDate?: string
}

export interface UpdatePrescriptionParams {
  prescriptionId: string
  content?: string
  imageFileId?: string
  notes?: string
  // ✅ also updatable
  diagnosis?: string
  medications?: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }[]
  followUpDate?: string
}

export async function createPrescription(params: CreatePrescriptionParams) {
  const {
    appointmentId, patientId, doctorId, type,
    content, imageFileId, notes,
    diagnosis, medications, followUpDate,
  } = params
  const databases = getDatabases()


  const doc = await databases.createDocument(
    DATABASE_ID!,
    PRESCRIPTION_COLLECTION_ID,
    ID.unique(),
    {
      appointmentId,
      patientId,
      doctorId,
      type,
      content:      content                          ?? '',
      imageFileId:  imageFileId                      ?? '',
      notes:        notes                            ?? '',
      diagnosis:    diagnosis                        ?? '',
      medications:  medications?.map(m => JSON.stringify(m))                      ?? [],
      followUpDate: followUpDate                     ?? null,
    }
  )

  revalidatePath(`/patients/${patientId}/records`)
  return doc ? JSON.parse(JSON.stringify(doc)) : null
}

export async function updatePrescription(params: UpdatePrescriptionParams) {
  const {
    prescriptionId, content, imageFileId, notes,
    diagnosis, medications, followUpDate,
  } = params

  const databases = getDatabases()


  const existing = await databases.getDocument(
    DATABASE_ID!, PRESCRIPTION_COLLECTION_ID!, prescriptionId
  )
  const hoursSince = (Date.now() - new Date(existing.$createdAt as string).getTime()) / (1000 * 60 * 60)
  if (hoursSince > 24) {
    throw new Error("Prescription can no longer be edited (24-hour window passed).")
  }

  const doc = await databases.updateDocument(
    DATABASE_ID!,
    PRESCRIPTION_COLLECTION_ID!,
    prescriptionId,
    {
      ...(content      !== undefined ? { content }                              : {}),
      ...(imageFileId  !== undefined ? { imageFileId }                          : {}),
      ...(notes        !== undefined ? { notes }                                : {}),
      ...(diagnosis    !== undefined ? { diagnosis }                            : {}),
      ...(medications  !== undefined ? { medications: medications.map(m => JSON.stringify(m)) } : {}),
      ...(followUpDate !== undefined ? { followUpDate }                         : {}),
    }
  )
  const medication = JSON.stringify(medications)
  console.log(medication)

  revalidatePath(`/patients/${existing.patientId}/records`)
  return doc ? JSON.parse(JSON.stringify(doc)) : null
}

 // ── Get single (by appointmentId) ──────────────────────────────────────────── 
 // prescriptions.actions.ts 
export async function getPrescriptionByAppointment(appointmentId: string) {
    const databases = getDatabases()
  
  try {
    const res = await databases.listDocuments(
      DATABASE_ID!,
      PRESCRIPTION_COLLECTION_ID!,
      [Query.equal("appointmentId", appointmentId), Query.limit(1)]
    )
    const doc = res.documents[0] ?? null

    console.log(doc)
    
    // ✅ Serialize before returning to client
    return doc ? JSON.parse(JSON.stringify(doc)) : null
  } catch (error) {
    console.error("getPrescriptionByAppointment error:", error)
    return null
  }
}

// ── Update (allowed within 24 hrs of createdAt) ───────────────────────────────
// export async function updatePrescription(params: UpdatePrescriptionParams) {
//   const { prescriptionId, content, imageFileId, notes } = params

//   // Enforce 24-hour edit window
//   const existing = await databases().getDocument(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID!, prescriptionId)
//   const createdAt = new Date(existing.$createdAt as string).getTime()
//   const hoursSince = (Date.now() - createdAt) / (1000 * 60 * 60)
//   if (hoursSince > 24) {
//     throw new Error("Prescription can no longer be edited (24-hour window passed).")
//   }

//   const doc = await databases().updateDocument(
//     DATABASE_ID!,
//     PRESCRIPTION_COLLECTION_ID!,
//     prescriptionId,
//     {
//       ...(content     !== undefined ? { content }     : {}),
//       ...(imageFileId !== undefined ? { imageFileId } : {}),
//       ...(notes       !== undefined ? { notes }       : {}),
//     }
//   )

//   revalidatePath(`/patients/${existing.patientId}/records`)
//   return doc ? JSON.parse(JSON.stringify(doc)) : null
// }

// // ── Get all prescriptions for a patient (for patient records page) ────────────
// export async function getPatientPrescriptions(patientId: string) {
//   const res = await databases().listDocuments(
//     DATABASE_ID!,
//     PRESCRIPTION_COLLECTION_ID!,
//     [
//       Query.equal("patientId", patientId),
//       Query.orderDesc("$createdAt"),
//       Query.limit(50),
//     ]
//   )
//   return res.documents.map(doc => JSON.parse(JSON.stringify(doc)))
// }

// ============================
// 💊 PRESCRIPTIONS
// ============================

// export const createPrescription = async (params: CreatePrescriptionParams) => {
//   try {
//     const doc = await databases().createDocument(
//       DATABASE_ID!,
//       PRESCRIPTION_COLLECTION_ID,
//       ID.unique(),
//       {
//         doctorId: params.doctorId,
//         patientId: params.patientId,
//         appointmentId: params.appointmentId ?? null,
//         diagnosis: params.diagnosis,
//         medications: JSON.stringify(params.medications),   // stored as JSON string
//         notes: params.notes ?? '',
//         followUpDate: params.followUpDate ?? null,
//       }
//     )

//     revalidatePath(`/doctors/${params.doctorId}/patients/${params.patientId}/records`)
//     revalidatePath(`/patients/${params.patientId}/records`)
//     return parseStringify(doc)
//   } catch (error) {
//     console.error('createPrescription error:', error)
//     throw error
//   }
// }

export const getDoctorPrescriptions = async (doctorId: string, patientId?: string) => {
  const databases = getDatabases()

  try {
    const filters = [
      Query.equal('doctorId', doctorId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]
    if (patientId) filters.push(Query.equal('patientId', patientId))

    const res = await databases.listDocuments(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, filters)

    return res.documents.map((doc: any) => {
      const serialized = JSON.parse(JSON.stringify(doc))

      // medications is string[] — each element is a JSON-stringified Medication object
      const raw = serialized.medications
      const medications = Array.isArray(raw)
        ? raw.map((m: any) => {
            if (typeof m === 'string') {
              try { return JSON.parse(m) } catch { return null }
            }
            return m
          }).filter(Boolean)
        : []

      return { ...serialized, medications }
    })
  } catch (error) {
    console.error('getDoctorPrescriptions error:', error)
    return []
  }
}

// export const getPatientPrescriptions = async (patientId: string) => {
//   try {
//     const res = await databases().listDocuments(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, [
//       Query.equal('patientId', patientId),
//       Query.orderDesc('$createdAt'),
//       Query.limit(50),
//     ])
//     return res.documents.map(doc => ({
//       ...parseStringify(doc),
//       medications: JSON.parse(doc.medications || '[]'),
//     }))
//   } catch (error) {
//     console.error('getPatientPrescriptions error:', error)
//     return []
//   }
// }

export const deletePrescription = async (prescriptionId: string, doctorId: string, patientId: string) => {
  const databases = getDatabases()

  try {
    await databases.deleteDocument(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, prescriptionId)
    revalidatePath(`/doctors/${doctorId}/records`)
    revalidatePath(`/patients/${patientId}/records`)
    return { success: true }
  } catch (error) {
    console.error('deletePrescription error:', error)
    return { success: false }
  }
}

// ============================
// 📄 MEDICAL REPORTS
// ============================

export interface UploadMedicalReportParams {
  doctorId: string
  patientId: string
  appointmentId?: string
  title: string
  reportType: 'lab' | 'imaging' | 'discharge' | 'referral' | 'other'
  notes?: string
  file: FormData
}

export const uploadMedicalReport = async (params: UploadMedicalReportParams) => {
    const databases = getDatabases()
  const storage = getStorage()
  try {
    const formData = params.file
    const file = formData.get('file') as File

    if (!file) throw new Error('No file provided')

    // Upload file to Appwrite Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const inputFile = InputFile.fromBuffer(buffer, file.name)

    const uploaded = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)

    // Create DB record
    const doc = await databases.createDocument(
      DATABASE_ID!,
      MEDICAL_REPORT_COLLECTION_ID,
      ID.unique(),
      {
        doctorId: params.doctorId,
        patientId: params.patientId,
        appointmentId: params.appointmentId ?? null,
        title: params.title,
        reportType: params.reportType,
        notes: params.notes ?? '',
        fileId: uploaded.$id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      }
    )

    revalidatePath(`/doctors/${params.doctorId}/patients/${params.patientId}/records`)
    revalidatePath(`/patients/${params.patientId}/records`)
    return parseStringify(doc)
  } catch (error) {
    console.error('uploadMedicalReport error:', error)
    throw error
  }
}

export const getDoctorReports = async (doctorId: string, patientId?: string) => {
    const databases = getDatabases()
  
  try {
    const filters = [
      Query.equal('doctorId', doctorId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]
    if (patientId) filters.push(Query.equal('patientId', patientId))
      
      const res = await databases.listDocuments(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID, filters)
    return res.documents.map((doc: any) => parseStringify(doc))
  } catch (error) {
    console.error('getDoctorReports error:', error)
    return []
  }
}

export const getPatientReports = async (patientId: string) => {
    const databases = getDatabases()
  
  try {
    const res = await databases.listDocuments(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID!, [
      Query.equal('patientId', patientId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])
    return res.documents.map((doc) => parseStringify(doc))
  } catch (error) {
    console.error('getPatientReports error:', error)
    return []
  }
}

export const deleteMedicalReport = async (
  reportId: string,
  fileId: string,
  doctorId: string,
  patientId: string
) => {
  const databases = getDatabases()
const storage = getStorage()
  try {
    await Promise.all([
      storage.deleteFile(BUCKET_ID!, fileId),
      databases.deleteDocument(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID, reportId),
    ])
    revalidatePath(`/doctors/${doctorId}/records`)
    revalidatePath(`/patients/${patientId}/records`)
    return { success: true }
  } catch (error) {
    console.error('deleteMedicalReport error:', error)
    return { success: false }
  }
}

// ============================
// 🔗 GET FILE URL (for viewing)
// ============================


// ============================
// 👥 GET DOCTOR'S PATIENTS
// ============================
// Distinct patients who have had appointments with this doctor

export const getDoctorPatients = async (doctorId: string) => {
  const databases = getDatabases()

  try {
    const res = await databases.listDocuments(DATABASE_ID!, process.env.APPOINTMENT_COLLECTION_ID!, [
      Query.equal('primaryDoctor', doctorId),
      Query.orderDesc('$createdAt'),
      Query.limit(200),
      Query.select(['$id', 'patient.*', 'schedule', 'status']),
    ])

    // Deduplicate by patient $id
    const seen = new Set<string>()
    const patients: any[] = []

    for (const doc of res.documents) {
      const p = doc.patient
      if (!p || seen.has(p.$id)) continue
      seen.add(p.$id)
      patients.push(parseStringify(Object.assign({}, p)))
    }

    return patients
  } catch (error) {
    console.error('getDoctorPatients error:', error)
    return []
  }
}

export const getPatientsPrescriptions = async (patientId: string) => {
  const databases = getDatabases()
  try {
    const res = await databases.listDocuments(DATABASE_ID!, process.env.PRESCRIPTION_COLLECTION_ID!, [
      Query.equal('patientId', patientId),
      Query.limit(200)
    ])

    return parseStringify(res.documents)
  } catch (error) {
    console.log(error)
  }
}