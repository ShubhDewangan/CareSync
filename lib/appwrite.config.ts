// import * as sdk from 'node-appwrite'
// import { Users, Databases, Storage, Messaging } from "node-appwrite"

// const client = new sdk.Client();

// client
//     .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
//     .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
//     .setKey(process.env.API_KEY!)

// export const databases = new Databases(client)
// export const storage = new Storage(client)
// export const messaging = new Messaging(client)
// export const users = new Users(client)

// export const {NEXT_PUBLIC_BUCKET_ID: BUCKET_ID, DATABASE_ID, PATIENT_COLLECTION_ID, NEXT_PUBLIC_ENDPOINT: ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID: PROJECT_ID, APPOINTMENT_COLLECTION_ID} = process.env
import { Client, Users, Databases, Storage, Messaging } from 'node-appwrite'

const client = new Client();

client
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
    .setKey(process.env.API_KEY!)

export const databases = new Databases(client)
export const storage = new Storage(client)
export const messaging = new Messaging(client)
export const users = new Users(client)

export const {
    NEXT_PUBLIC_BUCKET_ID: BUCKET_ID,
    NEXT_PUBLIC_ENDPOINT: ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID: PROJECT_ID,
    DATABASE_ID,
    PATIENT_COLLECTION_ID,
    APPOINTMENT_COLLECTION_ID,
} = process.env