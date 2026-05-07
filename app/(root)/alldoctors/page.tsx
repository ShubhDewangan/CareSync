/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(root)/doctors/page.tsx
import { getAllDoctors, getDoctor } from "@/lib/actions/doctor.actions"
import DoctorsPageClient from "./DoctorsPageClient"
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getPatient } from "@/lib/actions/patient.actions"

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const doctors = await getAllDoctors()
  const authUser = await getLoggedInUser()

  const fullUser = await authUser?.userType === 'patient' ? await getPatient(authUser?.$id as any) : authUser?.userType === 'doctor' ? await getDoctor(authUser?.$id) : null

  return <DoctorsPageClient doctors={doctors} initialQuery={q ?? ""} authUser={authUser as any} fullUser={fullUser as any} />
}