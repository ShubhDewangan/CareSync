import Image from 'next/image'
import logo from '@/public/logo.png'
import HealthcarePhoto from '@/public/fotos-8hQ1SyLwqPA-unsplash.jpg'
import { Button } from "@/components/ui/button";
import LoginForm from '@/components/forms/LoginForm';
import Link from 'next/link';
import PasskeyModal from '@/components/ui/PasskeyModal';

export default async function Home() {
  return (
    <div className="flex h-screen max-h-screen overflow-hidden personal-bg-gradient-1 justify-between">
      
      <div className='flex flex-col'>
        <Image
        src='/image.png'
        alt='route'
        height={1000}
        width={1000}
        className=' h-[390px] w-[330px]'
      />
      <Image
        src='/login-photo.png'
        alt='thumbnail'
        height={1000}
        width={1000}
        className=' h-[403px] w-[379px]'
      />
      </div>
      <section className="remove-scrollbar container bg-[#f4f0f0] rounded-l-[75px]">
        <div className="sub-container max-w-[60%]">
          <Image
            src={logo}
            height={1000}
            width={1000}
            alt='Patient'
            className='absolute top-5 left-5 mb-12 h-[70px] w-fit align-middle'
          />

          <LoginForm/>

          <div className='text-14-regular mt-5 translate-x-5 flex flex-col justify-center items-center gap-2'>
            <div className='flex justify-between items-center w-full'>
              <Link href='/' className='text-gray-700 font-sans font-semibold'>
              Sign in?
            </Link>
            </div>
            <p className='copyright text-center  xl:text-left'>
              © 2026 CareSync
            </p>
          </div>
        </div>
      </section>
      {/* <div className='max-w-[50%] p-20'>
        <Image
        src={HealthcarePhoto}
        height={1000}
        width={1000}
        alt='Healthcare helps! Welcome'
        className='side-img object-cover rounded-2xl overflow-hidden'
      />
      </div> */}
    </div>
  );
}
