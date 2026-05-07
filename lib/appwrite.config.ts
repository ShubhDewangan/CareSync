// lib/appwrite.config.ts
import { Client, Users, Databases, Storage, Messaging } from 'node-appwrite'

function getClient() {
  return new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)
}

export function getDatabases() { return new Databases(getClient()) }
export function getStorage()   { return new Storage(getClient()) }
export function getMessaging() { return new Messaging(getClient()) }
export function getUsers()     { return new Users(getClient()) }

// Keep these — they're just env var re-exports, safe at module level
export const BUCKET_ID               = process.env.NEXT_PUBLIC_BUCKET_ID
export const ENDPOINT                = process.env.NEXT_PUBLIC_ENDPOINT
export const PROJECT_ID              = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
export const DATABASE_ID             = process.env.DATABASE_ID
export const PATIENT_COLLECTION_ID   = process.env.PATIENT_COLLECTION_ID
export const APPOINTMENT_COLLECTION_ID = process.env.APPOINTMENT_COLLECTION_ID
export const DOCTOR_COLLECTION_ID    = process.env.DOCTOR_COLLECTION_ID
export const PRESCRIPTION_COLLECTION_ID = process.env.PRESCRIPTION_COLLECTION_ID