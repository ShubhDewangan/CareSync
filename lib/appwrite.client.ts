import { Client, Account } from 'appwrite' // ← client SDK, not node-appwrite

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export const account = new Account(client)

