/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import DashboardTab from "./DashboardTab"
import ScheduleTab from "./ScheduleTab"
import SettingsTab from "./SettingTab"
import { Doctor } from "@/types/appwrite"
import PatientsTab from "./PatientsTab"

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
  const [activeTab, setActiveTab] = useState<Tab>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "schedule",  label: "Schedule",  icon: "📅" },
    { key: "patients",  label: "Patients",  icon: "👥" },
    { key: "settings",  label: "Settings",  icon: "⚙️" },
  ]

  const initials = doctor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const SidebarContent = () => (
    <div className="rounded-2xl flex flex-col items-center border border-[#203C67] bg-[#EFECE3] shadow-md overflow-hidden h-full">
      {/* Logo */}
      <div className="w-full flex justify-center pt-4 pb-2 border-b border-[#203C6720]">
        <Link href="/" onClick={() => setSidebarOpen(false)}>
          <Image src="/logo.png" alt="logo" height={1000} width={1000} className="h-14 w-fit" />
        </Link>
      </div>

      {/* Profile */}
      <div className="w-full flex flex-col items-center px-4 pt-5 pb-4 border-b border-[#203C6720]">
        <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full border-2 border-[#203C67] p-[2px] mb-3">
          {doctor.profilePic ? (
            <Image
              src={doctor.profilePic}
              alt="profile"
              height={200}
              width={200}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-[#A6BAD7] flex items-center justify-center text-[#203C67] text-lg font-semibold">
              {initials}
            </div>
          )}
        </div>
        <h2 className="text-[14px] lg:text-[15px] font-semibold text-[#203C67] truncate max-w-full text-center">
          {doctor.name}
        </h2>
        <p className="text-[11px] text-gray-500 truncate max-w-full mt-0.5">{doctor.email}</p>
        <div className="p-2 text-gray-700 flex gap-2 flex-wrap text-[11px] lg:text-[13px] justify-center">
          {doctor.specialization.map((spec: any) => (
            <span className="bg-[#A6BAD7]/50 rounded-full px-2 border border-gray-700/70" key={spec}>{spec}</span>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-[11px] bg-[#8fabd4c1] px-3 py-1 rounded-full border border-[#848282]">Doctor</span>
          <span className="text-[11px] bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300">Active</span>
        </div>
        <Link
          href={`/doctor/${doctor.name.replace(/\s+/g, "-")}`}
          className="mt-3 text-[12px] text-[#203C67] hover:underline flex items-center gap-1"
          onClick={() => setSidebarOpen(false)}
        >
          View public profile
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </Link>
      </div>

      {/* Quick stats */}
      <div className="w-full px-4 py-4 border-b border-[#203C6720]">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Quick Stats</p>
        <div className="flex flex-col gap-2">
          {stats && [
            { label: "Today's Appointments", value: stats.todayCount, icon: "📅" },
            { label: "Pending Requests",      value: stats.pendingCount, icon: "⏳" },
            { label: "Avg Rating",            value: (doctor as any)?.rating || "-", icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between bg-[#D8E4F0] rounded-lg px-3 py-2">
              <span className="text-[11px] text-gray-600 flex items-center gap-2">
                <span>{s.icon}</span>
                {s.label}
              </span>
              <span className="text-[12px] font-semibold text-[#203C67]">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Last activity */}
      <div className="w-full px-4 py-4 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Last Activity</p>
        <div className="flex flex-col gap-2">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${a.color}`} />
              <div>
                <p className="text-[11px] text-gray-700 leading-tight">{a.text}</p>
                <p className="text-[10px] text-gray-400">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-screen bg-[#EFECE3] overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: static */}
      <aside className="hidden lg:flex py-5 px-4 w-[280px] min-w-[280px] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile: slide-over */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:hidden
        w-[280px] py-5 px-4 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <SidebarContent />
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col pb-3 sm:pb-5 pr-3 sm:pr-5 pt-3 sm:pt-5 pl-3 sm:pl-0 gap-3 sm:gap-4 overflow-hidden min-w-0">

        {/* Tab bar with hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[#203C6710] border border-[#203C6730] transition-colors"
            aria-label="Toggle sidebar"
          >
            <Image src="/assets/icons/hamburger.svg" alt="menu" width={18} height={18} />
          </button>

          {/* Tabs */}
          <div className="flex-1 flex justify-center overflow-x-auto">
            <div className="bg-[#A6BAD7] flex gap-1 sm:gap-1.5 rounded-xl px-1.5 sm:px-2 py-1.5 sm:py-2 shadow-sm">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setActiveTab(t.key); setSidebarOpen(false) }}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-[13px] font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 ${
                    activeTab === t.key
                      ? "bg-[#203C67] text-[#EFECE3] shadow"
                      : "bg-[#93abcf] text-[#203C67] hover:bg-[#7f9dcc]"
                  }`}
                >
                  <span className="sm:hidden">{t.icon}</span>
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden text-[9px] hidden">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
          {activeTab === "patients" && (
            <PatientsTab doctorId={doctor.$id} userId={user.$id} doctorName={doctor.name} />
          )}
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
      </main>
    </div>
  )
}