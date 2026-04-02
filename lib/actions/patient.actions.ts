/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Client, Account, ID, Query, Users } from "node-appwrite"
import { cookies } from "next/headers"
import {
  DATABASE_ID,
  databases,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  storage,
  users,
  BUCKET_ID
} from "../appwrite.config"
import { InputFile } from 'node-appwrite/file'
import { parseStringify } from "../utils"

// ============================
// 🔧 ADMIN CLIENT HELPER
// ============================
function getAdminClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

// ============================
// 🔐 CREATE SESSION CLIENT
// ============================
export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

  const cookieStore = await cookies()
  const session = cookieStore.get("appwrite-session")

  if (!session?.value) throw new Error("No session found")

  client.setSession(session.value)

  return { account: new Account(client) }
}

// ============================
// 👤 CREATE USER
// ============================
// No password — Appwrite creates the account via Admin SDK.
// OTP is sent separately by sendOtp() in auth.actions.ts.
// No auto-login here — verifyOtp() in auth.actions.ts handles session creation.

export const createUser = async (user: {
  name: string
  email: string
  phone: string
}) => {
  try {
    const adminUsers = new Users(getAdminClient())

    // Create user without password — Appwrite supports passwordless accounts
    const newUser = await adminUsers.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,   // no password
      user.name
    )

    return {
      $id: newUser.$id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
    }

  } catch (error: any) {
    console.log('createUser error:', error?.code, error?.message)
    if (error?.code === 409) return false   // user already exists
    return null
  }
}

// ============================
// 👤 GET CURRENT USER
// ============================
export const getUser = async (userId: string) => {
  try {
    const { account } = await createSessionClient()
    return await account.get()
  } catch (error) {
    console.log("getUser error:", error)
    return null
  }
}

// ============================
// 🏥 REGISTER PATIENT
// ============================
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file

    if (identificationDocument) {
      const blobFile = identificationDocument.get('blobFile') as Blob
      const fileName = identificationDocument.get('fileName') as string
      const arrayBuffer = await blobFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, fileName)
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
    }

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentationId: file?.$id || null,
        identificationDocumentUrl: file
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
          : null,
        ...patient
      }
    )

    return parseStringify(newPatient)
  } catch (error) {
    console.log(error)
    return null
  }
}

// ============================
// 👤 GET PATIENT
// ============================
export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    )

    const p = patients.documents[0]
    if (!p) return null

    return {
      $id: p.$id,
      userId: p.userId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      primaryDoctor: p.primaryDoctor,
      birthDate: p.birthDate,
      gender: p.gender,
      address: p.address,
      occupation: p?.occupation,
      insuranceProvider: p?.insuranceProvider,
      insurancePolicyNumber: p?.insurancePolicyNumber,
      emergencyContactName: p?.emergencyContactName,
      emergencyContactNumber: p?.emergencyContactNumber,
      privacyConsent: p?.privacyConsent,
      treatmentConsent: p?.treatmentConsent,
      disclosureConsent: p?.disclosureConsent,
      pastMedicalHistory: p?.pastMedicalHistory,
      familyMedicalHistory: p?.familyMedicalHistory,
      identificationType: p?.identificationType,
      identificationDocumentationId: p?.identificationDocumentationId,
      identificationDocument: p?.identificationDocument,
      allergies: p?.allergies,
      currentMedication: p?.currentMedication
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

// ============================
// ✏️ UPDATE PATIENT
// ============================
export const updatePatient = async (
  patientId: string,
  { identificationDocument, ...patient }: RegisterUserParams
) => {
  try {
    let file

    if (identificationDocument) {
      const blobFile = identificationDocument.get('blobFile') as Blob
      const fileName = identificationDocument.get('fileName') as string
      const arrayBuffer = await blobFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, fileName)
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
    }

    const updatedPatient = await databases.updateDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      patientId,
      {
        ...(file && {
          identificationDocumentationId: file.$id,
          identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`,
        }),
        ...patient
      }
    )

    return parseStringify(updatedPatient)
  } catch (error) {
    console.log(error)
    return null
  }
}