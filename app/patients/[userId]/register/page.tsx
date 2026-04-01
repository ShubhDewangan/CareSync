import logo from '@/public/logo.png'
import Image from 'next/image'
import { RegisterForm } from '@/components/forms/RegisterForm'
import { getPatient, getUser } from '@/lib/actions/patient.actions'
import { redirect } from 'next/navigation'

const RegisterUser = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const  { userId } = await params
  const user = await getUser(userId)

  if (!user) {
    redirect('/')
  }

  const patient = await getPatient(userId)
  if (patient) redirect(`/patients/${userId}/dashboard`)

  return (
    <div className="flex h-screen max-h-screen overflow-y-hidden personal-bg-gradient-2">

      {/* LEFT — scrollable, 60% width */}
      <section className="flex-[0_0_70%] overflow-y-auto remove-scrollbar px-8 py-8 bg-[#f4f0f0] rounded-r-[40px] z-10">
      <Image
        src={logo}
        height={1000}
        width={1000}
        alt="Patient"
        className="mb-10 h-20 w-fit  left-5"
      />
        <div className="w-full max-w-[720px] mx-auto">

          <RegisterForm user={user} patient={patient ?? undefined}/>

            <p className="copyright py-12">© 2026 CareSync</p>
        </div>
      </section>

      {/* RIGHT — fixed image, 40% width */}
      <div className="flex-[0_0_30%] relative">
        <Image
          src='/register-bg.png'
          fill
          alt="Healthcare helps! Welcome"
          className="absolute w-[500px] bg-edit overflow-hidden"
        />
      </div>

    </div>
  )
}

export default RegisterUser
