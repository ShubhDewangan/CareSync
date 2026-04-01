/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Image from 'next/image'
import { SignUpForm } from '@/components/forms/SignUpForm';
import Sidebar from '@/components/ui/Sidebar';
import { Input } from '@/components/ui/input';
import neuroImg from '../public/assets/images/neuro_icon_temp.png'
import dermaImg from '../public/assets/images/derma_icon_temp.png'
import dentistImg from '../public/assets/images/dentist_icon_temp.png'
import surgeonImg from '../public/assets/images/surgeon_icon_temp.png'
import psyImg from '../public/assets/images/psychiatrist_icon_temp.png'
import gynaeImg from '../public/assets/images/gynae_icon_temp.png'
import pediaImg from '../public/assets/images/pedia_icon_temp.png'
import CategoryScroll from '@/components/ui/CategoryScroll';
import { Doctors } from '@/constants';
import DoctorCard from '@/components/ui/DoctorCard';
import { Suspense, useEffect, useState } from 'react';
import LoginForm from '@/components/forms/LoginForm';
import { Patient } from '@/types/appwrite';

// ✅ Import the SERVER ACTION — NOT the browser SDK
import { getLoggedInUser } from '@/lib/actions/auth.actions';
import { useSearchParams } from 'next/navigation'

const categories = [
  { tag: 'Neurologist', image: neuroImg },
  { tag: 'Gynaelogist', image: gynaeImg },
  { tag: 'Dentist', image: dentistImg },
  { tag: 'Dermalogist', image: dermaImg },
  { tag: 'Surgeon', image: surgeonImg },
  { tag: 'Psychiatrist', image: psyImg },
  { tag: 'Pediatrician', image: pediaImg },
]

function Home() {
  const [openSignIn, setOpenSignIn] = useState(false)
  const [openLogin, setOpenLogin] = useState(false)
  const [user, setUser] = useState<any>(null)


// inside Home component, add this:
const searchParams = useSearchParams()

useEffect(() => {
  if (searchParams.get('login') === 'true') {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenLogin(true)
  }
}, [searchParams])// ✅ re-runs when URL params change

  return (
    <div className="flex h-screen max-h-screen bg-[#EFECE3]">

      <Sidebar user={user as unknown as Patient} setOpenSignIn={setOpenSignIn} setOpenLogin={setOpenLogin} />

      <section className='flex-1 justify-center overflow-x-auto remove-scrollbar'>
        <div className='flex justify-between items-center p-5'>
          <div className='flex bg-[#8FABD4] rounded-full w-[600px] px-3 border-[1px] border-[#203C67]'>
            <Image src='/assets/icons/hamburger.svg' alt='hamburger' height={24} width={24} className='cursor-pointer' />
            <Input placeholder='Search for Doctors | Clinics ...' className='border-none text-white' />
            <Image src='/assets/icons/search.svg' alt='search' height={20} width={20} className='cursor-pointer' />
          </div>
          <div className='bg-gray-400 px-2 rounded-full'>theme changer button</div>
        </div>

        <div className='flex justify-center w-full text-center'>
          <p className='w-[80%] p-10 text-sm text-gray-600'>
            <i>This Project is made by Shubh Dewangan to make the appointment process helpful and clean for patients, also accessible by themselves <span className='text-[#297EFF]'>no need to rely on others</span>, makes the process much easy because <span className='text-[#297EFF]'>this website asks patients every document(s) at once 😉.</span></i>
          </p>
        </div>

        <div className='w-full flex flex-col gap-3 text-semibold justify-center text-center'>
          <div className='flex flex-col gap-3'>
            <h3>There are many Doctors helping us in these categories given below...</h3>
            <h3><i>{`{ Select one to see the every doctor in the respective category! }`}</i></h3>
          </div>
          <CategoryScroll categories={categories} />
        </div>

        <div className='bg-[#8FABD4] h-auto w-[95%] flex p-5 gap-5 rounded-2xl mt-5 flex-wrap items-center justify-center mx-auto mb-5 border-[4px] border-[#203C67]'>
          {Doctors.map((doctor, idx) => (
            <DoctorCard doctor={doctor} key={idx} />
          ))}
        </div>
      </section>

      {openSignIn && (
        <div
          className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center"
          onClick={() => setOpenSignIn(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#EFECE3] border-[6px] border-[#203C67] rounded-2xl shadow-xl p-6 h-auto w-[50vw] overflow-y-auto overflow-x-hidden remove-scrollbar"
          >
            <button onClick={() => setOpenSignIn(false)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-900 text-xl font-bold">✕</button>
            <SignUpForm
              setOpenLogin={setOpenLogin}
              onClose={() => setOpenSignIn(false)}
              // ✅ Update user state after signup so Sidebar reflects it immediately
              onSuccess={(userData: any) => {
                setUser(userData)
                setOpenSignIn(false)
              }}
            />
          </div>
        </div>
      )}

      {openLogin && (
        <div
          className="fixed inset-0 bg-black/50 z-20 flex items-center justify-center"
          onClick={() => setOpenLogin(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-[#EFECE3] border-[6px] border-[#203C67] rounded-2xl shadow-xl p-6 h-auto w-[50vw] overflow-y-auto overflow-x-hidden remove-scrollbar"
          >
            <button onClick={() => setOpenLogin(false)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-900 text-xl font-bold">✕</button>
            <LoginForm
              setUser={setUser}
              setOpenSignIn={setOpenSignIn}
              onClose={() => setOpenLogin(false)}
              // ✅ Update user state after login so Sidebar reflects it immediately
              onSuccess={(userData: any) => {
                setUser(userData)
                setOpenLogin(false)
              }}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}