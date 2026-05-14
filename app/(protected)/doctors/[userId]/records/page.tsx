// /* eslint-disable @typescript-eslint/no-explicit-any */
// // app/(protected)/alldoctors/[userId]/records/page.tsx

// import { getDoctorPrescriptions, getDoctorReports } from '@/lib/actions/records.actions'
// import { getDoctor } from '@/lib/actions/doctor.actions'
// import PatientRecordsClient from '@/components/ui/doctor/PatientRecordsClient'

// interface Props {
//   params: Promise<{ userId: string }>
// }

// export default async function PatientRecordsPage({ params }: Props) {
//   const { userId } = await params

//   const doctor = await getDoctor(userId)
//   const doctorId = doctor?.$id

//   const prescriptions = await getDoctorPrescriptions(doctorId as string)
//   const reports = await getDoctorReports(doctorId as string)

//   return (
//     <PatientRecordsClient
//       doctor={doctor as any}
//       doctorId={doctorId as string}
//       userId={userId}
//       prescriptions={prescriptions as any}
//       reports={reports as any}
//     />
//   )
// }