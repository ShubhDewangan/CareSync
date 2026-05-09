/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/alldoctors/[userId]/patients/[patientId]/records/page.tsx

import { getDoctorPrescriptions, getDoctorReports } from '@/lib/actions/records.actions'
import { getDoctor } from '@/lib/actions/doctor.actions'
import PatientRecordsClient from '@/components/ui/doctor/PatientRecordsClient'
import { getPatientbyId } from '@/lib/actions/patient.actions'


interface Props {
  params: Promise<{ userId: string; patientId: string }>
}

export default async function PatientRecordsPage({ params }: Props) {
  const { userId } = await params
  const { patientId } = await params

  const doctor = await getDoctor(userId)
  const doctorId = doctor?.$id

  // Fetch patient info
  const patient = await getPatientbyId(patientId)
  console.log(patient)

  const prescriptions = await getDoctorPrescriptions(doctorId as any, patientId)
  const reports = await getDoctorReports(doctorId as any, patientId)
  console.log(typeof prescriptions)
  return (
    <PatientRecordsClient
      doctor={doctor as any}
      doctorId={doctorId as any}
      userId={userId}
      patient={patient as any}
      patientId={patientId}
      prescriptions={prescriptions}
      reports={reports}
    />
  )
}