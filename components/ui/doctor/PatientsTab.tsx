"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDoctorPatients } from "@/lib/actions/prescriptions.actions"

interface Patient {
  $id: string
  name: string
  email?: string
  phone?: string
  bloodGroup?: string
  allergies?: string
  gender?: string
  profilePic?: string
}

interface Props {
  doctorId: string
  userId: string
  doctorName: string
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function PatientsTab({ doctorId, userId, doctorName }: Props) {
  const router = useRouter()
  const [patients, setPatients]   = useState<Patient[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState("")

  useEffect(() => {
    getDoctorPatients(doctorId)
      .then((p: any[]) => setPatients(p))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false))
  }, [doctorId])

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  if (loading) return (
    <div className="flex items-center justify-center flex-1 py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-7 w-7 rounded-full border-2 border-[#A6BAD7] border-t-[#203C67] animate-spin" />
        <p className="text-[12px] text-gray-400">Loading patients…</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#203C67]">My Patients</h2>
          <p className="text-[12px] text-gray-500">{patients.length} patient{patients.length !== 1 ? "s" : ""} seen</p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients…"
            className="pl-8 pr-4 py-2 text-[12px] border border-[#203C6730] rounded-lg bg-white/60 focus:outline-none focus:border-[#203C67] transition-colors w-56"
          />
        </div>
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
          <p className="text-[32px] mb-3">👥</p>
          <p className="text-[14px] font-semibold text-gray-600">
            {search ? "No patients match your search" : "No patients yet"}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            {search ? "Try a different name or email" : "Patients will appear here after their first appointment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto custom-scroll flex-1 pb-2">
          {filtered.map(patient => (
            <div
              key={patient.$id}
              className="bg-white/60 border border-[#203C6720] rounded-xl p-4 flex flex-col gap-3 hover:bg-white/80 hover:border-[#203C6750] transition-all cursor-pointer group"
              onClick={() => router.push(`/doctors/${userId}/patients/${patient.$id}/records`)}
            >
              {/* Top row */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#A6BAD7] flex items-center justify-center text-[13px] font-semibold text-[#203C67] flex-shrink-0">
                  {initials(patient.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{patient.name}</p>
                  {patient.email && (
                    <p className="text-[11px] text-gray-400 truncate">{patient.email}</p>
                  )}
                </div>
              </div>

              {/* Info pills */}
              <div className="flex gap-2 flex-wrap">
                {patient.bloodGroup && (
                  <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                    {patient.bloodGroup}
                  </span>
                )}
                {patient.gender && (
                  <span className="text-[10px] font-medium bg-[#EEF3FA] text-[#203C67] border border-[#203C6720] rounded-full px-2 py-0.5">
                    {patient.gender}
                  </span>
                )}
                {patient.allergies && (
                  <span className="text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                    ⚠ Allergies
                  </span>
                )}
              </div>

              {/* Action row */}
              <div className="flex gap-2 pt-1 border-t border-[#203C6710]">
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/doctors/${userId}/patients/${patient.$id}/records`) }}
                  className="flex-1 text-[10px] font-medium py-1.5 rounded-md bg-[#203C6710] text-[#203C67] hover:bg-[#203C6720] transition-colors"
                >
                  📋 Records
                </button>
                <button
                  onClick={e => { e.stopPropagation(); router.push(`/doctors/${userId}/patients/${patient.$id}/records?tab=reports`) }}
                  className="flex-1 text-[10px] font-medium py-1.5 rounded-md bg-[#203C6710] text-[#203C67] hover:bg-[#203C6720] transition-colors"
                >
                  📄 Reports
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}