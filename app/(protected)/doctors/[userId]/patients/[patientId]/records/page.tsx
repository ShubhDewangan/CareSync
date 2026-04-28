/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/doctors/[userId]/patients/[patientId]/records/page.tsx

import { getDoctorPrescriptions, getDoctorReports, getFileViewUrl } from '@/lib/actions/prescriptions.actions'
import { getDoctor } from '@/lib/actions/doctor.actions'
import { databases, DATABASE_ID } from '@/lib/appwrite.config'
import PatientRecordsClient from '@/components/ui/doctor/PatientRecordsClient'
import { Doctor } from '@/types/appwrite'
import { FullUser } from '@/context/UserContext'

interface Props {
  params: Promise<{ userId: string; patientId: string }>
}

export default async function PatientRecordsPage({ params }: Props) {
  const { userId, patientId } = await params

  const doctor = await getDoctor(userId)
  const doctorId = doctor?.$id

  // Fetch patient info
  const patient = await databases.getDocument(
    DATABASE_ID!,
    process.env.PATIENT_COLLECTION_ID!,
    patientId
  )

  const [prescriptions, reports] = await Promise.all([
    getDoctorPrescriptions(doctorId as any, patientId),
    getDoctorReports(doctorId as any, patientId),
  ])

  return (
    <PatientRecordsClient
      doctor={doctor as any as Doctor}
      doctorId={doctorId as any}
      userId={userId}
      patient={patient as any}
      patientId={patientId}
      prescriptions={prescriptions}
      reports={reports}
    />
  )
}