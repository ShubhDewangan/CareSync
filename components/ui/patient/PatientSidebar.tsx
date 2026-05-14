/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import EditDetailsModal from "@/components/ui/EditDetailsModal"
import BookAppointmentModal from "@/components/ui/BookAppointmentModal"
import DashboardBookButton from "../DashboardBookButton"

interface PatientSidebarProps {
  patient: any
  userId: string
  authUser: any
  stats: { upcoming: number }
  prescriptions: any[]
  recentActivity: any[]
  activeNav?: string
}

export default function PatientSidebar({
  patient, userId, authUser, stats, prescriptions, recentActivity, activeNav = "overview",
}: PatientSidebarProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  function statusDot(status: string) {
    switch (status) {
      case "scheduled": return "bg-[#3B8C4B]"
      case "pending":   return "bg-[#D4A017]"
      case "cancelled": return "bg-[#C0392B]"
      default:          return "bg-[#185FA5]"
    }
  }

  const navItems = [
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
      label: "Overview",
      href: `/patients/${userId}/dashboard`,
      key: "overview",
    },
    // {
    //   icon: (
    //     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    //       <rect x="3" y="4" width="18" height="18" rx="2"/>
    //       <path d="M16 2v4M8 2v4M3 10h18"/>
    //     </svg>
    //   ),
    //   label: "Appointments",
    //   href: `/patients/${userId}/appointments`,
    //   key: "appointments",
    // },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: "Find Doctors",
      href: "/doctors",
      key: "doctors",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
      label: "Medical Records",
      href: `/patients/${userId}/records`,
      key: "records",
    },
    {
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      label: "Home",
      href: "/",
      key: "home",
    },
  ]

  // ─── Sidebar content (shared between mobile drawer + desktop) ───────────────
  const SidebarInner = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Logo row ── */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <Image src={'/logo.png'} alt='logo' width={1000} height={1000} className='h-10 w-fit' />
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#e2ddd4] text-[#5a6a7e] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Profile card ── */}
      <div className="flex flex-col items-center justify-center mb-5">
        <div style={{ position: "relative" }}>
          <Image
            src={patient?.profilePic || '/assets/images/user_default.webp'}
            alt="profile"
            height={200} width={200}
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(32,60,103,0.2)" }}
          />
        {/* Online dot */}
        <div style={{
          position: "absolute", bottom: 2, right: 2,
          width: 12, height: 12, borderRadius: "50%",
          background: "#4ade80", border: "2px solid #edeae4",
        }} />
      </div>
      <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2e10", margin: 0 }}>{authUser.name}</p>
              <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {authUser.email}
              </p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                  background: "#A6BAD7", color: "#203C67", border: "1px solid rgba(32,60,103,0.2)",
                }}>
                  {authUser.userType === "doctor" ? "Doctor" : "Patient"}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                  background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                }}>
                  Active
                </span>
              </div>
            </div>
      </div>

      {/* ── Book Appointment — uses BookAppointmentModal directly, no doctor required ── */}
      {/* <div className="mb-3 shrink-0" onClick={() => onClose?.()}>
        <DashboardBookButton
          variant="sidebar"
          text="Book Appointment"
          dateToday={new Date().toLocaleDateString(undefined, { timeZone: "Asia/Kolkata" }) as string}
          userId={userId}
          patientId={patient.$id}
          authUser={authUser}
          fullUser={patient}
          // no doctor prop → modal opens at step 0 (doctor picker)
        />
      </div> */}

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
        <div className="bg-white border border-[#e2ddd4] rounded-xl p-2.5 text-center">
          <p className="text-[20px] font-bold text-[#203C67] leading-none">{stats.upcoming}</p>
          <p className="text-[9px] text-[#a0afc0] mt-1 uppercase tracking-wide font-semibold">Upcoming</p>
        </div>
        <div className="bg-white border border-[#e2ddd4] rounded-xl p-2.5 text-center">
          <p className="text-[20px] font-bold text-[#203C67] leading-none">{prescriptions.length}</p>
          <p className="text-[9px] text-[#a0afc0] mt-1 uppercase tracking-wide font-semibold">Active Rx</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="mb-3 shrink-0">
        <p className="text-[9px] font-bold text-[#a0afc0] uppercase tracking-widest px-1 mb-1.5">Navigation</p>
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = item.key === activeNav
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all group
                  ${isActive
                    ? "bg-white border-[#d8d4c8] text-[#203C67] shadow-sm"
                    : "border-transparent text-[#5a6a7e] hover:bg-white hover:border-[#d8d4c8] hover:text-[#203C67]"
                  }`}
              >
                <span className={`shrink-0 ${isActive ? "text-[#203C67]" : "text-[#a0afc0] group-hover:text-[#203C67]"} transition-colors`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#203C67] shrink-0" />}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="flex-1  mb-3 min-h-0">
        <p className="text-[9px] font-bold text-[#a0afc0] uppercase tracking-widest px-1 mb-1.5">Recent Activity</p>
        <div className="flex flex-col gap-2 overflow-y-auto remove-scrollbar">
          {recentActivity.length === 0 ? (
            <p className="text-[11px] text-[#a0afc0] px-1">No activity yet</p>
          ) : recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-2 px-1">
              <span className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(a.status)}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-[#1a2535] font-medium truncate leading-tight">{a.primaryDoctor}</p>
                <p className="text-[10px] text-[#a0afc0]">
                  {a.status} · {new Date(a.schedule).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 pt-3 border-t border-[#e2ddd4]">
        <Link
          href="/sign-out"
          onClick={() => onClose?.()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors w-full mb-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="text-[12px] font-semibold">Sign Out</span>
        </Link>
        <p className="text-[10px] text-[#a0afc0] text-center">
          <Link href="/help" className="hover:text-gray-500">Help</Link>
          {' · '}
          <Link href="/help/how-to-use" className="hover:text-gray-500">How to use</Link>
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Hamburger — mobile only ── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-[#e2ddd375] hover:bg-[#d8d3c9] text-[#1a2535] transition-colors shrink-0"
        aria-label="Open menu"
      >
        <Image src='/assets/icons/hamburger.svg' alt='sidebar' width={40} height={40} className="h-6 w-6" />
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-[99] bg-black/40 backdrop-blur-[2px]"
        />
      )}

      {/* ── Mobile slide-in drawer ── */}
      <div
        className={`lg:hidden fixed top-4 left-4 bottom-4 z-[100] w-[272px] bg-[#EFECE3] rounded-2xl border border-[#d8d4c8] shadow-2xl p-4 flex flex-col transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-[calc(100%+20px)]"}`}
      >
        <SidebarInner onClose={() => setOpen(false)} />
      </div>

      {/* ── Desktop fixed sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed flex-1 left-4 w-[248px] xl:w-[260px] z-20 bg-[#EFECE3] rounded-2xl border border-[#d8d4c8] shadow-lg p-4">
        <SidebarInner />
      </aside>
    </>
  )
}