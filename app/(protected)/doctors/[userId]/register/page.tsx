// app/(protected)/doctors/[userId]/register/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { getDoctor } from "@/lib/actions/doctor.actions"
import { redirect } from "next/navigation"
import { RegisterFormDoctor } from "./RegisterFormDoctor"

export default async function DoctorRegisterPage({
  params,
}: {
  params: Promise<{userId: string}>
}) {
  const { userId } = await params
  const authUser = await getLoggedInUser()

  if (!authUser || authUser.$id !== userId) redirect("/");

  if (authUser.userType !== "doctor") {
    redirect(`/patients/${authUser.$id}/register`)
  }

  // Already registered → send to dashboard
  const doctor = await getDoctor(userId)
  if (doctor) redirect(`/doctors/${userId}/dashboard`)

  return (
    <div>
      <RegisterFormDoctor user={authUser} />
    </div>
  )
}