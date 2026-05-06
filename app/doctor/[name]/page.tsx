/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAllDoctors, getDoctor, getDoctorByName } from '@/lib/actions/doctor.actions'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import StarRating from '@/components/ui/Rating'
import BookAppointmentModal from '@/components/ui/BookAppointmentModal'
import { AuthUser, FullUser } from '@/context/UserContext'
import { verifyJwt } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { div } from 'three/src/nodes/math/OperatorNode.js'
import { showToast } from '@/components/ui/toaster'
import { getPatient } from '@/lib/actions/patient.actions'

// ── Generate metadata for SEO ─────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name).replace(/-/g, ' ')
  
  
  return {
    title: `Dr. ${decodedName} — CareSync Profile`,
    description: `View the full professional profile of Dr. ${decodedName} on CareSync. Check qualifications, experience, availability, and book your appointment.`,
  }
}

// ── Static params for constant doctors ────────────────────────────
export async function generateStaticParams() {

  const Doctors = await getAllDoctors()

  return Doctors?.map((doc: any) => ({
    name: doc.name.replace(/\s+/g, '-'),
  }))
}

// ── Helper: build profile pic URL ─────────────────────────────────
function getProfilePic(doctor: any) {
  return doctor.profilePic || '/assets/images/user_default.webp'
}

// ── Helper: get initials ──────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  }
  
  // ── Page component ────────────────────────────────────────────────
  export default async function DoctorProfilePage({
    params,
  }: {
    params: Promise<{ name: string, userId: string }>
  }) {
    const { name } = await params
    const decodedName = decodeURIComponent(name).replace(/-/g, ' ')

    let userId: string | null = null
  let user: FullUser | null = null
  let userType: string | null = null
  let selfProfile = false

  const Doctors = await getAllDoctors()

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('caresync_token')?.value

    if (token) {
      const payload = await verifyJwt(token)
      if (payload) {
        userId = payload.userId
        console.log(userId, typeof userId)
        userType = payload.userType
        if (userType === 'patient') { user = await getPatient(userId) as FullUser }
        else if (userType === 'doctor') { user = await getDoctor(userId) as FullUser }
      }
    }
  } catch {
    // Not logged in — userId stays null
  }

// then after getPatient returns null:

  
  // console.log(userId, user)
  // Try static doctors first, then DB
  let doctor = Doctors.find(
    (d: any) => d.name.toLowerCase() === decodedName.toLowerCase()
  ) as any
  
  if (!doctor) {
    doctor = await getDoctorByName(decodedName)
  }
  
  if (!doctor) notFound()
    
  if (doctor.userId === userId) {
    selfProfile = true;
  }
  
    // Other doctors (exclude current)
    const otherDoctors = Doctors.filter(
      (d: any) => d.name.toLowerCase() !== decodedName.toLowerCase()
    ).slice(0, 4)
    
    const dayAbbreviations: Record<string, string> = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun',
    }
    
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    
  function calculateAge(birthDate: string) {
  const today = new Date();
  const [day, monthStr, year] = birthDate.split(" ");

  const monthMap: any = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const birth = new Date(
    Number(year),
    monthMap[monthStr],
    Number(day)
  );

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  console.log(user)

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return `${age} years`;
}

  return (
    <main className="drp-page overflow-hidden h-screen">
      {/* ── Navigation Bar ─────────────────────────────────────── */}
      <nav className="drp-nav py-3 px-10">
        <Link href='/'>
        <Image
          src={'/logo.png'}
          alt='logo'
          height={1000}
          width={1000}
          className='h-[45px] w-fit'
        /></Link>
        <div className='text-[20px] font-heading1 flex items-center gap-2'>
          {doctor?.hospitalLogo && <Image src={doctor.hospitalLogo} alt='hospital' width={1000} height={1000} className='h-10 w-10' />}
          <span>{doctor.hospital} / <span className='text-[15px]'>Dr.{doctor.name}</span></span>
        </div>
        {user ? <div className='flex gap-2 items-center'>
            <Image
              src={user?.profilePic ? user?.profilePic : '/assets/images/user_default.webp'}
              alt='profile picture'
              height={30}
              width={30}
              className='h-[45px] w-[45px] border border-[#3e3e3e] rounded-full p-1'
            />
            <div className='flex flex-col'>
              <span className='text-[14px] font-heading1'>{user.name}</span>
              <span className='text-[12px] tracking-wider font-mono'>{user.email}</span>
            </div>
          </div>:<div className='flex text-[12px] gap-3'>
          <Link className='px-5 py-3 border border-[#203C67] bg-[#8FABD4] hover:bg-[#203C67] transition-colors duration-300 hover:text-white rounded-full' href={'/signin'}>Get Started</Link>
          <Link className='px-5 py-3 hover:border border border-[gray] hover:border-[#203C67] hover:text-[#203C67] transition-colors duration-300 rounded-full' href={'/login'}>Log in</Link>
        </div>}
      </nav>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <div className='flex w-screen h-[calc(100vh-61px)] p-5 gap-5 overflow-hidden'>
        <div className='flex flex-col gap-5 max-w-[60%] overflow-y-auto remove-scrollbar h-full'>
          <div className='border border-[#203C67]/20 p-5 rounded-md flex justify-between gap-5'>
            <div className='flex gap-5'>
              <Image
              src={doctor.profilePic || '/assets/images/user_default.webp'}
              alt={doctor.name}
              height={1000}
              width={1000}
              className='roundedd-full h-[150px] w-fit'
            />
            <div className='flex flex-col gap-2'>
              <div className='flex flex-col gap-0.5'>
                <h1 className='font-label text-[25px] text-[#203C67]'>Dr.{doctor.name}</h1>
                <h1 className='font-label text-[15px] text-[#203C67]'>{doctor.specialization}</h1>
              </div>
              <div className='flex gap-5 text-gray-600 text-[13px] items-center'>
                <div className='flex gap-2 items-center'>
                  <StarRating rating={doctor.rating}/>
                {doctor.rating}</div> 
                <span>•</span> 
                <span className='flex gap-2'><span className='font-semibold text-gray-700'>{doctor.totalusers}</span>patients</span>
                {doctor.gender === 'female' ? <span className='bg-[#9a2240] text-white rounded-full px-3 py-1'>{doctor.gender}</span> : <span className='bg-[#203C67] text-white rounded-full px-3 py-1'>{doctor.gender}</span>}

              </div>
              <p className='text-[13px] text-gray-700'>
                {doctor.about}
              </p>
            </div>
            </div>
            <div className='flex flex-col gap-3'>
              <span className='flex gap-1 text-[14px] text-nowrap border border-[#4A70A9] px-3 py-2 rounded-full font-label'>Consultation Fee:<span>₹{doctor.consultationFee}</span></span>
              <span className='flex gap-1 text-[14px] text-nowrap border border-[#4A70A9] px-3 py-2 rounded-full font-label'>Appointment Span:<span>₹{doctor.appointmentSpan}</span></span>
              {selfProfile ? <BookAppointmentModal text='Book Appointment' variant='block' DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} falseButton={true} />:<BookAppointmentModal text='Book Appointment' variant='block' DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser}/>}
            </div>
          </div>

        {/* ── Stats Strip ────────────────────────────────────────── */}
          <section className='flex gap-5'>
            <div className='border w-1/2 border-[#203C67]/20 p-5 h-auto rounded-md flex flex-col gap-5'>
              <h2 className='text-xl text-[#203C67] font-label'>Personal</h2>

              <div className='flex flex-col gap-3'>
                <div className='flex justify-between w-full text-sm items-center'><span className='text-gray-700'>Birth Date</span><span className='text-gray-950'>{doctor.birthDate}</span></div>
                <div className='flex justify-between w-full text-sm items-center'><span className='text-gray-700'>Age</span><span className='text-gray-950'>{calculateAge(doctor.birthDate)}</span></div>
                <div className='flex justify-between w-full text-sm items-center'><span className='text-gray-700'>Languages</span><div className='flex gap-2'>{doctor.languages.map((language: any) => <span key={language} className='text-gray-950 bg-[#8FABD4] rounded-full px-3 py-1'>{language}</span>)}</div></div>
              </div>
            </div>
            <div className='border w-1/2 border-[#203C67]/20 p-5 max-w-[60%] h-auto rounded-md flex flex-col gap-5'>
              <h2 className='text-xl text-[#203C67] font-label'>Professional</h2>
              <div className='flex flex-col gap-3'>
                <div className='flex justify-between w-full text-sm items-center'>
                  <span className='text-gray-700'>Experience</span>
                  <span className='text-gray-950'>{doctor.experience}</span>
                </div>
                <div className='flex justify-between w-full text-sm items-center'>
                  <span className='text-gray-700'>Qualifications</span>
                  <span className='text-gray-950'>{doctor.qualification}</span>
                </div>
                <div className='flex flex-col justify-between w-full text-sm'>
                  <span className='text-gray-700'>Primary Clinic</span>
                  <div className='mt-2 flex flex-col'>
                    <span className='text-gray-950 font-medium'>{doctor.hospital}</span>
                  <span className='text-gray-700'>{doctor.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className='border border-[#203C67]/20 p-5 h-auto rounded-md flex flex-col gap-5'>
              <h2 className='text-xl text-[#203C67] font-label'>Availability</h2>

              <div className='flex flex-col gap-5'>
                <div className='w-full text-sm flex flex-col gap-2'>
                  <span className='text-gray-700'>Avaialble Days</span>
                  <div className='text-gray-950 flex gap-2 flex-wrap cursor-default'>{
                    allDays.map((day) => {
                      const isAvailable: boolean = doctor.availableDays.includes(day);

                      return (
                        <span key={day} className={`px-3 py-1 rounded-full text-sm   font-mono ${isAvailable ? 'bg-[#8FABD4] hover:bg-[#203C67] transition-colors duration-400 border-1 border-[#203C67] hover:text-[#EFECE3]': 'bg-gray-100/50 text-gray-500'}`}>
                          {day}
                        </span>
                      )
                    })  
                  }</div>
                </div>
                <div className='flex justify-between w-full text-sm items-center'><span className='text-gray-700'>Consultation Hours</span><span className='text-gray-950 flex gap-2'>{doctor.consultationHours}<span>(timezone: IST)</span></span></div>
                <div className='flex gap-2 w-full text-sm items-center'>
                    <span className='text-gray-700'>Typical slot:</span>
                    <span className='text-gray-950'>{doctor.appointmentSpan}</span>
                    <span>•</span>
                    <span className='text-gray-700'>Next Appointment slot:</span>
                    <span className='text-gray-950'><i>not available for now</i></span>
                </div>
                
              </div>
            </div>
          </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
          <footer className="drp-footer text-xs">
            <p>© {new Date().getFullYear()} CareSync — Built by Shubh Dewangan</p>
          </footer>
        {/* ── Content Grid ───────────────────────────────────────── */}

        </div>

        {/* Right Column */}
        <div className='flex-1 flex flex-col gap-5 overflow-y-auto remove-scrollbar h-full'>
          <div className='border w-full border-[#203C67] bg-[#E1D7BC] rounded-md flex flex-col gap-5 p-5'>
            <div className='flex justify-between'>
              <div className='flex flex-col gap-1'>
                <span className='text-xl text-[#203C67] font-label'>Quick Contact</span>
                <span className='text-sm text-[#203C67] font-mono tracking-[0.1px]'>Reach the clinic or the doctor&apos;s assistant</span>
              </div>
              <Image
                src='/assets/icons/phone.svg'
                alt='call'
                height={30}
                width={30}
              />
            </div>

            <div className='flex justify-between items-center'>
              <div className='flex flex-col'>
                <span className='font-label text-[#203C67]/70 text-md tracking-tighter'>Clinic Phone</span>
                <span className='font-sans text-[#203C67] text-sm'>{doctor.phone}</span>
              </div>
              <span>
                <button className='bg-[#203C67] rounded-full px-3 py-1 active:scale-105 text-[#EFECE3] border border-[#203C67]'>Call</button>
              </span>
            </div>
            
            <div className='flex justify-between items-center'>
              <div className='flex flex-col'>
                <span className='tracking-tighter font-label text-[#203C67]/70 text-md'>Email</span>
                <span className='font-sans text-[#203C67] text-sm'>{doctor.email}</span>
              </div>
              <span>
                <button className='border border-[#203C67] rounded-full px-3 py-1 active:scale-105 text-[#203C67]'>Mail</button>
              </span>
            </div>

            <div className='border border-[#203C67] flex items-center justify-center rounded-full'>
              {selfProfile? <BookAppointmentModal variant='ghost' text='Book Appointment' DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser} falseButton={true} />:<BookAppointmentModal variant='ghost' text='Book Appointment' DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor} userId={userId as string} fullUser={user as unknown as FullUser}/>}
            </div>
          </div>

          <div className='border border-[#203C67]/20 p-5 h-auto rounded-md flex flex-col justify-between gap-5'>
            <div className='flex flex-col gap-1'>
              <span className='text-lg tracking-tighter text-[#203C67] font-label'>Clinic Details</span>
              <span className='text-sm text-[#203C67] font-mono tracking-[0.1px]'>{doctor.hospital}</span>
            </div>

            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(doctor.address)}&output=embed`}
              width="100%"
              height="300"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen
              loading="lazy"
            />

            <div className='w-full justify-between flex items-center'>
              <p className='text-gray-700 text-sm'>{doctor.address}</p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 px-4 py-2 hover:bg-[#203C67] text-[#203C67] hover:text-white text-[13px] rounded-full border border-[#203C67] transition-colors">
              <Image src="/assets/icons/map.svg" alt="" width={14} height={14} />
              Get Directions
            </a>
            </div>

            <div className='flex flex-col gap-2'>
              <span className='text-gray-700 text-sm'>Consultation Hours</span>
              <div className='flex flex-wrap text-md font-mono tracking-tighter gap-2 items-center justify-center'>
                {doctor.availableDays.map((days: any) => <div className='bg-[#8FABD4] rounded-full border border-[#203C67] px-2 flex gap-1' key={days}>
                <span className='text-gray-600'>{days}</span>
                <span className='text-gray-800'>•</span>
                <span className='text-gray-800'>{doctor.consultationHours}</span>
              </div>)}
              </div>
            </div>

            
          </div>
        </div>
      </div>
        
    </main>
  )
}
