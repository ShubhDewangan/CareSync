import { NextResponse } from "next/server"
import { getUser } from "@/lib/actions/patient.actions"

export async function GET() {
  console.log("API HIT 🔥") // 👈 ADD THIS

  const user = await getUser()

  console.log("USER FROM API:", user)

  return NextResponse.json(user)
}