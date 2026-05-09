/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/patients/[userId]/records/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"
import { redirect } from "next/navigation"
import { getPatientsPrescriptions, getPatientReports } from "@/lib/actions/records.actions"
import PatientRecordsView from "./PatientRecordsView"

export default async function PatientRecordsPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const authUser = await getLoggedInUser()
  const { userId } = await params

  if (!authUser || authUser.$id !== userId) redirect("/")
  if (authUser.userType !== "patient") redirect(`/doctors/${authUser.$id}/dashboard`)

  const patient = await getPatient(userId)
  if (!patient) redirect(`/patients/${userId}/register`)

    const prescriptions = await getPatientsPrescriptions(patient.$id)
  
  const reports = await getPatientReports(patient.$id)
    // const reports: any = []

  return (
    <PatientRecordsView
      userId={userId}
      patient={JSON.parse(JSON.stringify(patient))}
      prescriptions={prescriptions as any}
      reports={reports} authUser={authUser}    />
  )
}