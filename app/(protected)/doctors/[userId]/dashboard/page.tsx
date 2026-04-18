// app/(protected)/doctors/[userId]/dashboard/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getDoctor } from "@/lib/actions/doctor.actions"
import { redirect } from "next/navigation"
import DoctorDashboardClient from "@/components/ui/doctor/DoctorDashboardPage"

export default async function DoctorDashboardPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const authUser = await getLoggedInUser()
  const { userId } = await params

  if (!authUser || authUser.$id !== userId) redirect("/")

  if (authUser.userType !== "doctor") {
    redirect(`/patients/${authUser.$id}/dashboard`)
  }

  const doctor = await getDoctor(userId)

  if (!doctor) redirect(`/doctors/${userId}/register`)

  return <DoctorDashboardClient doctor={doctor} user={authUser} appointments={[]} />
}