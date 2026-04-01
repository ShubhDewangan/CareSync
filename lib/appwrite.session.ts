import { Client, Account } from "node-appwrite"
import { cookies } from "next/headers"

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

  // ✅ Check BEFORE calling setSession
  const cookieStore = await cookies()
  const session = cookieStore.get("appwrite-session")

  if (!session?.value) throw new Error("No session found")

  client.setSession(session.value)

  return {
    account: new Account(client),
  }
}