/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDoctorPrescriptions, getDoctorReports } from '@/lib/actions/records.actions'
import { getDoctor, getDoctorById } from '@/lib/actions/doctor.actions'
import PatientRecordsClient from '@/components/ui/doctor/PatientRecordsClient'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function PatientRecordsPage({ params }: Props) {
  const { userId } = await params
  console.log(userId)

  // userId in URL = doctor document $id
  const doctor = await getDoctor(userId)

  if (!doctor) {
    return (
      <div className="min-h-screen bg-[#EFECE3] flex items-center justify-center">
        <p className="text-red-500 text-[14px] font-medium">Doctor not found.</p>
      </div>
    )
  }

  const doctorId = doctor.$id
    
  const prescriptions = await getDoctorPrescriptions(doctorId)
  const reports = await getDoctorReports(doctorId)

  return (
    <PatientRecordsClient
      doctor={doctor as any}
      doctorId={doctorId}
      userId={userId}
      prescriptions={prescriptions as any}
      reports={reports as any}
    />
  )
}