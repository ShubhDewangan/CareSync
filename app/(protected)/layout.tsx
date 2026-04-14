/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/layout.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"
import { getDoctor } from "@/lib/actions/doctor.actions"
import { UserProvider } from "@/context/UserContext"
import { redirect } from "next/navigation"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Read JWT — instant, no DB call
  const authUser = await getLoggedInUser()

  // 2. Not logged in → back to homepage
  if (!authUser) redirect("/")

  // 3. Load full record from DB based on userType
  let fullUser = null

  if (authUser.userType === "patient") {
    const patient = await getPatient(authUser.$id)
    if (patient) fullUser = { ...patient, userType: "patient" as const }
  } else {
    const doctor = await getDoctor(authUser.$id)
    if (doctor) fullUser = { ...doctor, userType: "doctor" as const }
  }

  return (
    <UserProvider
      initialAuthUser={authUser}
      initialFullUser={fullUser as any}
    >
      {children}
    </UserProvider>
  )
}