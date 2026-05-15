/* eslint-disable react-hooks/static-components */
// components/ui/patient/PatientSidebar.tsx
// Navigation is now handled by the top nav bar in the dashboard page.
// This sidebar handles: logo, profile, quick stats, recent activity, sign out.
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/actions/auth.actions"

interface RecentActivityItem {
  text: string
  time: string
  color: string
}

interface Props {
  patient: {
    name: string
    email?: string
    profilePic?: string
    bloodGroup?: string
    gender?: string
  }
  userId: string
  authUser: { $id: string; name: string; email: string; userType: string } | null
  stats?: { upcoming: number }
  prescriptions?: { $id: string }[]
  recentActivity?: RecentActivityItem[]
  activeNav?: "overview" | "records" | "appointments"
}

export default function PatientSidebar({
  patient,
  userId,
  authUser,
  stats,
  prescriptions = [],
  recentActivity = [],
}: Props) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const initials = patient.name
    .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutUser()
      router.push("/")
    } catch {
      setLoggingOut(false)
    }
  }

  const SidebarContent = () => (
    <div className="rounded-2xl flex flex-col border border-[#203C6720] bg-[#EFECE3] shadow-md overflow-hidden h-full">

      {/* Logo */}
      <div className="w-full flex justify-center pt-4 pb-3 border-b border-[#203C6715]">
        <Link href="/" onClick={() => setDrawerOpen(false)}>
          <Image src="/logo.png" alt="CareSync" height={1000} width={1000} className="h-10 w-auto" />
        </Link>
      </div>

      {/* Profile */}
      <div className="w-full flex flex-col items-center px-4 pt-5 pb-4 border-b border-[#203C6715]">
        <div className="relative mb-3">
          <div className="h-16 w-16 rounded-full border-2 border-[#203C6730] overflow-hidden">
            {patient.profilePic ? (
              <Image
                src={patient.profilePic}
                alt="profile"
                height={200} width={200}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#c8dab8] to-[#8ab878] flex items-center justify-center text-[18px] font-bold text-[#2d5230]">
                {initials}
              </div>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#EFECE3]" />
        </div>

        <h2 className="text-[14px] font-bold text-[#1a2535] truncate max-w-full text-center">
          {patient.name}
        </h2>
        <p className="text-[11px] text-[#9a9690] truncate max-w-full mt-0.5 mb-2">
          {patient.email ?? authUser?.email}
        </p>

        <div className="flex gap-2 flex-wrap justify-center">
          <span className="text-[10px] font-600 px-3 py-1 rounded-full bg-[#A6BAD7] text-[#203C67] border border-[#203C6720]">
            Patient
          </span>
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-300">
            Active
          </span>
          {patient.bloodGroup && (
            <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
              {patient.bloodGroup}
            </span>
          )}
        </div>

        <Link
          href={`/patients/${userId}/dashboard`}
          onClick={() => setDrawerOpen(false)}
          className="mt-3 w-full text-center text-[12px] font-semibold py-2 rounded-xl bg-[#2a3320] text-[#e8ede0] hover:bg-[#1e2618] transition-colors"
        >
          Your Dashboard →
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-[#203C6715]">
        <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest mb-3">Quick Stats</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 border border-[#203C6710]">
            <p className="text-[18px] font-bold text-[#203C67]">{stats?.upcoming ?? 0}</p>
            <p className="text-[10px] text-[#9a9690] mt-0.5">Upcoming</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-[#203C6710]">
            <p className="text-[18px] font-bold text-[#3d6b3f]">{prescriptions.length}</p>
            <p className="text-[10px] text-[#9a9690] mt-0.5">Active Rx</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest mb-3">Recent Activity</p>
          <div className="flex flex-col gap-2">
            {recentActivity.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${a.color}`} />
                <div>
                  <p className="text-[11px] text-gray-700 leading-tight">{a.text}</p>
                  <p className="text-[10px] text-[#a0afc0]">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto px-4 py-4 border-t border-[#203C6715] flex flex-col gap-2">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span className="text-[13px] font-semibold">{loggingOut ? "Signing out…" : "Sign Out"}</span>
        </button>
        <div className="flex gap-3 justify-center">
          <Link href="/help" className="text-[11px] text-[#9a9690] hover:text-[#5a6a7e]">Help</Link>
          <span className="text-[#d0cdc7] text-[11px]">·</span>
          <Link href="/help/how-to-use" className="text-[11px] text-[#9a9690] hover:text-[#5a6a7e]">How to use</Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen py-4 px-3 w-[264px] xl:w-[276px] flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile: hamburger button (rendered in dashboard page top area) */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-xl flex items-center justify-center bg-[#EFECE3] border border-[#d4cfc6] shadow-sm"
        aria-label="Open sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile: slide-in drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:hidden w-[264px] py-4 px-3 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </div>
    </>
  )
}