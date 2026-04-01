import Image from 'next/image'
import logo from '@/public/logo.png'
import HealthcarePhoto from '@/public/fotos-8hQ1SyLwqPA-unsplash.jpg'
import { Button } from "@/components/ui/button";
import {PatientForm} from '@/components/forms/SignUpForm';
import Link from 'next/link';
import AppointmentForm from '@/components/forms/AppointmentForm';
import { getPatient } from '@/lib/actions/patient.actions';
import { redirect } from 'next/navigation';

const NewAppointment = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const  { userId } = await params
    const patient = await getPatient(userId)

    console.log('patient result:', patient) // ← check terminal output
if (!patient) redirect(`/patients/${userId}/register`)
  return (
    <div className="flex h-screen max-h-screen">

      <section className="remove-scrollbar container my-auto">
        <div className="sub-container max-w-[496px] flex-1 justify-between">
          <Image
            src={logo}
            height={1000}
            width={1000}
            alt='Patient'
            className='mb-12 h-22 w-fit align-middle'
          />

          <AppointmentForm type='create' userId={userId} patientId={patient.$id}/>

          <div className='text-14-regular mt-20 -translate-y-3 flex justify-between'>
            <p className='copyright justify-items-end text-dark-600 xl:text-left'>
              © 2026 CareSync
            </p>
          </div>
        </div>
      </section>
      <div className='max-w-[50%] p-20'>
        <Image
        src='/assets/images/appointment-img.png'
        height={1000}
        width={1000}
        alt='Healthcare helps! Welcome'
        className='side-img object-cover rounded-2xl overflow-hidden'
      />
      </div>
    </div>
  );
}

export default NewAppointment