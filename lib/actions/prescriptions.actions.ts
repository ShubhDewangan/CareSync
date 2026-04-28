/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { ID, Query } from 'node-appwrite'
import {
  databases,
  storage,
  DATABASE_ID,
  BUCKET_ID,
} from '../appwrite.config'
import { parseStringify } from '../utils'
import { revalidatePath } from 'next/cache'
import { InputFile } from 'node-appwrite/file'

// Collection IDs — add these to your .env
const PRESCRIPTION_COLLECTION_ID = process.env.PRESCRIPTION_COLLECTION_ID!
const MEDICAL_REPORT_COLLECTION_ID = process.env.MEDICAL_REPORT_COLLECTION_ID!

// ============================
// 💊 PRESCRIPTIONS
// ============================

export interface CreatePrescriptionParams {
  doctorId: string
  patientId: string       // patient document $id
  appointmentId?: string
  diagnosis: string
  medications: {
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }[]
  notes?: string
  followUpDate?: string
}

export const createPrescription = async (params: CreatePrescriptionParams) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID!,
      PRESCRIPTION_COLLECTION_ID,
      ID.unique(),
      {
        doctorId: params.doctorId,
        patientId: params.patientId,
        appointmentId: params.appointmentId ?? null,
        diagnosis: params.diagnosis,
        medications: JSON.stringify(params.medications),   // stored as JSON string
        notes: params.notes ?? '',
        followUpDate: params.followUpDate ?? null,
      }
    )

    revalidatePath(`/doctors/${params.doctorId}/patients/${params.patientId}/records`)
    revalidatePath(`/patients/${params.patientId}/records`)
    return parseStringify(doc)
  } catch (error) {
    console.error('createPrescription error:', error)
    throw error
  }
}

export const getDoctorPrescriptions = async (doctorId: string, patientId?: string) => {
  try {
    const filters = [
      Query.equal('doctorId', doctorId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]
    if (patientId) filters.push(Query.equal('patientId', patientId))

    const res = await databases.listDocuments(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, filters)
    return res.documents.map(doc => ({
      ...parseStringify(doc),
      medications: JSON.parse(doc.medications || '[]'),
    }))
  } catch (error) {
    console.error('getDoctorPrescriptions error:', error)
    return []
  }
}

export const getPatientPrescriptions = async (patientId: string) => {
  try {
    const res = await databases.listDocuments(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, [
      Query.equal('patientId', patientId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])
    return res.documents.map(doc => ({
      ...parseStringify(doc),
      medications: JSON.parse(doc.medications || '[]'),
    }))
  } catch (error) {
    console.error('getPatientPrescriptions error:', error)
    return []
  }
}

export const deletePrescription = async (prescriptionId: string, doctorId: string, patientId: string) => {
  try {
    await databases.deleteDocument(DATABASE_ID!, PRESCRIPTION_COLLECTION_ID, prescriptionId)
    revalidatePath(`/doctors/${doctorId}/patients/${patientId}/records`)
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
  try {
    const filters = [
      Query.equal('doctorId', doctorId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]
    if (patientId) filters.push(Query.equal('patientId', patientId))

    const res = await databases.listDocuments(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID, filters)
    return res.documents.map(doc => parseStringify(doc))
  } catch (error) {
    console.error('getDoctorReports error:', error)
    return []
  }
}

export const getPatientReports = async (patientId: string) => {
  try {
    const res = await databases.listDocuments(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID, [
      Query.equal('patientId', patientId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ])
    return res.documents.map(doc => parseStringify(doc))
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
  try {
    await Promise.all([
      storage.deleteFile(BUCKET_ID!, fileId),
      databases.deleteDocument(DATABASE_ID!, MEDICAL_REPORT_COLLECTION_ID, reportId),
    ])
    revalidatePath(`/doctors/${doctorId}/patients/${patientId}/records`)
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

export const getFileViewUrl = (fileId: string) => {
  return `${process.env.NEXT_PUBLIC_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`
}

// ============================
// 👥 GET DOCTOR'S PATIENTS
// ============================
// Distinct patients who have had appointments with this doctor

export const getDoctorPatients = async (doctorId: string) => {
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