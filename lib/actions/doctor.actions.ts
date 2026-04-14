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
  BUCKET_ID
} from "../appwrite.config"
import { InputFile } from 'node-appwrite/file'
import { parseStringify } from "../utils"

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

export const getDoctor = async (userId: string) => {
  try {
    const doctors = await databases.listDocuments(
      DATABASE_ID!,
      DOCTOR_COLLECTION_ID,
      [Query.equal('userId', userId)]
    )

    const d = doctors.documents[0]
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
      updationConsent: d.updationConsent
    }
  } catch (error) {
    console.log("getDoctor error:", error)
    return null
  }
}