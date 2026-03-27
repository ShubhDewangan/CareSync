/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Account, Client, ID, Query } from "node-appwrite"
import { cookies } from "next/headers"
import { DATABASE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config"
import { InputFile } from 'node-appwrite/file'
import { BUCKET_ID } from '../appwrite.config'

export const createUser = async (user: CreateUserParams) => {
    try {
        const newUser = await users.create(
            ID.unique(),
            user.email,
            user.phone,
            user.password,
            user.name
        )

        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

        const account = new Account(client)
        const session = await account.createEmailPasswordSession(user.email, user.password!)

        const cookieStore = await cookies()
        cookieStore.set("appwrite-session", session.secret, {
            path: "/",
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        })

        return {
            $id: newUser.$id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
        }

    } catch (error: any) {
        console.log('error code:', error?.code)
        if (error?.code === 409) {
            console.log(error);
            
            return false}  // user already exists
        return null
    }
}

export const getUser = async (userId: string) => {
    try {
        const user = await users.get(userId)
        return {
            $id: user.$id,
            name: user.name,
            email: user.email,
            phone: user.phone,
        }
    } catch (error) {
        console.log(error)
        return null
    }
}

export const registerPatient = async ({ identificationDocument, ...patient }: RegisterUserParams) => {
    try {
        let file;

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

        return JSON.parse(JSON.stringify(newPatient))

    } catch (error) {
        console.log(error)
        return null
    }
}

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

export const updatePatient = async (patientId: string, { identificationDocument, ...patient }: RegisterUserParams) => {
    try {
        let file;

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

        return JSON.parse(JSON.stringify(updatedPatient))
    } catch (error) {
        console.log(error)
        return null
    }
}
