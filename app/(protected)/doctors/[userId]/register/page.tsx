/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/patients/[userId]/register/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { redirect } from "next/navigation"
import { RegisterFormDoctor } from "./RegisterFormDoctor"
import { getDoctor } from "@/lib/actions/doctor.actions"

export default async function PatientRegisterPage({
  params,
}: {
  params: Promise<{userId: string}>
}) {
  const authUser = await getLoggedInUser()
  const { userId } = await params

  // Must be logged in and must be the right user
  if (!authUser || authUser.$id !== userId) redirect("/")

  // Must be a patient
  if (authUser.userType !== "doctor") {
    redirect(`/patients/${authUser.$id}/register`)
  }

  // Already registered → send to dashboard
  const doctor = await getDoctor(userId)
  if (doctor) redirect(`/patients/${userId}/dashboard`)

  return (
    <div className="h-auto overflow-y-auto ">
      <RegisterFormDoctor user={authUser} doctor={doctor as any}/>
    </div>
  )
}