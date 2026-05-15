/* eslint-disable @typescript-eslint/no-explicit-any */
import { Doctor } from '@/types/appwrite'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from './button'
import { useState } from 'react'
import BookAppointmentModal from './BookAppointmentModal'
import { showToast } from './toaster'

const DoctorCard = ({ doctor, userId, patientId, authUser, fullUser }: {
  doctor: Doctor
  userId: string
  patientId: string
  authUser: any
  fullUser: any
}) => {
  const [showtoast, setShowToast] = useState(false)

  if (showtoast) {
    if (!authUser) showToast('info', 'Please sign in to book appointments!', 'top-right')
    else if (authUser && !fullUser) showToast('info', 'Please complete your profile to book!', 'top-right')
  }

  return (
    <div className="bg-[#EFECE3] w-full rounded-2xl border-[1.5px] border-[#203C67] flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex gap-4 justify-between items-start p-5 border-b-[1px] border-[#203C6730] bg-white/50">
        <div className="flex gap-4 flex-1 min-w-0">
          {/* Avatar — clipped circle */}
          <div className="w-[72px] h-[72px] rounded-full border-[1.5px] border-[#203C67] overflow-hidden flex-shrink-0 bg-[#EEF3FA]">
            <Image
              src={doctor.profilePic || '/assets/images/user_default.webp'}
              alt={doctor.name}
              height={72}
              width={72}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-0 justify-center">
            <h2 className="font-semibold text-[#203C67] text-[15px] leading-tight">
              Dr. {doctor.name}
            </h2>
            <p className="text-[12px] text-gray-500 leading-snug">
              {doctor.specialization?.join(", ")}
              {doctor.experience ? ` • ${doctor.experience}` : ""}
            </p>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(doctor.qualification)
                ? doctor.qualification
                : [doctor.qualification]
              ).slice(0, 2).map((q: string) => (
                <span key={q} className="text-[10px] font-semibold px-2 py-0.5 bg-[#8FABD4] border-[1px] border-[#203C6750] text-[#203C67] rounded-full">
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Rating */}
        {doctor.rating ? (
          <div className="flex flex-col items-center flex-shrink-0 pt-1">
            <span className="text-[22px] font-bold text-[#203C67] leading-none">{doctor.rating}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">rating</span>
          </div>
        ) : null}
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col gap-4 p-5 flex-1">

        {/* About */}
        {doctor.about && (
          <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-3">
            {doctor.about}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Consultation Fee", value: `₹${doctor.consultationFee}` },
            { label: "Total Patients",   value: doctor.totalPatients ?? "—"  },
            { label: "Appt. Duration",   value: doctor.appointmentSpan || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/50 rounded-xl border-[1px] border-gray-200 p-3 flex flex-col gap-1">
              <span className="text-[10px] text-gray-400 leading-tight">{label}</span>
              <span className="text-[13px] font-bold text-[#203C67]">{value}</span>
            </div>
          ))}
        </div>

        {/* Info rows */}
        <div className="flex flex-col divide-y divide-[#203C6712]">
          {[
            { label: "Hours",          value: doctor.consultationHours },
            { label: "Available",      value: doctor.availableDays?.map((d: string) => `• ${d}`).join(" ") },
            { label: "Hospital/Clinic",value: doctor.hospital },
            { label: "Phone",          value: doctor.phone },
          ].filter(r => r.value).map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-3 py-2">
              <span className="text-[11px] text-gray-400 flex-shrink-0">{label}:</span>
              <span className="text-[11px] font-medium text-gray-700 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="flex gap-2 p-4 border-t-[1px] border-[#203C6730] bg-white/50">
        {fullUser ? (
          <BookAppointmentModal
            DateToday={new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
            doctor={doctor}
            userId={userId}
            fullUser={fullUser}
            authUser={authUser}
            falseButton={authUser?.userType === "doctor"}
          />
        ) : (
          <button
            onClick={() => setShowToast(true)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-[#203C67] hover:bg-[#162d50] text-white text-[12px] font-semibold rounded-xl transition-colors cursor-pointer border-[1px] border-gray-950"
          >
            Book Appointment
            <Image src="/assets/icons/arrow-top-right-white.svg" alt="book" height={13} width={13} />
          </button>
        )}

        <Link
          href={`/doctor/${doctor.name.replace(/\s+/g, '-')}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-4 border-[1px] border-[#203C67] text-[#203C67] hover:bg-[#203c671c] text-[12px] font-semibold rounded-xl transition-colors"
        >
          View Full Profile
          <Image src="/assets/icons/arrow-top-right.svg" alt="profile" height={13} width={13} />
        </Link>
      </footer>
    </div>
  )
}

export default DoctorCard