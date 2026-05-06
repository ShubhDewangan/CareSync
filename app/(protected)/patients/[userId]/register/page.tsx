/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/patients/[userId]/register/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"
import { redirect } from "next/navigation"
import { RegisterForm } from "./RegisterForm"
import { getAllDoctors } from "@/lib/actions/doctor.actions"

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
  if (authUser.userType !== "patient") {
    redirect(`/doctors/${authUser.$id}/register`)
  }

  // Already registered → send to dashboard
  const patient = await getPatient(userId)
  if (patient) redirect(`/patients/${userId}/dashboard`)

  const doctors = await getAllDoctors()

  return (
    <div className="h-auto overflow-y-auto ">
      <RegisterForm user={authUser} patient={patient? patient : undefined} doctors={doctors}/>
    </div>
  )
}