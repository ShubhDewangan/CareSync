/* eslint-disable @typescript-eslint/no-explicit-any */
import { Doctor } from '@/types/appwrite'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from './button'
import { useState } from 'react'
import BookAppointmentModal from './BookAppointmentModal'
import { AuthUser, FullUser } from '@/context/UserContext'
import { showToast } from './toaster'

const DoctorCard = ({doctor, userId, patientId, authUser, fullUser}: {doctor: Doctor, userId: string, patientId: string, authUser: any, fullUser: any}) => {

    const [isOpen, setIsOpen] = useState(false)
    const [showtoast, setShowToast] = useState(false)

    if (showtoast) {
        if (!authUser) showToast('info','Please sign in to book Appointments! already have an account then log in','top-right')
        else if (authUser && !fullUser) showToast('info','Please log in to book Appointments!','top-right') 
    }

    if (isOpen) {
        return (
            <BookAppointmentModal DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId} patientId={patientId} authUser={authUser} fullUser={fullUser} />
        )
    }

  return (
    <div key={doctor.name} className='bg-[#EFECE3] w-full lg:w-[32%] rounded-2xl flex-1'>
        <header className='w-full flex gap-5 justify-between items-center border-[1px] border-gray-950 p-5 rounded-t-2xl'>
            <div className='w-full flex gap-5'>
                <div className='border-[1px] border-gray-950 rounded-full w-fit h-fit'>
                    <Image
                        src={doctor.profilePic || '/assets/images/user_default.webp'}
                        alt='profile pic'
                        height={1000}
                        width={1000}
                        className='min-h-20 min-w-20 h-20 w-20'
                        />
                </div>
                <div className='flex flex-col justify-between'>
                    <h2 className='font-heading1'>{doctor.name}</h2>
                    <div className='flex flex-col gap-2'>
                        <h3 className='text-[12px]'>{`${doctor.specialization} • ${doctor.experience}`}</h3>
                    <div className='flex text-[12px]'>
                        <span className='px-2  bg-[#8FABD4] border-[1px] border-gray-950 rounded-full'>{doctor.qualification}</span>
                    </div>
                    </div>
                </div>
            </div>
            <div className='flex flex-col justify-center items-center h-full w-[15%]'>
                <h1 className='font-semibold text-3xl'>{doctor.rating}</h1>
                <span>rating</span>
            </div>
        </header>
        <div className='main-div-doctor border-x-[1px] flex flex-col py-5 border-gray-950 gap-5'>
            <p className='text-[13px] px-5 line-clamp-3'>{doctor.about}</p>
            <div className='flex gap-2 px-3'>
                <div className='bg-[#fff] py-3 px-2 w-1/3 rounded-2xl border-[1px] border-gray-400 flex flex-col gap-1 justify-center'>
                    <span className='text-[12px]'>Consultation Fee</span>
                    <h4 className='font-semibold'>₹{doctor.consultationFee}</h4>
                </div>
                <div className='bg-[#fff] py-3 px-2 w-1/3 rounded-2xl border-[1px] border-gray-400 flex flex-col gap-1 justify-center'>
                    <span className='text-[12px]'>Total Patients</span>
                    <h4 className='font-semibold'>{doctor.totalPatients}</h4>
                </div>
                <div className='bg-[#fff] p-2 w-1/3 rounded-2xl border-[1px] border-gray-400 flex flex-col gap-1 justify-center'>
                    <span className='text-[12px]'>Appointment Span</span>
                    <h4 className='font-semibold'>{doctor.appointmentSpan}</h4>
                </div>
            </div>
            <div className='flex gap-1 flex-col mx-5'>
                <div className='flex justify-between items-center text-[13px]'>
                    <span>Hours:</span>
                    <span className='font-medium'>{doctor.consultationHours}</span>
                </div>
                <hr/>
                <div className='flex justify-between items-center text-[13px]'>
                    <span>Available:</span>
                    <span className='font-medium'>{doctor.availableDays.map((day) => ` • ${day}`)}</span>
                </div>
                <hr/>
                <div className='flex justify-between items-center text-[13px]'>
                    <span>Hospital/Clinic:</span>
                    <span className='font-medium'>{doctor.hospital}</span>
                </div>
                <hr/>
                <div className='flex justify-between items-center text-[13px]'>
                    <span>Phone:</span>
                    <span className='font-medium'>{doctor.phone}</span>
                </div>
            </div>
        </div>
            <footer className='p-5 flex justify-center items-center gap-5 border-[1px] border-[#203C67] rounded-b-2xl'>
                {
                    fullUser ? <BookAppointmentModal DateToday={new Date().toLocaleDateString()} doctor={doctor} userId={userId} fullUser={fullUser}  />  : <Button onClick={() => setShowToast(true)} variant='default' className='bg-[#203C67] border-[1px] border-gray-950 hover:bg-[#203c67ce] text-white px-4 py-3'>
                    Book Appointment
                    <Image
                        src='/assets/icons/arrow-top-right-white.svg'
                        alt="go to Doctor's Profile"
                        height={15}
                        width={15}
                    />  
                </Button>
                }
                <Link href={`/doctor/${doctor.name.replace(/\s+/g, '-')}`}>
                  <Button variant='ghost' className='border-[1px] border-[#203C67] hover:bg-[#203c671c] px-4 py-3'>
                      View Full Profile
                      <Image
                          src='/assets/icons/arrow-top-right.svg'
                          alt="go to Doctor's Profile"
                          height={15}
                          width={15}
                      />    
                  </Button>
                </Link>
            </footer>
    </div>
  )
}

export default DoctorCard
