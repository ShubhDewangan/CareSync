import Link from 'next/link'
import React from 'react'
import Image from 'next/image'
import { getAppointment } from '@/lib/actions/appointment.actions'
import { getUser } from '@/lib/actions/patient.actions'
import { Doctors } from '@/constants'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const Success = async ({ params, searchParams }: SearchParamProps) => {
    const { userId } = await params
    // const { appointmentId } = await searchParams
      
    const resolvedSearchParams = await searchParams
    const appointmentId = (resolvedSearchParams?.appointmentId as string) || ''
    const appointment = await getAppointment(appointmentId)
    if (!appointment) return <div>Appointment not found</div>
    const doctor = Doctors.find((doc) => doc.name === appointment.primaryPhysician)

    console.log('Success page loaded')

  return (
    <div className='flex h-screen max-h-screen px-[5%] overflow-hidden'>
      <div className='success-img'>
        <Link href='/'>
            <Image
                src='/logo.png'
                height={500}
                width={500}
                alt='logo'
                className='h-13 w-fit'
            />
        </Link>

        <section className='flex flex-col items-center'>
            <Image
                src='/assets/gifs/success.gif'
                alt='success'
                height={300}
                width={280}
            />
        <h2 className='header mb-6 max-w-[600px] text-center'>
            Your <span className='text-green-400'>Appointment Request</span> has been successfully submitted!
        </h2>

        <div className='rounded-full py-3 px-5 bg-red-600'>
            <p><i>Stay Connected! we&apos;ll be in touch shortly to confirm your appointment.</i></p>
        </div>
        </section>

        <section className='request-details'>
            <p>Requested appointed details:</p>
            <div className='flex items-center gap-3'>
                <Image
                    src={doctor?.image ?? '/assets/icons/user.svg'}
                    alt='doctor'
                    width={100}
                    height={100}
                    className='size-6'
                />
                <p>{doctor?.name}</p>
            </div>
            <div className='flex items-center gap-3'>
                <Image
                    src='/assets/icons/calendar.svg'
                    alt='calender'
                    height={24}
                    width={24}
                />
                <p>{formatDateTime(appointment.schedule).dateTime}</p>
            </div>
        </section>
        <div className='-translate-y-2 flex items-center justify-center gap-5'>
            <Button variant='outline' className='shad-primary-btn ' asChild>
                <Link href={`/patients/${userId}/new-appointment`}>
                    + Add another Appointment
                </Link>
            </Button>  
            <Button variant='ghost' className='shad-ghost-btn'>
                <Link href={`/patients/${userId}/dashboard`}>
                    Dashboard →
                </Link>    
            </Button>  
        </div>      
        <p className="copyright">© 2026 CareSync</p>
      </div>
    </div>
  )
}

export default Success


