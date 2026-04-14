// app/(protected)/doctors/[userId]/dashboard/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getDoctor } from "@/lib/actions/doctor.actions"
import { redirect } from "next/navigation"

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

  return (
    <div>
      {/* Your doctor dashboard UI here */}
      <h1>Welcome Dr. {doctor.name}</h1>
    </div>
  )
}