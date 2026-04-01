/* eslint-disable @typescript-eslint/no-explicit-any */
import { Patient } from '@/types/appwrite'
import Image from 'next/image'
import SignOutButton from './signOutButton'
import Link from 'next/link'
const Sidebar = ({user, setOpenSignIn, setOpenLogin}:{user: Patient, setOpenSignIn : any, setOpenLogin: any }) => {
  return (
    <div className='max-w-[300px] bg-[#EFECE3]  w-[300px] ml-5 my-5 rounded-xl flex flex-col items-center drop-shadow-2xl drop-shadow-black z-10'>
      <header className='border-[1px] border-[#203C67] w-full rounded-t-2xl flex flex-col justify-center items-center'>
        <Image
          src='/logo.png'
          alt='logo'
          height={1000}
          width={1000}
          className='mt-2 h-20 w-fit'
        />

        {user ? ( <div className='flex flex-col justify-center items-center gap-2 w-full px-2 pb-5'>
          <div className='flex gap-2 items-center justify-center'>
            <Image
              src={user?.profilePic || '/assets/images/user_default.webp'}
              alt='profile pic'
              height={1000}
              width={1000}
              className='h-20 w-fit'
            />
            
            <div>
              <h2 className='text-[20px] font-semibold'>{user? user.name : ''}</h2>
              <h4 className='text-[12px]'>{user? user.email : ''}</h4>
            </div>
          </div>
          <div>
            {user?.registrationComplete ? (
              <Link href={`/patients/${user.$id}/dashboard`} className='bg-[#8FABD4] rounded-full px-3 py-2 border-[1px] border-[#848282]'>Your Dashboard</Link>
            ) : (
              <Link href={`/patients/${user.$id}/register`} className='bg-[#8FABD4] text-[13px] rounded-full py-1 px-2 border-[1px] border-[#848282]'>Complete Registration</Link>
            )}
          </div>
        </div>
        ) : (
          <div className='flex w-full items-center justify-center gap-3 px-5 pb-5'><Image
              src='/assets/images/user_default.webp'
              alt='profile pic'
              height={1000}
              width={1000}
              className='h-20 w-fit' 
            />
            <div className='flex flex-col gap-2 items-center justify-center'>
              <button onClick={() => setOpenSignIn(true)} className='bg-[#203C67] py-1 border-[1px] border-[#203C67] text-white rounded-2xl min-w-[130px]'>Sign In</button>
              <button onClick={() => setOpenLogin(true)} className='bg-transparent py-1 border-[1px] border-[#203C67] rounded-2xl min-w-[130px]'>Log In?</button>
            </div>
          </div>
        )}
      </header>
      <div className='border-x-[1px] border-[#203C67] w-full p-2'>
        <h3 className='mb-2'>MENU</h3>
        <div className='flex flex-col gap-2'>
          {/* <Link href={`/patients/${user?.$id}/dashboard`} className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>Your Dashboard</Link> */}
          <Link href={`/Doctors`} className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>Find Doctors</Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>Hospitals/Clinic</Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>Prescriptions</Link>
          <Link href='' className='bg-[#8FABD4] rounded-md px-3 py-2 border-[1px] border-[#848282]'>Medical Records</Link>
        </div>
      </div>

      <div className='border-[1px] border-[#203C67] w-full p-2'>
        <h3 className='mb-2'>QUICK STATS</h3>
        <div className='flex flex-col w-full gap-2'>
          <div className='flex gap-2'>
            <div className='bg-[#a9a5a5] flex-1 rounded-md p-2'>
              <span>Upcoming</span>
              <h3 className='text-blue-800 font-semibold'>2</h3>
              <span className='text-[13px]'>appointments</span>
            </div>
            <div className='bg-[#a9a5a5]  rounded-md p-5'>
              <span>Active</span>
              <h3 className='text-green-700 font-semibold'>3</h3>
              <span className='text-[13px]'>prescriptions</span>
            </div>
          </div>
          <div className='flex items-center justify-between  rounded-md p-5 bg-[#a9a5a5]'>
            <div>
              <span>Last visit</span>
              <h2 className='font-semibold'>Dr. John Green</h2>
            </div>
            <span>2 days ago</span>
          </div>
        </div>
      </div>

      <footer className='flex flex-1 flex-col w-full rounded-b-2xl justify-center items-center gap-2 p-2 border-b-[1px] border-x-[1px] border-[#203C67]'>
        <div className='w-full flex  justify-between px-5'>
          <div className='flex items-center justify-center text-gray-700'>
          <Image
            src='/assets/icons/settings.svg'
            alt='settings'
            height={30}
            width={30}
          />
          Settings
        </div>
        <SignOutButton/>
        </div>
        <span className='text-red-800'>Help? | How to Use!</span>
      </footer>
    </div>
  )
}

export default Sidebar
