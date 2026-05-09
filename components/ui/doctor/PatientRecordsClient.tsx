/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useRef, useTransition } from "react"
import {
  createPrescription,
  uploadMedicalReport,
  deletePrescription,
  deleteMedicalReport,
} from "@/lib/actions/records.actions"
import { useRouter } from "next/navigation"
import { getFileViewUrl } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  name: string; dosage: string; frequency: string; duration: string; instructions: string
}
interface Prescription {
  $id: string; diagnosis: string; medications: any // string | string[] | Medication[]
  notes: string; followUpDate: string | null; content?: string; $createdAt: string
}
interface MedicalReport {
  $id: string; title: string; reportType: string; notes: string
  fileId: string; fileName: string; fileSize: number; mimeType: string; $createdAt: string
}
interface PatientInfo {
  $id: string; name: string; email?: string; phone?: string
  bloodGroup?: string; allergies?: string; currentMedication?: string
  gender?: string; birthDate?: string; address?: string
  emergencyContactName?: string; emergencyContactNumber?: string
  insuranceProvider?: string; pastMedicalHistory?: string
  familyMedicalHistory?: string; occupation?: string
  height?: string; weight?: string
}
interface Props {
  doctor: { $id: string; name: string; specialization: string; profilePic?: string }
  doctorId: string; userId: string; patient: PatientInfo; patientId: string
  prescriptions: Prescription[]; reports: MedicalReport[]
}

type Tab       = "prescriptions" | "reports"
type Modal     = null | "prescription" | "report"
type PanelItem = { type: "rx"; data: Prescription } | { type: "report"; data: MedicalReport }

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "lab",       label: "Lab Report",        icon: "🧪" },
  { value: "imaging",   label: "Imaging / X-Ray",   icon: "🩻" },
  { value: "discharge", label: "Discharge Summary",  icon: "🏥" },
  { value: "referral",  label: "Referral Letter",    icon: "📨" },
  { value: "other",     label: "Other",              icon: "📄" },
]

const REPORT_PILL: Record<string, string> = {
  lab:       "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]",
  imaging:   "bg-[#dde8f5] text-[#203C67] border-[#b8d0ea]",
  discharge: "bg-[#fef6e4] text-[#92400e] border-[#fcd89a]",
  referral:  "bg-[#e6f4e8] text-[#2d6b3f] border-[#b8d4c0]",
  other:     "bg-[#f7f4ef] text-[#5a6a7e] border-[#d4cfc6]",
}

const EMPTY_MED: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
const INPUT = "w-full border border-[#d4cfc6] rounded-xl px-3.5 py-2.5 text-[12.5px] text-[#1a2535] bg-[#faf8f4] focus:outline-none focus:border-[#203C67] focus:bg-white transition-colors placeholder:text-[#b0a99e]"

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Medications can arrive in three shapes from Appwrite + local state:
 *   1. string   — the whole array JSON.stringify'd:  '[{"name":"Amox"...}]'
 *   2. string[] — each item JSON.stringify'd:        ['{"name":"Amox"...}']
 *   3. object[] — already parsed (optimistic local): [{name:"Amox"...}]
 */
function parseMedications(raw: any): Medication[] {
  if (!raw) return []

  // Case 1: single string — the whole array was stringified
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
    } catch {}
    return []
  }

  // Case 2 & 3: already an array — each item may or may not be a string
  if (Array.isArray(raw)) {
    return raw.map((m: any) => {
      if (!m) return null
      if (typeof m === "string") {
        try { return JSON.parse(m) } catch { return null }
      }
      return m
    }).filter(Boolean) as Medication[]
  }

  return []
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
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
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}
function calcAge(birthDate?: string) {
  if (!birthDate) return null
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
}
function calcBMI(h?: string, w?: string) {
  const hm = parseFloat(h ?? "") / 100
  const wk = parseFloat(w ?? "")
  if (!hm || !wk) return null
  const val = (wk / (hm * hm)).toFixed(1)
  const n = parseFloat(val)
  const info = n < 18.5 ? { label: "Underweight", color: "#b45309" }
             : n < 25   ? { label: "Normal",       color: "#3d6b3f" }
             : n < 30   ? { label: "Overweight",   color: "#b45309" }
             :             { label: "Obese",         color: "#991b1b" }
  return { val, ...info }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide">{label}</span>
      <span className="text-[11px] text-[#1a2535] leading-snug">{value}</span>
    </div>
  )
}

function DateHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[11px] font-semibold text-[#a0afc0] uppercase tracking-wider whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-[#e2ddd4]" />
    </div>
  )
}

function EmptyState({ icon, title, subtitle, action, actionLabel }: {
  icon: string; title: string; subtitle: string; action: () => void; actionLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-[#e2ddd4] rounded-2xl">
      <p className="text-[40px] mb-3">{icon}</p>
      <p className="text-[14px] font-semibold text-[#1a2535] mb-1">{title}</p>
      <p className="text-[12px] text-[#a0afc0] mb-5">{subtitle}</p>
      <button onClick={action} className="bg-[#203C67] text-white text-[12px] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#162d50] transition-colors">
        {actionLabel}
      </button>
    </div>
  )
}

// ─── Patient Side Panel ───────────────────────────────────────────────────────

function PatientSidePanel({ patient }: { patient: PatientInfo }) {
  const age         = calcAge(patient.birthDate)
  const bmi         = calcBMI(patient.height, patient.weight)
  const allergyList = patient.allergies?.split(",").map(s => s.trim()).filter(Boolean) ?? []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 pb-3 border-b border-[#e2ddd4]">
        <div className="w-14 h-14 rounded-2xl bg-[#dde8f5] flex items-center justify-center text-[18px] font-bold text-[#203C67]">
          {getInitials(patient.name)}
        </div>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#1a2535]">{patient.name}</p>
          <p className="text-[11px] text-[#a0afc0]">
            {[age ? `${age} yrs` : null, patient.gender].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {patient.bloodGroup && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">
              {patient.bloodGroup}
            </span>
          )}
          {allergyList.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]">
              ⚠ {allergyList.length} allerg{allergyList.length > 1 ? "ies" : "y"}
            </span>
          )}
        </div>
      </div>

      {(patient.height || patient.weight) && (
        <div>
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Vitals</p>
          <div className="grid grid-cols-3 gap-1.5">
            {patient.height && (
              <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                <p className="text-[8px] text-[#a0afc0]">Height</p>
                <p className="text-[13px] font-bold text-[#1a2535]">{patient.height}</p>
                <p className="text-[8px] text-[#a0afc0]">cm</p>
              </div>
            )}
            {patient.weight && (
              <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                <p className="text-[8px] text-[#a0afc0]">Weight</p>
                <p className="text-[13px] font-bold text-[#1a2535]">{patient.weight}</p>
                <p className="text-[8px] text-[#a0afc0]">kg</p>
              </div>
            )}
            {bmi && (
              <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                <p className="text-[8px] text-[#a0afc0]">BMI</p>
                <p className="text-[13px] font-bold" style={{ color: bmi.color }}>{bmi.val}</p>
                <p className="text-[8px] font-medium" style={{ color: bmi.color }}>{bmi.label}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {allergyList.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Allergies</p>
          <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-xl p-2.5 flex flex-wrap gap-1">
            {allergyList.map(a => (
              <span key={a} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{a}</span>
            ))}
          </div>
        </div>
      )}

      {(patient.phone || patient.email || patient.address) && (
        <div>
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Contact</p>
          <div className="bg-white border border-[#e2ddd4] rounded-xl p-3 flex flex-col gap-2">
            {patient.phone   && <InfoPill label="Phone"   value={patient.phone} />}
            {patient.email   && <InfoPill label="Email"   value={patient.email} />}
            {patient.address && <InfoPill label="Address" value={patient.address} />}
          </div>
        </div>
      )}

      {(patient.currentMedication || patient.pastMedicalHistory || patient.familyMedicalHistory) && (
        <div>
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">History</p>
          <div className="bg-white border border-[#e2ddd4] rounded-xl p-3 flex flex-col gap-2">
            {patient.currentMedication    && <InfoPill label="Current Medication"   value={patient.currentMedication} />}
            {patient.pastMedicalHistory   && <InfoPill label="Past Medical History" value={patient.pastMedicalHistory} />}
            {patient.familyMedicalHistory && <InfoPill label="Family History"       value={patient.familyMedicalHistory} />}
          </div>
        </div>
      )}

      {(patient.emergencyContactName || patient.insuranceProvider) && (
        <div>
          <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Emergency & Insurance</p>
          <div className="bg-white border border-[#e2ddd4] rounded-xl p-3 flex flex-col gap-2">
            {patient.emergencyContactName   && <InfoPill label="Emergency Contact" value={patient.emergencyContactName} />}
            {patient.emergencyContactNumber && <InfoPill label="Emergency Phone"   value={patient.emergencyContactNumber} />}
            {patient.insuranceProvider      && <InfoPill label="Insurance"         value={patient.insuranceProvider} />}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Prescription Detail ──────────────────────────────────────────────────────

function PrescriptionDetail({ rx }: { rx: Prescription }) {
  const meds = parseMedications(rx.medications)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[16px] font-semibold text-[#1a2535]">{rx.diagnosis}</p>
          <p className="text-[11px] text-[#a0afc0] mt-0.5">
            {formatDate(rx.$createdAt)} · {formatTime(rx.$createdAt)}
          </p>
        </div>
        {rx.followUpDate && (
          <div className="bg-[#dde8f5] border border-[#c8d8ea] rounded-xl px-3 py-1.5 text-right flex-shrink-0">
            <p className="text-[9px] font-semibold text-[#8FABD4] uppercase tracking-wide">Follow-up</p>
            <p className="text-[12px] font-semibold text-[#203C67]">{formatDate(rx.followUpDate)}</p>
          </div>
        )}
      </div>

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
                  <div className="w-5 h-5 rounded-md bg-[#dde8f5] flex items-center justify-center text-[9px] font-bold text-[#203C67] flex-shrink-0">
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

      {rx.content && (
        <div>
          <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Clinical Notes</p>
          <div
            className="bg-white border border-[#e2ddd4] rounded-xl px-4 py-3 text-[12px] text-[#1a2535] leading-relaxed prose prose-sm max-w-none"
            style={{ fontFamily: "Georgia, serif" }}
            dangerouslySetInnerHTML={{ __html: rx.content }}
          />
        </div>
      )}

      {rx.notes && (
        <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-xl p-3">
          <p className="text-[9px] font-semibold text-[#92400e] uppercase tracking-wide mb-1">Doctor&apos;s Notes</p>
          <p className="text-[12px] text-[#5a6a7e] leading-relaxed">{rx.notes}</p>
        </div>
      )}
    </div>
  )
}

// ─── Report Detail ────────────────────────────────────────────────────────────

function ReportDetail({ report }: { report: MedicalReport }) {
  const rt      = REPORT_TYPES.find(t => t.value === report.reportType)
  const viewUrl = getFileViewUrl(report.fileId) as any

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#f7f4ef] border border-[#e2ddd4] flex items-center justify-center text-2xl flex-shrink-0">
          {rt?.icon ?? "📄"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-semibold text-[#1a2535]">{report.title}</p>
          <p className="text-[11px] text-[#a0afc0] mt-0.5">
            {formatDate(report.$createdAt)} · {formatTime(report.$createdAt)}
          </p>
          <span className={`mt-1.5 inline-block text-[10px] font-semibold border rounded-full px-2.5 py-0.5 ${REPORT_PILL[report.reportType] ?? REPORT_PILL.other}`}>
            {rt?.label ?? report.reportType}
          </span>
        </div>
      </div>

      <div className="bg-white border border-[#e2ddd4] rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#f7f4ef] flex items-center justify-center flex-shrink-0">
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
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl bg-[#203C67] text-white hover:bg-[#162d50] transition-colors flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          View File
        </a>
      </div>

      {report.notes && (
        <div>
          <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide mb-2">Notes</p>
          <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl p-3">
            <p className="text-[12px] text-[#5a6a7e] leading-relaxed">{report.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientRecordsClient({
  doctor, doctorId, userId, patient, patientId,
  prescriptions: initRx, reports: initReports,
}: Props) {
  const router = useRouter()
  const [tab, setTab]         = useState<Tab>("prescriptions")
  const [modal, setModal]     = useState<Modal>(null)
  const [panel, setPanel]     = useState<PanelItem | null>(null)
  const [isPending, startTransition] = useTransition()

  const [diagnosis, setDiagnosis]     = useState("")
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }])
  const [rxNotes, setRxNotes]         = useState("")
  const [followUp, setFollowUp]       = useState("")
  const [rxError, setRxError]         = useState("")

  const [reportTitle, setReportTitle] = useState("")
  const [reportType, setReportType]   = useState("lab")
  const [reportNotes, setReportNotes] = useState("")
  const [reportFile, setReportFile]   = useState<File | null>(null)
  const [reportError, setReportError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [prescriptions, setPrescriptions] = useState(initRx)
  const [reports, setReports]             = useState(initReports)

  function resetRxForm() {
    setDiagnosis(""); setMedications([{ ...EMPTY_MED }]); setRxNotes(""); setFollowUp(""); setRxError("")
  }
  function resetReportForm() {
    setReportTitle(""); setReportType("lab"); setReportNotes(""); setReportFile(null); setReportError("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleCreatePrescription() {
    if (!diagnosis.trim()) { setRxError("Diagnosis is required."); return }
    if (medications.some(m => !m.name.trim())) { setRxError("All medication names are required."); return }
    setRxError("")
    startTransition(async () => {
      try {
        const doc = await createPrescription({
          doctorId, patientId, diagnosis, medications,
          notes: rxNotes, followUpDate: followUp || undefined,
          appointmentId: "", type: "typed",
        })
        // Store medications as objects so parseMedications works immediately
        setPrescriptions(prev => [{ ...doc, medications }, ...prev])
        setModal(null); resetRxForm()
      } catch { setRxError("Failed to save. Please try again.") }
    })
  }

  async function handleUploadReport() {
    if (!reportTitle.trim()) { setReportError("Title is required."); return }
    if (!reportFile) { setReportError("Please select a file."); return }
    setReportError("")
    const formData = new FormData(); formData.append("file", reportFile)
    startTransition(async () => {
      try {
        const doc = await uploadMedicalReport({
          doctorId, patientId, title: reportTitle,
          reportType: reportType as any, notes: reportNotes, file: formData,
        })
        setReports(prev => [doc, ...prev]); setModal(null); resetReportForm()
      } catch (error) { setReportError(`Upload failed. Please try again. error: ${error}`) }
    })
  }

  async function handleDeleteRx(rxId: string) {
    if (!confirm("Delete this prescription?")) return
    startTransition(async () => {
      await deletePrescription(rxId, doctorId, patientId)
      setPrescriptions(prev => prev.filter(r => r.$id !== rxId))
      if (panel?.type === "rx" && panel.data.$id === rxId) setPanel(null)
    })
  }

  async function handleDeleteReport(reportId: string, fileId: string) {
    if (!confirm("Delete this report and its file?")) return
    startTransition(async () => {
      await deleteMedicalReport(reportId, fileId, doctorId, patientId)
      setReports(prev => prev.filter(r => r.$id !== reportId))
      if (panel?.type === "report" && panel.data.$id === reportId) setPanel(null)
    })
  }

  // Safe med count for list row subtitle
  function medCount(rx: Prescription): number {
    return parseMedications(rx.medications).length
  }

  const rxGroups     = groupByDate(prescriptions)
  const reportGroups = groupByDate(reports)
  const panelOpen    = panel !== null

  return (
  <div className="min-h-screen bg-[#EFECE3] font-sans flex flex-col overflow-x-hidden">

    {/* ── Header ── */}
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-4 md:px-6 py-3 border-b border-[#d4cfc6] flex-shrink-0"
      style={{ background: "rgba(239,236,227,0.92)", backdropFilter: "blur(14px)" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full border border-[#d4cfc6] flex items-center justify-center text-[#7a8fa8] hover:border-[#203C67] hover:text-[#203C67] transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M5 12l7 7M5 12l7-7"/>
          </svg>
        </button>

        <div className="min-w-0">
          <h1 className="text-[14px] sm:text-[16px] font-semibold text-[#1a2535] truncate">
            {patient.name}
          </h1>

          <p className="text-[10px] sm:text-[11px] text-[#a0afc0] truncate">
            Dr. {doctor.name} · {doctor.specialization}
          </p>
        </div>
      </div>

      <button
        onClick={() => setModal(tab === "prescriptions" ? "prescription" : "report")}
        className="flex items-center gap-1.5 sm:gap-2 bg-[#203C67] text-white text-[11px] sm:text-[12px] font-semibold px-3 sm:px-4 py-2 rounded-xl hover:bg-[#162d50] transition-colors flex-shrink-0"
      >
        <span className="text-base leading-none">+</span>
        <span className="hidden sm:inline">
          {tab === "prescriptions" ? "New Prescription" : "Upload Report"}
        </span>
      </button>
    </header>

    {/* ── Body ── */}
    <div className="flex flex-1 min-h-0 flex-col lg:flex-row">

      {/* List column */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          panelOpen
            ? "w-full lg:w-[380px] lg:min-w-[320px]"
            : "flex-1"
        } border-r border-[#d4cfc6] overflow-y-auto`}
      >
        <div className="p-3 sm:p-4 flex flex-col gap-3">

          {/* Patient strip */}
          <div className="bg-white border border-[#e2ddd4] rounded-2xl px-3 sm:px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[12px] font-bold text-[#203C67] flex-shrink-0">
              {getInitials(patient.name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] sm:text-[13px] font-semibold text-[#1a2535] truncate">
                {patient.name}
              </p>

              <p className="text-[9px] sm:text-[10px] text-[#a0afc0] truncate">
                {[patient.bloodGroup, patient.allergies ? "⚠ allergies" : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="hidden sm:flex gap-1.5 flex-shrink-0">
              <span className="text-[10px] bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea] rounded-full px-2 py-0.5 font-medium">
                {prescriptions.length} Rx
              </span>

              <span className="text-[10px] bg-[#f7f4ef] text-[#5a6a7e] border border-[#d4cfc6] rounded-full px-2 py-0.5 font-medium">
                {reports.length} Reports
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-[#e2ddd4] rounded-xl p-1 sticky top-0 z-10">
            {(["prescriptions", "reports"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setPanel(null) }}
                className={`flex-1 py-2 rounded-lg text-[11px] sm:text-[12px] font-medium transition-all ${
                  tab === t
                    ? "bg-[#203C67] text-white shadow-sm"
                    : "text-[#7a8fa8] hover:text-[#203C67]"
                }`}
              >
                {t === "prescriptions"
                  ? `💊 Rx (${prescriptions.length})`
                  : `📄 Reports (${reports.length})`}
              </button>
            ))}
          </div>

          {/* Prescriptions list */}
          {tab === "prescriptions" && (
            <div className="flex flex-col gap-1">
              {prescriptions.length === 0 ? (
                <EmptyState
                  icon="💊"
                  title="No prescriptions yet"
                  subtitle="Create the first prescription for this patient"
                  action={() => setModal("prescription")}
                  actionLabel="New Prescription"
                />
              ) : rxGroups.map(group => (
                <div key={group.label} className="flex flex-col gap-1.5 mb-1">
                  <DateHeading label={group.label} />

                  {group.items.map(rx => {
                    const isActive = panel?.type === "rx" && panel.data.$id === rx.$id

                    return (
                      <div
                        key={rx.$id}
                        onClick={() => setPanel({ type: "rx", data: rx })}
                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all group ${
                          isActive
                            ? "bg-[#203C67] border-[#203C67]"
                            : "bg-white border-[#e2ddd4] hover:border-[#8FABD4] hover:bg-[#f7f9fc]"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                          isActive ? "bg-white/20" : "bg-[#dde8f5]"
                        }`}>
                          💊
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] sm:text-[13px] font-semibold truncate ${
                            isActive ? "text-white" : "text-[#1a2535]"
                          }`}>
                            {rx.diagnosis}
                          </p>

                          <p className={`text-[9px] sm:text-[10px] mt-0.5 ${
                            isActive ? "text-white/60" : "text-[#a0afc0]"
                          }`}>
                            {medCount(rx)} med{medCount(rx) !== 1 ? "s" : ""} · {formatTime(rx.$createdAt)}
                          </p>
                        </div>

                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteRx(rx.$id) }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0 ${
                            isActive
                              ? "hover:bg-white/20 text-white/70 hover:text-white"
                              : "hover:bg-red-50 text-[#c0b9b0] hover:text-red-400"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Reports list */}
          {tab === "reports" && (
            <div className="flex flex-col gap-1">
              {reports.length === 0 ? (
                <EmptyState
                  icon="📄"
                  title="No reports uploaded"
                  subtitle="Upload the first medical report for this patient"
                  action={() => setModal("report")}
                  actionLabel="Upload Report"
                />
              ) : reportGroups.map(group => (
                <div key={group.label} className="flex flex-col gap-1.5 mb-1">
                  <DateHeading label={group.label} />

                  {group.items.map(report => {
                    const isActive = panel?.type === "report" && panel.data.$id === report.$id
                    const rt = REPORT_TYPES.find(t => t.value === report.reportType)

                    return (
                      <div
                        key={report.$id}
                        onClick={() => setPanel({ type: "report", data: report })}
                        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl border cursor-pointer transition-all group ${
                          isActive
                            ? "bg-[#203C67] border-[#203C67]"
                            : "bg-white border-[#e2ddd4] hover:border-[#8FABD4] hover:bg-[#f7f9fc]"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                          isActive ? "bg-white/20" : "bg-[#f7f4ef]"
                        }`}>
                          {rt?.icon ?? "📄"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] sm:text-[13px] font-semibold truncate ${
                            isActive ? "text-white" : "text-[#1a2535]"
                          }`}>
                            {report.title}
                          </p>

                          <p className={`text-[9px] sm:text-[10px] mt-0.5 truncate ${
                            isActive ? "text-white/60" : "text-[#a0afc0]"
                          }`}>
                            {rt?.label ?? report.reportType} · {formatTime(report.$createdAt)}
                          </p>
                        </div>

                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteReport(report.$id, report.fileId) }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0 ${
                            isActive
                              ? "hover:bg-white/20 text-white/70 hover:text-white"
                              : "hover:bg-red-50 text-[#c0b9b0] hover:text-red-400"
                          }`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Detail Panel */}
<div
  className={`
    fixed top-0 right-0 h-screen z-50
    bg-white border-l border-[#d4cfc6]
    transition-all duration-300 ease-in-out
    flex flex-col
    ${panelOpen
      ? "translate-x-0 w-full sm:w-[92vw] md:w-[78vw] lg:w-[900px]"
      : "translate-x-full w-full sm:w-[92vw] md:w-[78vw] lg:w-[900px]"
    }
  `}
>
  {/* Header */}
  <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[#e2ddd4] bg-[#EFECE3] shrink-0">
    <div>
      <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide">
        {panel?.type === "rx" ? "Prescription Detail" : "Report Detail"}
      </p>

      <p className="text-[14px] font-semibold text-[#1a2535] mt-0.5">
        {panel?.type === "rx"
          ? panel.data.diagnosis
          : panel?.data.title}
      </p>
    </div>

    <button
      onClick={() => setPanel(null)}
      className="w-9 h-9 rounded-full hover:bg-white flex items-center justify-center text-[#7a8fa8] hover:text-[#1a2535] transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>

  {/* Content */}
  <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

    {/* Patient sidebar */}
    <div className="
      w-full lg:w-[240px]
      lg:min-w-[240px]
      border-b lg:border-b-0 lg:border-r
      border-[#e2ddd4]
      bg-[#f7f4ef]
      overflow-y-auto
      p-4
    ">
      <PatientSidePanel patient={patient} />
    </div>

    {/* Detail content */}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
      {panel?.type === "rx" && (
        <PrescriptionDetail rx={panel.data} />
      )}

      {panel?.type === "report" && (
        <ReportDetail report={panel.data} />
      )}
    </div>
  </div>
</div>

{/* Backdrop */}
{panelOpen && (
  <div
    onClick={() => setPanel(null)}
    className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
  />
)}

      {/* Nothing selected hint */}
      {!panelOpen && prescriptions.length + reports.length > 0 && (
        <div className="hidden lg:flex flex-1 items-center justify-center text-center p-8 bg-[#faf8f4]">
          <div>
            <p className="text-[36px] mb-3">👈</p>
            <p className="text-[14px] font-semibold text-[#1a2535]">Select an item</p>
            <p className="text-[12px] text-[#a0afc0] mt-1">
              Click any prescription or report to view details here
            </p>
          </div>
        </div>
      )}
    </div>
{/* ───────────────────────── MODALS ───────────────────────── */}

{modal && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-3 sm:p-5">
    
    {/* Modal Card */}
    <div className="w-full max-w-3xl bg-white border border-[#e2ddd4] rounded-[28px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#ece7de] bg-[#faf8f4]">
        <div>
          <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-[0.18em]">
            {modal === "prescription" ? "Doctor Prescription" : "Medical Report"}
          </p>

          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1a2535] mt-0.5">
            {modal === "prescription"
              ? "Create Prescription"
              : "Upload Report"}
          </h2>
        </div>

        <button
          onClick={() => {
            setModal(null)

            if (modal === "prescription") resetRxForm()
            else resetReportForm()
          }}
          className="w-10 h-10 rounded-full hover:bg-white border border-transparent hover:border-[#e2ddd4] flex items-center justify-center text-[#7a8fa8] hover:text-[#1a2535] transition-all"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto p-5 sm:p-6">

        {/* ───────── PRESCRIPTION MODAL ───────── */}
        {modal === "prescription" && (
          <div className="flex flex-col gap-5">

            {/* Diagnosis */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Diagnosis
              </label>

              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter diagnosis..."
                className={INPUT}
              />
            </div>

            {/* Medications */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                  Medications
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setMedications(prev => [...prev, { ...EMPTY_MED }])
                  }
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#dde8f5] text-[#203C67] hover:bg-[#cfe0f1] transition-colors"
                >
                  + Add Medicine
                </button>
              </div>

              {medications.map((med, i) => (
                <div
                  key={i}
                  className="border border-[#e2ddd4] rounded-2xl p-4 bg-[#faf8f4] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#203C67]">
                      Medicine {i + 1}
                    </p>

                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMedications(prev =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-[11px] text-red-500 font-medium hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    placeholder="Medicine name"
                    value={med.name}
                    onChange={(e) => {
                      const copy = [...medications]
                      copy[i].name = e.target.value
                      setMedications(copy)
                    }}
                    className={INPUT}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const copy = [...medications]
                        copy[i].dosage = e.target.value
                        setMedications(copy)
                      }}
                      className={INPUT}
                    />

                    <input
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const copy = [...medications]
                        copy[i].frequency = e.target.value
                        setMedications(copy)
                      }}
                      className={INPUT}
                    />

                    <input
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => {
                        const copy = [...medications]
                        copy[i].duration = e.target.value
                        setMedications(copy)
                      }}
                      className={INPUT}
                    />
                  </div>

                  <textarea
                    placeholder="Instructions..."
                    value={med.instructions}
                    onChange={(e) => {
                      const copy = [...medications]
                      copy[i].instructions = e.target.value
                      setMedications(copy)
                    }}
                    className={`${INPUT} min-h-[80px] resize-none`}
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Doctor Notes
              </label>

              <textarea
                value={rxNotes}
                onChange={(e) => setRxNotes(e.target.value)}
                placeholder="Additional notes..."
                className={`${INPUT} min-h-[120px] resize-none`}
              />
            </div>

            {/* Followup */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Follow-up Date
              </label>

              <input
                type="date"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                className={INPUT}
              />
            </div>

            {/* Error */}
            {rxError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] rounded-xl px-4 py-3">
                {rxError}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModal(null)
                  resetRxForm()
                }}
                className="px-5 py-2.5 rounded-xl border border-[#d4cfc6] text-[12px] font-semibold text-[#5a6a7e] hover:bg-[#faf8f4]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleCreatePrescription}
                className="px-5 py-2.5 rounded-xl bg-[#203C67] text-white text-[12px] font-semibold hover:bg-[#162d50] disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Prescription"}
              </button>
            </div>
          </div>
        )}

        {/* ───────── REPORT MODAL ───────── */}
        {modal === "report" && (
          <div className="flex flex-col gap-5">

            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Report Title
              </label>

              <input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title..."
                className={INPUT}
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Report Type
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {REPORT_TYPES.map(rt => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setReportType(rt.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      reportType === rt.value
                        ? "bg-[#203C67] border-[#203C67] text-white"
                        : "bg-[#faf8f4] border-[#e2ddd4] hover:border-[#8FABD4]"
                    }`}
                  >
                    <p className="text-lg">{rt.icon}</p>
                    <p className="text-[11px] font-semibold mt-1">
                      {rt.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Upload File
              </label>

              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) =>
                  setReportFile(e.target.files?.[0] || null)
                }
                className={INPUT}
              />

              {reportFile && (
                <div className="bg-[#faf8f4] border border-[#e2ddd4] rounded-xl px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#1a2535] truncate">
                    {reportFile.name}
                  </p>

                  <p className="text-[10px] text-[#a0afc0] mt-1">
                    {formatBytes(reportFile.size)}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[#7a8fa8] uppercase tracking-wide">
                Notes
              </label>

              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="Additional report notes..."
                className={`${INPUT} min-h-[120px] resize-none`}
              />
            </div>

            {/* Error */}
            {reportError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] rounded-xl px-4 py-3">
                {reportError}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModal(null)
                  resetReportForm()
                }}
                className="px-5 py-2.5 rounded-xl border border-[#d4cfc6] text-[12px] font-semibold text-[#5a6a7e] hover:bg-[#faf8f4]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleUploadReport}
                className="px-5 py-2.5 rounded-xl bg-[#203C67] text-white text-[12px] font-semibold hover:bg-[#162d50] disabled:opacity-50"
              >
                {isPending ? "Uploading..." : "Upload Report"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}
  </div>
)
}