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
import { sendEmail, verificationEmailHtml } from "../resend"
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
// 🔐 CREATE USER + SEND VERIFICATION
// ============================
export const createUser = async (user: CreateUserParams) => {
  try {
    // Step 1: Create user via Admin SDK
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      user.password,
      user.name
    )

    // Step 2: Generate a verification token via Admin SDK
    // Admin SDK can create tokens on behalf of any user — no session needed
    const adminClient = getAdminClient()
    const adminUsers = new Users(adminClient)

    // createToken generates a secret that works as a verification secret
    // expire: 3600 = 1 hour
    const token = await adminUsers.createToken(newUser.$id, 6, 3600)

    // Step 3: Build verify URL using the token secret
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?userId=${newUser.$id}&secret=${token.secret}`

    // Step 4: Send via Resend — completely bypasses Appwrite mail
    await sendEmail({
      to: user.email,
      subject: "Verify your email — HealthApp",
      html: verificationEmailHtml(verifyUrl, user.name),
    })

    // Step 5: Automatically Log In User so they don't get stuck without a session
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

    const account = new Account(client)
    const session = await account.createEmailPasswordSession(user.email, user.password!)

    const cookieStore = await cookies()
    cookieStore.set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return {
      $id: newUser.$id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
    }

  } catch (error: any) {
    console.log('createUser error:', error?.code, error?.message)
    if (error?.code === 409) return false
    return null
  }
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
// 👤 GET CURRENT USER
// ============================
export const getUser = async () => {
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
        identificationDocumentUrl: `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${PROJECT_ID}`,
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