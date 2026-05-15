/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/actions/auth.actions"
import DashboardTab from "./DashboardTab"
import ScheduleTab from "./ScheduleTab"
import SettingsTab from "./SettingTab"
import { Doctor } from "@/types/appwrite"

type Tab = "dashboard" | "schedule" | "patients" | "settings"

interface Appointment {
  $id: string
  schedule: string
  patientName: string
  reason: string
  status: "pending" | "scheduled" | "cancelled" | "completed" | "expired"
}

interface Props {
  doctor: Doctor
  user: { $id: string; name: string; email: string; phone: string }
  appointments: Appointment[]
  stats: {
    todayCount: number
    pendingCount: number
    scheduledCount: number
    completedCount: number
    totalPatients: number
  }
  earningsData: { day: string; date: string; thisWeek: number; lastWeek: number }[]
  pendingRequests: any[]
  recentActivity: { text: string; time: string; color: string }[]
}

export default function DoctorDashboardClient({
  doctor, user, appointments = [],
  stats = { todayCount: 0, pendingCount: 0, scheduledCount: 0, completedCount: 0, totalPatients: 0 },
  earningsData = [],
  pendingRequests = [],
  recentActivity = [],
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "schedule",  label: "Schedule"  },
    { key: "settings",  label: "Settings"  },
  ]

  const initials = doctor.name
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logoutUser()
      router.push("/")
    } catch {
      setLoggingOut(false)
    }
  }

  // ── Sidebar content (shared between desktop + mobile drawer) ────────────────
  const SidebarContent = () => (
    <div className="rounded-2xl flex flex-col border border-[#203C6720] bg-[#EFECE3] shadow-md overflow-hidden h-full">

      {/* Logo */}
      <div className="w-full flex justify-center pt-4 pb-3 border-b border-[#203C6715]">
        <Link href="/" onClick={() => setDrawerOpen(false)}>
          <Image src="/logo.png" alt="logo" height={1000} width={1000} className="h-10 w-auto" />
        </Link>
      </div>

      {/* Profile */}
      <div className="w-full flex flex-col items-center px-4 pt-5 pb-4 border-b border-[#203C6715]">
        <div className="relative mb-3">
          <div className="h-16 w-16 rounded-full border-2 border-[#203C6730] overflow-hidden">
            {doctor.profilePic ? (
              <Image
                src={doctor.profilePic}
                alt="profile"
                height={200} width={200}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#A6BAD7] flex items-center justify-center text-[18px] font-bold text-[#203C67]">
                {initials}
              </div>
            )}
          </div>
          {/* Online dot */}
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#EFECE3]" />
        </div>

        <h2 className="text-[14px] font-bold text-[#1a2535] truncate max-w-full text-center">
          {doctor.name}
        </h2>
        <p className="text-[11px] text-[#9a9690] truncate max-w-full mt-0.5 mb-2">{doctor.email}</p>

        {/* Specializations + badges */}
        <div className="flex gap-1.5 flex-wrap justify-center mb-2">
          {(doctor.specialization as any[]).slice(0, 2).map((spec: any) => (
            <span key={spec} className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-[#A6BAD7]/60 text-[#203C67] border border-[#203C6720]">
              {spec}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-[#A6BAD7] text-[#203C67] border border-[#203C6720]">
            Doctor
          </span>
          <span className="text-[10px] font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 border border-green-300">
            Active
          </span>
        </div>

        <Link
          href={`/doctor/${doctor.name.replace(/\s+/g, "-")}`}
          onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#203C67] hover:underline"
        >
          View public profile
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-4 border-b border-[#203C6715]">
        <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest mb-3">Quick Stats</p>
        <div className="flex flex-col gap-2">
          {[
            { label: "Today's Appointments", value: stats.todayCount,   icon: "📅" },
            { label: "Pending Requests",     value: stats.pendingCount, icon: "⏳" },
            { label: "Avg Rating",           value: (doctor as any)?.rating || "—", icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between bg-[#D8E4F0]/60 rounded-xl px-3 py-2 border border-[#203C6710]">
              <span className="text-[11px] text-gray-600 flex items-center gap-2">
                <span>{s.icon}</span>
                {s.label}
              </span>
              <span className="text-[12px] font-semibold text-[#203C67]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="px-4 py-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest mb-3">Last Activity</p>
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
    <div className="h-screen bg-[#EFECE3] flex flex-col overflow-hidden">

      {/* Mobile sidebar overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Desktop sidebar — fixed */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen py-5 pl-5 w-[264px] xl:w-[276px] flex-col z-30">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setDrawerOpen(v => !v)}
        className="lg:hidden fixed top-3 left-3 z-50 w-9 h-9 rounded-xl flex items-center justify-center bg-[#EFECE3] border border-[#d4cfc6] shadow-sm"
        aria-label="Toggle sidebar"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Mobile slide-in drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:hidden w-[264px] py-4 px-3 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </div>

      {/* ── Main content (offset by sidebar on desktop) ── */}
      <div className="flex flex-col flex-1 lg:pl-[264px] xl:pl-[276px] overflow-hidden">

        {/* ── Top Nav Bar (tab switcher, same position as Records nav) ── */}
        <header className="sticky top-0 z-30 bg-[#EFECE3]/90 backdrop-blur-md border-b border-[#d8d4c8] px-4 py-3 flex items-center justify-center">
          <nav className="flex items-center gap-1 bg-[#e2ddd3] rounded-xl p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setDrawerOpen(false) }}
                className={`px-4 sm:px-6 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-medium transition-all whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-[#203C67] text-white shadow-sm"
                    : "text-gray-600 hover:bg-[#d0ccc2]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-5 gap-4">
          {activeTab === "dashboard" && (
            <DashboardTab
              doctor={doctor as any}
              doctorId={doctor.$id}
              stats={stats}
              earningsData={earningsData}
              pendingRequests={pendingRequests}
              userId={user.$id as string}
            />
          )}
          {activeTab === "schedule" && (
            <ScheduleTab
              doctorId={doctor.$id}
              user={user}
              doctor={doctor as any}
              appointments={appointments}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab doctor={doctor as any} doctorId={doctor.$id as string} />
          )}
        </div>
      </div>
    </div>
  )
}