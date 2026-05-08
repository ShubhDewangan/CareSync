/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import BookAppointmentModal from "@/components/ui/BookAppointmentModal"
import { FullUser } from "@/context/UserContext"
import { Doctor } from "@/types/appwrite"

interface SidebarData {
  doctor: Doctor & { [key: string]: any }
  userId: string
  user: FullUser
  selfProfile: boolean
}

export default function DoctorProfileMobileSidebar({
  data,
  user,
}: {
  data: SidebarData
  user: FullUser | null
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { doctor, userId, selfProfile } = data

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  const sidebar = (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Slide-over panel */}
      <div className={`
        fixed top-0 right-0 h-screen z-[210] w-[85vw] max-w-[340px]
        bg-[#EFECE3] flex flex-col
        transform transition-transform duration-300 ease-in-out
        overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        lg:hidden
        ${open ? "translate-x-0" : "translate-x-full"}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#E1D7BC]/70 border-b border-white/60 flex-shrink-0">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-white/55 border border-white/85 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
                <path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2z" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <span className="text-[14px] font-semibold text-[#203C67]">CareSync</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/50 border border-white/85 hover:bg-white/70 transition-colors"
            aria-label="Close"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* User info */}
        {user ? (
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/50 bg-white/10 flex-shrink-0">
            <Image
              src={user.profilePic || '/assets/images/user_default.webp'}
              alt="profile" height={38} width={38}
              className="h-9 w-9 rounded-full border border-white/85 object-cover flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-[#1c1c1c] truncate">{user.name}</span>
              <span className="text-[10.5px] font-mono text-[#aaa] truncate">{user.email}</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5 px-4 py-3.5 border-b border-white/50 flex-shrink-0">
            <Link
              className="flex-1 text-center text-[12px] px-4 py-2 bg-[#203C67] text-white rounded-full hover:opacity-90 transition-opacity"
              href="/signin" onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
            <Link
              className="flex-1 text-center text-[12px] px-4 py-2 bg-white/50 border border-white/85 text-[#203C67] rounded-full hover:bg-white/70 transition-colors"
              href="/login" onClick={() => setOpen(false)}
            >
              Log in
            </Link>
          </div>
        )}

        {/* Cards */}
        <div className="flex flex-col gap-3 p-4">

          {/* Quick Contact */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[13px] font-semibold text-[#203C67]">Quick Contact</p>
                <p className="text-[11px] text-[#aaa] mt-0.5">Reach the clinic or assistant</p>
              </div>
              <div className="w-7 h-7 rounded-[8px] bg-white/70 border border-white/90 flex items-center justify-center flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="1.8">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.9.5 2.9.7A2 2 0 0 1 22 16.9z" />
                </svg>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="bg-white/55 border border-white/90 rounded-xl px-3.5 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-[#aaa] mb-0.5">Clinic Phone</p>
                  <p className="text-[12.5px] text-[#1c1c1c] font-medium">{doctor.phone}</p>
                </div>
                <button className="bg-[#203C67] text-white text-[11.5px] font-medium px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                  Call
                </button>
              </div>
              <div className="bg-white/55 border border-white/90 rounded-xl px-3.5 py-2.5 flex justify-between items-center">
                <div>
                  <p className="text-[11px] text-[#aaa] mb-0.5">Email</p>
                  <p className="text-[12.5px] text-[#1c1c1c] font-medium truncate max-w-[170px]">{doctor.email}</p>
                </div>
                <button className="border border-[#203C67]/25 text-[#203C67] text-[11.5px] px-4 py-1.5 rounded-full hover:bg-white/50 transition-colors">
                  Mail
                </button>
              </div>
            </div>

            <div className="bg-white/60 border border-white/90 rounded-full flex items-center justify-center">
              {selfProfile
                ? <BookAppointmentModal variant="ghost" text="Book Appointment" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor as any} userId={userId} fullUser={user as unknown as FullUser} falseButton={true} />
                : <BookAppointmentModal variant="ghost" text="Book Appointment" DateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" })} doctor={doctor as any} userId={userId} fullUser={user as unknown as FullUser} />}
            </div>
          </div>

          {/* Clinic Details */}
          <div className="bg-white/50 border border-white/85 rounded-2xl p-4 flex flex-col gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#203C67]">Clinic Details</p>
              <p className="text-[11px] text-[#aaa] mt-0.5">{doctor.hospital}</p>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/70">
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(doctor.address)}&output=embed`}
                width="100%" height="180"
                style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy"
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <p className="text-[12px] text-[#666] leading-relaxed">{doctor.address}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(doctor.address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[#203C67] text-[11px] rounded-full border border-[#203C67]/20 hover:bg-[#203C67] hover:text-white transition-colors whitespace-nowrap"
              >
                <Image src="/assets/icons/map.svg" alt="" width={10} height={10} />
                Directions
              </a>
            </div>

            <div className="flex flex-col gap-2 pt-2.5 border-t border-black/[0.04]">
              <p className="text-[11px] text-[#aaa]">Consultation Hours</p>
              <div className="flex flex-wrap gap-1.5">
                {doctor.availableDays?.map((day: string) => (
                  <div
                    key={day}
                    className="bg-[#C8D8EA] border border-[#C8D8EA]/50 rounded-full px-2.5 py-1 flex items-center gap-1.5 text-[10.5px]"
                  >
                    <span className="font-medium text-[#203C67]">{day.slice(0, 3)}</span>
                    <span className="text-[#203C67]/25">•</span>
                    <span className="text-[#3a5a8a]">{doctor.consultationHours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/50 border border-white/85 hover:bg-white/70 transition-colors"
        aria-label="Open menu"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Portal — renders directly on document.body, escapes all stacking contexts */}
      {mounted && createPortal(sidebar, document.body)}
    </>
  )
}