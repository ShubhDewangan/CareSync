// app/(root)/doctors/DoctorsPageClient.tsx
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Doctor } from "@/types/appwrite"
import { Patient } from "@/types/appwrite"
import DoctorCard from "@/components/ui/DoctorCard"

type AuthUser = {
  $id: string
  name: string
  userType: "patient" | "doctor"
  email: string
  phone: string
}

export default function DoctorsPageClient({
  doctors,
  initialQuery,
  authUser,
  fullUser,
}: {
  doctors: Doctor[]
  initialQuery: string
  authUser?: AuthUser
  fullUser?: Patient
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [inputVal, setInputVal] = useState(initialQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.trim()
    ? doctors.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.specialization?.some((s) =>
            s.toLowerCase().includes(query.toLowerCase())
          )
      )
    : doctors

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputVal.trim()
    setQuery(trimmed)
    router.replace(trimmed ? `/doctors?q=${encodeURIComponent(trimmed)}` : "/doctors")
  }

  function handleClear() {
    setInputVal("")
    setQuery("")
    router.replace("/doctors")
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-[#EFECE3]">

      {/* ── Header ── */}
      <div className="bg-white border-b-[3px] border-[#203C67] px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h1 className="text-[#203C67] font-bold text-2xl sm:text-3xl tracking-tight">
                Find a Doctor
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {filtered.length} doctor{filtered.length !== 1 ? "s" : ""} available
              </p>
            </div>
            {query && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Results for</span>
                <span className="inline-flex items-center gap-1.5 bg-[#EEF3FA] border border-[#8FABD4] text-[#203C67] text-xs font-semibold px-3 py-1 rounded-full">
                  {query}
                  <button type="button" onClick={handleClear} className="cursor-pointer hover:opacity-70">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="flex-1 flex items-center gap-2 bg-[#F3F6FB] border-2 border-gray-200 rounded-xl px-4 h-12 focus-within:border-[#203C67] transition-colors">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="flex-shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Search by name or specialisation..."
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400 py-1"
              />
              {inputVal && (
                <button type="button" onClick={handleClear} className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 h-12 bg-[#203C67] text-white text-sm font-semibold rounded-xl hover:bg-[#162d50] transition-colors cursor-pointer whitespace-nowrap"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="w-full px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-16 h-16 rounded-full bg-[#EEF3FA] border-2 border-[#8FABD4] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8FABD4" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-[#203C67] font-semibold text-lg">No doctors found</p>
              <p className="text-gray-400 text-sm">Try a different name or specialisation</p>
              <button onClick={handleClear} className="mt-2 text-sm text-[#203C67] underline underline-offset-2 font-semibold cursor-pointer">
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
              {filtered.map((doctor) => (
                <DoctorCard
                  key={doctor.$id}
                  doctor={doctor}
                  userId={authUser?.$id ?? ""}
                  patientId={fullUser?.$id ?? ""}
                  authUser={authUser}
                  fullUser={fullUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}