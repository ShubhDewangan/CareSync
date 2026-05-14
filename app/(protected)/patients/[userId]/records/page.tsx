/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPatientsPrescriptions, getPatientReports } from '@/lib/actions/records.actions'
import { getPatient } from '@/lib/actions/patient.actions'
import PatientRecordsView from '@/components/ui/patient/PatientRecordsView'
import { getLoggedInUser } from '@/lib/actions/auth.actions'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function PatientRecordsPage({ params }: Props) {
  const { userId } = await params

  const authUser = await getLoggedInUser()
  const patient = await getPatient(userId)

  if (!patient) {
    return (
      <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center">
        <p className="text-red-500 text-[14px] font-medium">Patient not found.</p>
      </div>
    )
  }

  const [prescriptions, reports] = await Promise.all([
    getPatientsPrescriptions(patient.$id),
    getPatientReports(patient.$id),
  ])

  return (
    <PatientRecordsView
      userId={userId}
      patient={patient as any}
      authUser={authUser as any}
      prescriptions={(prescriptions ?? []) as any}
      reports={(reports ?? []) as any}
    />
  )
}