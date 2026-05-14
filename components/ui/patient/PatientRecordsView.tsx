/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ui/patient/PatientRecordsView.tsx
"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { getFileViewUrl } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { getDoctorById } from "@/lib/actions/doctor.actions"
import { showToast } from "../toaster"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  name: string; dosage: string; frequency: string; duration: string; instructions?: string
}
interface Prescription {
  $id: string; diagnosis: string; medications: any; notes?: string
  followUpDate?: string | null; content?: string; type?: string; $createdAt: string
  doctorId?: string
}
interface MedicalReport {
  $id: string; title: string; reportType: string; notes?: string
  fileId: string; fileName: string; fileSize: number; mimeType: string; $createdAt: string
  doctorId?: string
}
interface DoctorInfo {
  $id: string
  name: string
  specialization?: string[]  // always string[]
  qualification?: string[]   // always string[]
  profilePic?: string
  email?: string
  phone?: string
}
interface Props {
  userId: string
  patient: any
  authUser: any
  prescriptions: Prescription[]
  reports: MedicalReport[]
}

type Tab = "prescriptions" | "reports"

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "lab",       label: "Lab Report",        icon: "🧪" },
  { value: "imaging",   label: "Imaging / X-Ray",   icon: "🩻" },
  { value: "discharge", label: "Discharge Summary",  icon: "🏥" },
  { value: "referral",  label: "Referral Letter",    icon: "📨" },
  { value: "other",     label: "Other",              icon: "📄" },
]

const REPORT_PILL: Record<string, string> = {
  lab:       "bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea]",
  imaging:   "bg-[#e6f4ea] text-[#2d6b3f] border border-[#b8d4c0]",
  discharge: "bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]",
  referral:  "bg-[#f3e8ff] text-[#7e22ce] border border-[#d8b4fe]",
  other:     "bg-[#f7f4ef] text-[#5a6a7e] border border-[#d4cfc6]",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMedications(raw: any): Medication[] {
  if (!raw) return []
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
    return []
  }
  if (Array.isArray(raw)) {
    return raw.map((m: any) => {
      if (!m) return null
      if (typeof m === "string") { try { return JSON.parse(m) } catch { return null } }
      return m
    }).filter(Boolean) as Medication[]
  }
  return []
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  })
}
function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function groupLabel(iso: string): string {
  const d   = new Date(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Yesterday"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}
function groupByDate<T extends { $createdAt: string }>(items: T[]): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const label = groupLabel(item.$createdAt)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}
function getInitials(name: string) {
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
}
function calcAge(birthDate?: string) {
  if (!birthDate) return null
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DateHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wider whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[#e2ddd4]" />
    </div>
  )
}

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, dateValue, onDateChange }: {
  value: string; onChange: (v: string) => void
  dateValue: string; onDateChange: (v: string) => void
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b0a99e]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search diagnosis, title…"
          className="w-full border border-[#d4cfc6] rounded-xl pl-8 pr-8 py-2 text-[12px] text-[#1a2535] bg-white/60 focus:outline-none focus:border-[#203C67] focus:bg-white transition-colors placeholder:text-[#b0a99e]"
        />
        {value && (
          <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#b0a99e] hover:text-[#5a6a7e]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      <div className="relative">
        <input
          type="date"
          value={dateValue}
          onChange={e => onDateChange(e.target.value)}
          className="border border-[#d4cfc6] rounded-xl px-3 py-2 text-[12px] text-[#1a2535] bg-white/60 focus:outline-none focus:border-[#203C67] transition-colors appearance-none cursor-pointer"
          style={{ colorScheme: "light" }}
        />
        {dateValue && (
          <button onClick={() => onDateChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b0a99e] hover:text-[#5a6a7e]">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor, loading, userId }: { doctor: DoctorInfo | null; loading: boolean; userId: string }) {
  if (loading) {
    return (
      <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#e2ddd4] animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3 w-24 bg-[#e2ddd4] rounded animate-pulse" />
          <div className="h-2.5 w-32 bg-[#e2ddd4] rounded animate-pulse" />
          <div className="h-2.5 w-20 bg-[#e2ddd4] rounded animate-pulse" />
        </div>
      </div>
    )
  }
  if (!doctor) return null

  // specialization and qualification are ALWAYS string[]
  const specs = Array.isArray(doctor.specialization) ? doctor.specialization : []
  const quals = Array.isArray(doctor.qualification)  ? doctor.qualification  : []

  return (
    <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl p-3 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#dde8f5] flex items-center justify-center overflow-hidden shrink-0">
        {doctor.profilePic ? (
          <Image src={doctor.profilePic} alt={doctor.name} width={40} height={40} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-[12px] font-bold text-[#203C67]">{getInitials(doctor.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1a2535]">Dr. {doctor.name}</p>
        {specs.length > 0 && (
          <p className="text-[10px] text-[#5a6a7e] mt-0.5 leading-snug">{specs.join(", ")}</p>
        )}
        {quals.length > 0 && (
          <p className="text-[10px] text-[#a0afc0] mt-0.5 leading-snug">{quals.join(", ")}</p>
        )}
        <Link
          href={`/patients/${userId}/doctors/${doctor.$id}`}
          className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[#203C67] hover:underline"
        >
          View Profile
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </div>
  )
}

// ─── Patient Health Summary (shown in detail panel) ───────────────────────────

function PatientHealthSummary({ patient }: { patient: any }) {
  if (!patient) return null

  const age         = calcAge(patient.birthDate)
  const allergyList = patient.allergies?.split(",").map((s: string) => s.trim()).filter(Boolean) ?? []

  const vitals = [
    { label: "Blood Group", value: patient.bloodGroup,                              dot: "bg-red-400" },
    { label: "Gender",      value: patient.gender,                                  dot: "bg-purple-400" },
    { label: "Age",         value: age ? `${age} yrs` : null,                       dot: "bg-yellow-400" },
    { label: "Weight",      value: patient.weight ? `${patient.weight} kg` : null,  dot: "bg-blue-400" },
    { label: "Height",      value: patient.height ? `${patient.height} cm` : null,  dot: "bg-green-400" },
  ].filter(v => !!v.value)

  const hasHistory = patient.currentMedication || patient.pastMedicalHistory || patient.familyMedicalHistory
  const hasContact = patient.emergencyContactName || patient.emergencyContactNumber || patient.insuranceProvider

  if (!vitals.length && !allergyList.length && !hasHistory && !hasContact) return null

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide whitespace-nowrap">Patient Health Info</span>
        <div className="flex-1 h-px bg-[#e2ddd4]" />
      </div>

      {/* Vitals */}
      {vitals.length > 0 && (
        <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl overflow-hidden">
          {vitals.map((v, i) => (
            <div key={v.label} className={`flex items-center justify-between px-3 py-2 ${i !== vitals.length - 1 ? "border-b border-[#f0ece5]" : ""}`}>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
                <span className="text-[11px] text-[#7a8fa8]">{v.label}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#1a2535]">{v.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Allergies */}
      {allergyList.length > 0 && (
        <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-xl px-3 py-2.5">
          <p className="text-[9px] font-semibold text-[#92400e] uppercase tracking-wide mb-1.5">⚠ Allergies</p>
          <div className="flex flex-wrap gap-1">
            {allergyList.map((a: string) => (
              <span key={a} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Medical history */}
      {hasHistory && (
        <div className="bg-white border border-[#e2ddd4] rounded-xl overflow-hidden">
          {patient.currentMedication && (
            <div className={`px-3 py-2 ${(patient.pastMedicalHistory || patient.familyMedicalHistory) ? "border-b border-[#f0ece5]" : ""}`}>
              <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide mb-0.5">Current Medication</p>
              <p className="text-[11px] text-[#1a2535] leading-snug">{patient.currentMedication}</p>
            </div>
          )}
          {patient.pastMedicalHistory && (
            <div className={`px-3 py-2 ${patient.familyMedicalHistory ? "border-b border-[#f0ece5]" : ""}`}>
              <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide mb-0.5">Past Medical History</p>
              <p className="text-[11px] text-[#1a2535] leading-snug">{patient.pastMedicalHistory}</p>
            </div>
          )}
          {patient.familyMedicalHistory && (
            <div className="px-3 py-2">
              <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide mb-0.5">Family History</p>
              <p className="text-[11px] text-[#1a2535] leading-snug">{patient.familyMedicalHistory}</p>
            </div>
          )}
        </div>
      )}

      {/* Emergency & insurance */}
      {hasContact && (
        <div className="bg-white border border-[#e2ddd4] rounded-xl overflow-hidden">
          {patient.emergencyContactName && (
            <div className={`px-3 py-2 ${patient.insuranceProvider ? "border-b border-[#f0ece5]" : ""}`}>
              <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide mb-0.5">Emergency Contact</p>
              <p className="text-[11px] text-[#1a2535]">
                {patient.emergencyContactName}
                {patient.emergencyContactNumber && (
                  <span className="text-[#a0afc0]"> · {patient.emergencyContactNumber}</span>
                )}
              </p>
            </div>
          )}
          {patient.insuranceProvider && (
            <div className="px-3 py-2">
              <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide mb-0.5">Insurance</p>
              <p className="text-[11px] text-[#1a2535]">{patient.insuranceProvider}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Prescription Detail ──────────────────────────────────────────────────────

function PrescriptionDetail({
  rx, doctor, doctorLoading, patient, userId,
}: {
  rx: Prescription; doctor: DoctorInfo | null; doctorLoading: boolean; patient: any; userId: string
}) {
  const meds = parseMedications(rx.medications)
  return (
    <div className="flex flex-col gap-4">

      {/* Doctor card */}
      <div>
        <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-1.5">Prescribed by</p>
        <DoctorCard doctor={doctor} loading={doctorLoading} userId={userId} />
      </div>

      {/* Diagnosis + follow-up */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[16px] font-semibold text-[#1a2535]">{rx.diagnosis}</p>
          <p className="text-[11px] text-[#a0afc0] mt-0.5">
            {formatDate(rx.$createdAt)} · {formatTime(rx.$createdAt)}
          </p>
        </div>
        {rx.followUpDate && (
          <div className="bg-[#dde8f5] border border-[#c8d8ea] rounded-xl px-3 py-1.5 text-right shrink-0">
            <p className="text-[9px] font-semibold text-[#8FABD4] uppercase tracking-wide">Follow-up</p>
            <p className="text-[12px] font-semibold text-[#203C67]">{formatDate(rx.followUpDate)}</p>
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">
          Medications ({meds.length})
        </p>
        {meds.length === 0 ? (
          <p className="text-[12px] text-[#a0afc0] italic">No medications recorded.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {meds.map((med, i) => (
              <div key={i} className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-[#dde8f5] flex items-center justify-center text-[9px] font-bold text-[#203C67] shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[13px] font-semibold text-[#1a2535]">{med.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-7">
                  {med.dosage && (
                    <div>
                      <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Dosage</p>
                      <p className="text-[12px] text-[#5a6a7e] font-medium">{med.dosage}</p>
                    </div>
                  )}
                  {med.frequency && (
                    <div>
                      <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Frequency</p>
                      <p className="text-[12px] text-[#5a6a7e] font-medium">{med.frequency}</p>
                    </div>
                  )}
                  {med.duration && (
                    <div>
                      <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Duration</p>
                      <p className="text-[12px] text-[#5a6a7e] font-medium">{med.duration}</p>
                    </div>
                  )}
                  {med.instructions && (
                    <div className="col-span-3">
                      <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Instructions</p>
                      <p className="text-[12px] text-[#5a6a7e] italic">{med.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clinical notes (rich text) */}
      {rx.content && (
        <div>
          <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Clinical Notes</p>
          <div
            className="bg-white border border-[#e2ddd4] rounded-xl px-4 py-3 text-[12px] text-[#1a2535] leading-relaxed prose prose-sm max-w-none"
            style={{ fontFamily: "Georgia, serif" }}
            dangerouslySetInnerHTML={{ __html: rx.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") }}
          />
        </div>
      )}

      {/* Doctor notes */}
      {rx.notes && (
        <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-xl p-3">
          <p className="text-[9px] font-semibold text-[#92400e] uppercase tracking-wide mb-1">Doctor&apos;s Notes</p>
          <p className="text-[12px] text-[#5a6a7e] leading-relaxed">{rx.notes}</p>
        </div>
      )}

      {/* Patient health summary */}
      <PatientHealthSummary patient={patient} />
    </div>
  )
}

// ─── Report Detail ────────────────────────────────────────────────────────────

function ReportDetail({
  report, doctor, doctorLoading, patient, userId,
}: {
  report: MedicalReport; doctor: DoctorInfo | null; doctorLoading: boolean; patient: any; userId: string
}) {
  const rt      = REPORT_TYPES.find(t => t.value === report.reportType)
  const viewUrl = getFileViewUrl(report.fileId) as any
  return (
    <div className="flex flex-col gap-4">

      {/* Doctor card */}
      <div>
        <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-1.5">Uploaded by</p>
        <DoctorCard doctor={doctor} loading={doctorLoading} userId={userId} />
      </div>

      {/* Title + type */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#f7f4ef] border border-[#e2ddd4] flex items-center justify-center text-2xl shrink-0">
          {rt?.icon ?? "📄"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold text-[#1a2535]">{report.title}</p>
          <p className="text-[11px] text-[#a0afc0] mt-0.5">{formatDate(report.$createdAt)} · {formatTime(report.$createdAt)}</p>
          <span className={`mt-1.5 inline-block text-[10px] font-semibold border rounded-full px-2.5 py-0.5 ${REPORT_PILL[report.reportType] ?? REPORT_PILL.other}`}>
            {rt?.label ?? report.reportType}
          </span>
        </div>
      </div>

      {/* File */}
      <div className="bg-white border border-[#e2ddd4] rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#f7f4ef] flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0afc0" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-[#1a2535] truncate">{report.fileName}</p>
          <p className="text-[10px] text-[#a0afc0]">{formatBytes(report.fileSize)} · {report.mimeType}</p>
        </div>
        <a
          href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl bg-[#203C67] text-white hover:bg-[#162d50] transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View
        </a>
      </div>

      {/* Notes */}
      {report.notes && (
        <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl p-3">
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-1">Notes</p>
          <p className="text-[12px] text-[#5a6a7e] leading-relaxed">{report.notes}</p>
        </div>
      )}

      {/* Patient health summary */}
      <PatientHealthSummary patient={patient} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientRecordsView({
  userId, patient, prescriptions, reports,
}: Props) {
  const [tab, setTab]     = useState<Tab>("prescriptions")
  const [panel, setPanel] = useState<
    { type: "rx"; data: Prescription } | { type: "report"; data: MedicalReport } | null
  >(null)

  const [search, setSearch]         = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [doctorCache, setDoctorCache]     = useState<Record<string, DoctorInfo>>({})
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [toast, showtoast] = useState(false)

  const router = useRouter()

  const fetchDoctor = useCallback(async (doctorId?: string) => {
    if (!doctorId) return
    if (doctorCache[doctorId]) return
    setDoctorLoading(true)
    try {
      const doc = await getDoctorById(doctorId)
      if (doc) setDoctorCache(prev => ({ ...prev, [doctorId]: doc as DoctorInfo }))
    } catch {}
    finally { setDoctorLoading(false) }
  }, [doctorCache])

  function openPanel(item: typeof panel) {
    setPanel(item)
    const doctorId = item?.data?.doctorId
    if (doctorId && !doctorCache[doctorId]) fetchDoctor(doctorId)
  }

  const q = search.toLowerCase()

  const filteredRx = prescriptions.filter(rx => {
    const matchText = !q || rx.diagnosis?.toLowerCase().includes(q)
    const matchDate = !dateFilter || rx.$createdAt.startsWith(dateFilter)
    return matchText && matchDate
  })

  const filteredReports = reports.filter(r => {
    const matchText = !q || r.title?.toLowerCase().includes(q) || r.reportType?.toLowerCase().includes(q)
    const matchDate = !dateFilter || r.$createdAt.startsWith(dateFilter)
    return matchText && matchDate
  })

  const rxGroups     = groupByDate([...filteredRx].sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()))
  const reportGroups = groupByDate([...filteredReports].sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()))
  const panelOpen    = panel !== null
  const panelDoctorId = panel?.data?.doctorId
  const panelDoctor   = panelDoctorId ? (doctorCache[panelDoctorId] ?? null) : null

  if (toast) {
    showToast('info','Just joking it is for looks cause two tabs were not looking good so something was needed (see your appointments in dashboard)!')
    showToast('info','This page is under construction!!')
    showtoast(false)
  }

  return (
    <div className="min-h-screen bg-[#EFECE3] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky flex top-0 z-30 bg-[#EFECE3]/90 backdrop-blur-md border-b border-[#d8d4c8] px-4 py-3 items-center justify-center gap-3">
        <div className="absolute items-center gap-3 left-5">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full border border-[#d4cfc6] flex items-center justify-center text-[#7a8fa8] hover:border-[#203C67] hover:text-[#505660] transition-colors shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
            </svg>
          </button>
        </div>

        <nav className="flex items-center gap-1 bg-[#e2ddd3] rounded-xl p-1">
          {[
          { label: "Homepage",    href: `/`, active: false },
          { label: "Dashboard",    href: `/patients/${userId}/dashboard`, active: false },
            { label: "Appointments", href: `/patients/${userId}/records`, active: false },
            { label: "Records",      href: `/patients/${userId}/records`, active: true },
          ].map((item) => (
            item.label === 'Appointments'
              ? (
                <button
                  key={item.label}
                  onClick={() => showtoast(true)}
                  className="px-2 sm:px-3 py-1 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap text-gray-600 hover:bg-[#d0ccc2]"
                >
                  {item.label}
                </button>
              )
              : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                    item.active ? "bg-[#203C67] text-white shadow-sm" : "text-gray-600 hover:bg-[#d0ccc2]"
                  }`}
                >
                  {item.label}
                </Link>
              )
          ))}
        </nav>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 relative min-h-0">

        {/* ── Floating Sidebar ── */}
        <aside className="hidden lg:flex flex-col fixed left-4 top-[73px] bottom-4 w-[220px] xl:w-[240px] z-20 overflow-y-auto remove-scrollbar bg-[#EFECE3] rounded-2xl border border-[#d8d4c8] shadow-xl p-3">
          <Link href="/">
            <div className="flex items-center justify-center mb-5 border-b border-[#d8d4c8]">
              <Image src="/logo.png" alt="logo" height={1000} width={1000} className="h-16 w-fit" />
            </div>
          </Link>

          {/* Profile card */}
          <div className="flex flex-col items-center gap-2 mb-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-2 border-[#e2ddd4] p-0.5 overflow-hidden">
                <Image
                  src={patient.profilePic || "/assets/images/user_default.webp"}
                  alt="profile" height={200} width={200}
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#3B8C4B] rounded-full border-2 border-white" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-[#1a2535]">{patient.name}</p>
              <p className="text-[11px] text-[#a0afc0] mt-0.5 truncate max-w-[170px]">{patient.email}</p>
            </div>
            <div className="flex gap-1.5 flex-wrap justify-center">
              <span className="text-[10px] bg-[#dde8f5] text-[#203C67] px-2 py-0.5 rounded-full font-medium border border-[#c8d8ea]">Patient</span>
              <span className="text-[10px] bg-[#e6f4ea] text-[#2d6b3f] px-2 py-0.5 rounded-full font-medium border border-[#b8d4c0]">Active</span>
            </div>
          </div>

          {/* Vitals */}
          <div className="mb-3">
            <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest px-1 mb-2">Health Vitals</p>
            <div className="flex flex-col gap-1.5">
              {[
                { label: "Blood Group", value: patient.bloodGroup ?? "—", dot: "bg-red-400" },
                { label: "Gender",      value: patient.gender ?? "—",     dot: "bg-purple-400" },
                { label: "Weight",      value: patient.weight ? `${patient.weight} kg` : "—", dot: "bg-blue-400" },
                { label: "Height",      value: patient.height ? `${patient.height} cm` : "—", dot: "bg-green-400" },
              ].map((v) => (
                <div key={v.label} className="flex items-center justify-between rounded-lg px-3 py-2 bg-[#e8e4da]">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
                    <span className="text-[11px] text-gray-700">{v.label}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1a2535]">{v.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Allergies */}
          {patient.allergies && (
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest px-1 mb-2">Allergies</p>
              <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-[#92400e] font-medium leading-snug">⚠ {patient.allergies}</p>
              </div>
            </div>
          )}

          {/* Current medication */}
          {patient.currentMedication && (
            <div className="mb-3">
              <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest px-1 mb-2">Current Medication</p>
              <div className="bg-white border border-[#e2ddd4] rounded-xl px-3 py-2.5">
                <p className="text-[11px] text-[#1a2535] leading-snug">{patient.currentMedication}</p>
              </div>
            </div>
          )}

          {/* Record counts */}
          <div className="mt-auto">
            <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest px-1 mb-2">Records</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/50 border border-[#e2ddd4] rounded-xl p-3 text-center">
                <p className="text-[20px] font-semibold text-[#203C67] leading-none">{prescriptions.length}</p>
                <p className="text-[9px] text-[#a0afc0] mt-1">Rx</p>
              </div>
              <div className="bg-white/50 border border-[#e2ddd4] rounded-xl p-3 text-center">
                <p className="text-[20px] font-semibold text-[#1a2535] leading-none">{reports.length}</p>
                <p className="text-[9px] text-[#a0afc0] mt-1">Reports</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── List Column ── */}
        <div className={`flex flex-col transition-all duration-300 lg:ml-[236px] xl:ml-[256px] ${
          panelOpen ? "w-full lg:w-[400px] lg:min-w-[320px]" : "flex-1"
        } border-r border-[#d4cfc6] overflow-y-auto`}>

          <div className="p-4 sm:p-5 flex flex-col gap-3">

            {/* Tabs */}
            <div className="flex gap-1 bg-white/60 border border-[#e2ddd4] rounded-xl p-1">
              {(["prescriptions", "reports"] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setPanel(null) }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all ${
                    tab === t ? "bg-[#203C67] text-white shadow-sm" : "text-[#7a8fa8] hover:text-[#203C67]"
                  }`}
                >
                  {t === "prescriptions" ? `💊 Prescriptions (${prescriptions.length})` : `📄 Reports (${reports.length})`}
                </button>
              ))}
            </div>

            {/* Search + date filter */}
            <SearchBar value={search} onChange={setSearch} dateValue={dateFilter} onDateChange={setDateFilter} />

            {(search || dateFilter) && (
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] text-[#a0afc0]">
                  {(tab === "prescriptions" ? filteredRx.length : filteredReports.length)} result{(tab === "prescriptions" ? filteredRx.length : filteredReports.length) !== 1 ? "s" : ""}
                </p>
                <button onClick={() => { setSearch(""); setDateFilter("") }} className="text-[11px] text-[#203C67] font-medium hover:underline">Clear</button>
              </div>
            )}

            {/* Prescriptions */}
            {tab === "prescriptions" && (
              <div className="flex flex-col gap-1">
                {filteredRx.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white/60 border border-[#e2ddd4] rounded-2xl">
                    <p className="text-[36px] mb-3">💊</p>
                    <p className="text-[14px] font-semibold text-[#1a2535] mb-1">
                      {search || dateFilter ? "No results found" : "No prescriptions yet"}
                    </p>
                    <p className="text-[12px] text-[#a0afc0]">
                      {search || dateFilter ? "Try a different search or date" : "Prescriptions from your doctors will appear here"}
                    </p>
                  </div>
                ) : rxGroups.map(group => (
                  <div key={group.label} className="flex flex-col gap-1.5 mb-1">
                    <DateHeading label={group.label} />
                    {group.items.map(rx => {
                      const isActive = panel?.type === "rx" && panel.data.$id === rx.$id
                      const meds = parseMedications(rx.medications)
                      return (
                        <div key={rx.$id} onClick={() => openPanel({ type: "rx", data: rx })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all group ${
                            isActive
                              ? "bg-[#203C67] border-[#203C67]"
                              : "bg-white border-[#e2ddd4] hover:border-[#8FABD4] hover:bg-[#f7f9fc]"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                            isActive ? "bg-white/20" : "bg-[#dde8f5]"
                          }`}>💊</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-semibold truncate ${isActive ? "text-white" : "text-[#1a2535]"}`}>
                              {rx.diagnosis || "General Prescription"}
                            </p>
                            <p className={`text-[10px] mt-0.5 ${isActive ? "text-white/60" : "text-[#a0afc0]"}`}>
                              {meds.length} med{meds.length !== 1 ? "s" : ""} · {formatTime(rx.$createdAt)}
                            </p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : rx.type === "image"
                                ? "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]"
                                : "bg-[#dde8f5] text-[#203C67] border-[#c8d8ea]"
                          }`}>
                            {rx.type === "image" ? "🖼" : "📝"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Reports */}
            {tab === "reports" && (
              <div className="flex flex-col gap-1">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e2ddd4] rounded-2xl">
                    <p className="text-[36px] mb-3">📄</p>
                    <p className="text-[14px] font-semibold text-[#1a2535] mb-1">
                      {search || dateFilter ? "No results found" : "No reports yet"}
                    </p>
                    <p className="text-[12px] text-[#a0afc0]">
                      {search || dateFilter ? "Try a different search or date" : "Reports uploaded by your doctors will appear here"}
                    </p>
                  </div>
                ) : reportGroups.map(group => (
                  <div key={group.label} className="flex flex-col gap-1.5 mb-1">
                    <DateHeading label={group.label} />
                    {group.items.map(report => {
                      const isActive = panel?.type === "report" && panel.data.$id === report.$id
                      const rt = REPORT_TYPES.find(t => t.value === report.reportType)
                      return (
                        <div key={report.$id} onClick={() => openPanel({ type: "report", data: report })}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            isActive
                              ? "bg-[#203C67] border-[#203C67]"
                              : "bg-white border-[#e2ddd4] hover:border-[#8FABD4] hover:bg-[#f7f9fc]"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                            isActive ? "bg-white/20" : "bg-[#f7f4ef]"
                          }`}>
                            {rt?.icon ?? "📄"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-semibold truncate ${isActive ? "text-white" : "text-[#1a2535]"}`}>
                              {report.title}
                            </p>
                            <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-white/60" : "text-[#a0afc0]"}`}>
                              {rt?.label ?? report.reportType} · {formatTime(report.$createdAt)}
                            </p>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                            isActive
                              ? "bg-white/20 text-white border-white/30"
                              : REPORT_PILL[report.reportType] ?? REPORT_PILL.other
                          }`}>
                            {rt?.label?.split(" ")[0] ?? "Doc"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className={`
          fixed top-0 right-0 h-screen z-50
          bg-white border-l border-[#d4cfc6]
          transition-all duration-300 ease-in-out flex flex-col
          ${panelOpen
            ? "translate-x-0 w-full sm:w-[92vw] md:w-[70vw] lg:w-[680px]"
            : "translate-x-full w-full sm:w-[92vw] md:w-[70vw] lg:w-[680px]"
          }
        `}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2ddd4] bg-[#EFECE3] shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide">
                {panel?.type === "rx" ? "Prescription Detail" : "Report Detail"}
              </p>
              <p className="text-[14px] font-semibold text-[#1a2535] mt-0.5">
                {panel?.type === "rx" ? panel.data.diagnosis : panel?.data.title}
              </p>
            </div>
            <button onClick={() => setPanel(null)}
              className="w-9 h-9 rounded-full hover:bg-white flex items-center justify-center text-[#7a8fa8] hover:text-[#1a2535] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            {panel?.type === "rx" && (
              <PrescriptionDetail
                rx={panel.data}
                doctor={panelDoctor}
                doctorLoading={doctorLoading}
                patient={patient}
                userId={userId}
              />
            )}
            {panel?.type === "report" && (
              <ReportDetail
                report={panel.data}
                doctor={panelDoctor}
                doctorLoading={doctorLoading}
                patient={patient}
                userId={userId}
              />
            )}
          </div>
        </div>

        {panelOpen && (
          <div onClick={() => setPanel(null)} className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" />
        )}

        {/* Hint */}
        {!panelOpen && (prescriptions.length + reports.length) > 0 && (
          <div className="hidden lg:flex flex-1 items-center justify-center text-center p-8 bg-[#faf8f4]">
            <div>
              <p className="text-[36px] mb-3">👈</p>
              <p className="text-[14px] font-semibold text-[#1a2535]">Select an item</p>
              <p className="text-[12px] text-[#a0afc0] mt-1">Click any record to view full details here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}