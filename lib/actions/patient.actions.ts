// lib/actions/patient.actions.ts
// Added: getDoctor function
/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Client, Account, ID, Query, Users } from "node-appwrite"
import { cookies } from "next/headers"
import {
  DATABASE_ID,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  BUCKET_ID,
  getDatabases,
  getStorage
} from "../appwrite.config"
import { InputFile } from 'node-appwrite/file'
import { parseStringify } from "../utils"

const DOCTOR_COLLECTION_ID = process.env.DOCTOR_COLLECTION_ID!

const databases = getDatabases()
const storage = getStorage()

// ============================
// 👤 CREATE USER
// ============================
// Stores userType in Appwrite prefs so we can read it later in JWT

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

    // console.log(p.profilePic)
    // console.log(p.identificationDocumentUrl)
    // console.log(p)

    return {
      $id: p.$id,
      userId: p.userId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      profilePic: p.profilePic,
      primaryDoctor: p?.primaryDoctor,
      birthDate: p?.birthDate,
      gender: p?.gender,
      address: p?.address,
      occupation: p?.occupation,
      insuranceProvider: p?.insuranceProvider,
      insurancePolicyNumber: p?.insurancePolicyNumber,
      emergencyContactName: p?.emergencyContactName,
      emergencyContactNumber: p?.emergencyContactNumber,
      bloodGroup: p?.bloodGroup,
      height: p?.height,
      weight: p?.weight,
      privacyConsent: p?.privacyConsent,
      treatmentConsent: p?.treatmentConsent,
      disclosureConsent: p?.disclosureConsent,
      pastMedicalHistory: p?.pastMedicalHistory,
      familyMedicalHistory: p?.familyMedicalHistory,
      identificationType: p?.identificationType,
      identificationDocumentationId: p?.identificationDocumentationId,
      identificationDocument: p?.identificationDocument,
      allergies: p?.allergies,
      currentMedication: p?.currentMedication,
      registrationComplete: true,
    }
  } catch (error) {
    console.log("getPatient error:", error)
    // console.log('nothing')
    return null
  }
}
export const getPatientbyId = async (id: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('$id', id)]
    )

    const p = patients.documents[0]
    if (!p) return null

    // console.log(p.profilePic)
    // console.log(p.identificationDocumentUrl)
    // console.log(p)

    return {
      $id: p.$id,
      userId: p.userId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      profilePic: p.profilePic,
      primaryDoctor: p?.primaryDoctor,
      birthDate: p?.birthDate,
      gender: p?.gender,
      address: p?.address,
      occupation: p?.occupation,
      insuranceProvider: p?.insuranceProvider,
      insurancePolicyNumber: p?.insurancePolicyNumber,
      emergencyContactName: p?.emergencyContactName,
      emergencyContactNumber: p?.emergencyContactNumber,
      bloodGroup: p?.bloodGroup,
      height: p?.height,
      weight: p?.weight,
      privacyConsent: p?.privacyConsent,
      treatmentConsent: p?.treatmentConsent,
      disclosureConsent: p?.disclosureConsent,
      pastMedicalHistory: p?.pastMedicalHistory,
      familyMedicalHistory: p?.familyMedicalHistory,
      identificationType: p?.identificationType,
      identificationDocumentationId: p?.identificationDocumentationId,
      identificationDocument: p?.identificationDocument,
      allergies: p?.allergies,
      currentMedication: p?.currentMedication,
      registrationComplete: true,
    }
  } catch (error) {
    console.log("getPatient error:", error)
    // console.log('nothing')
    return null
  }
}

// ============================
// 🩺 GET DOCTOR
// ============================



// ============================
// 🏥 REGISTER PATIENT
// ============================

export const registerPatient = async ({
  identificationDocument,
  profilePic,        // ← add this
  ...patient
}: RegisterUserParams) => {
  try {
    let file
    let profilePicFile

    // ── Identification document ──────────────────────────
    if (identificationDocument) {
      const blobFile = identificationDocument.get('blobFile') as Blob
      const fileName = identificationDocument.get('fileName') as string
      const arrayBuffer = await blobFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, fileName)
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

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
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
// ✏️ UPDATE PATIENT
// ============================

export const updatePatient = async (
  patientId: string,     // ← add this
  { identificationDocument, profilePic, ...patient }: RegisterUserParams
) => {
  try {
    let file;
    let profilePicFile;

    if (identificationDocument) {
      const blobFile = identificationDocument.get('blobFile') as Blob
      const fileName = identificationDocument.get('fileName') as string
      const arrayBuffer = await blobFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, fileName)
      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
    }

    if (profilePic && profilePic.length > 0) {
      const pic = profilePic[0]
      const arrayBuffer = await pic.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const inputFile = InputFile.fromBuffer(buffer, pic.name)
      profilePicFile = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile)
    }

    const data: any = {
      ...patient,
    };

    if (file) {
      data.identificationDocumentationId = file.$id;
      data.identificationDocumentUrl = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
    }

    if (profilePicFile) {
      data.profilePic = `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${profilePicFile.$id}/view?project=${PROJECT_ID}`;
    }

    const updatedPatient = await databases.updateDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      patientId,
      data
    );
    
    return parseStringify(updatedPatient)
  } catch (error) {
    console.log(error)
    return null
  }
}