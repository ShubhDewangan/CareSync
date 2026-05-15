"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  createPrescription,
  getPrescriptionByAppointment,
  updatePrescription,
  uploadMedicalReport,
} from "@/lib/actions/records.actions"
import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean
  onClose: () => void
  // Appointment
  appointmentId: string
  appointmentDate?: string
  appointmentReason: string
  appointmentStatus?: string
  appointmentNote?: string
  // Doctor
  doctorId: string
  userId: string
  doctorName: string
  doctorSpecialization: string
  doctorHospital?: string
  doctorExperience?: string
  doctorRating?: number
  doctorTotalPatients?: number
  // Patient
  patientId: string
  patientName: string
  patientAge?: number
  patientGender?: string
  patientBloodGroup?: string
  patientAllergies?: string
  patientCurrentMedication?: string
  patientPastMedicalHistory?: string
  patientFamilyMedicalHistory?: string
  patientOccupation?: string
  patientAddress?: string
  patientPhone?: string
  patientEmail?: string
  patientHeight?: string
  patientWeight?: string
  patientInsuranceProvider?: string
  patientInsurancePolicyNumber?: string
  patientEmergencyContactName?: string
  patientEmergencyContactNumber?: string
  patientPrimaryDoctor?: string
}

type PanelTab   = "prescription" | "records"
type EditorMode = "typed" | "image"
type ReportType = "lab" | "imaging" | "discharge" | "referral" | "other"

interface MedRow {
  id: string; name: string; dosage: string
  frequency: string; duration: string; instructions: string
}

interface UploadedRecord {
  id: string
  title: string
  reportType: ReportType
  fileName: string
  notes: string
  uploadedAt: string
}

const TOOLBAR = [
  { cmd: "bold",                icon: "B",  title: "Bold"      },
  { cmd: "italic",              icon: "I",  title: "Italic"    },
  { cmd: "underline",           icon: "U",  title: "Underline" },
  { cmd: "insertUnorderedList", icon: "≡",  title: "Bullets"   },
  { cmd: "insertOrderedList",   icon: "1.", title: "Numbered"  },
] as const

const REPORT_TYPES: { value: ReportType; label: string; icon: string }[] = [
  { value: "lab",       label: "Lab Report",          icon: "🧪" },
  { value: "imaging",   label: "Imaging / Scan",       icon: "🩻" },
  { value: "discharge", label: "Discharge Summary",    icon: "🏥" },
  { value: "referral",  label: "Referral Letter",      icon: "📨" },
  { value: "other",     label: "Other",                icon: "📄" },
]

const newRow = (): MedRow => ({
  id: Math.random().toString(36).slice(2),
  name: "", dosage: "", frequency: "", duration: "", instructions: "",
})

const hoursAgo = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
  })
}
function calcBMI(h?: string, w?: string) {
  const hm = parseFloat(h ?? "") / 100
  const wk = parseFloat(w ?? "")
  if (!hm || !wk) return null
  return (wk / (hm * hm)).toFixed(1)
}
function bmiInfo(val: string) {
  const n = parseFloat(val)
  if (n < 18.5) return { label: "Underweight", color: "#b45309" }
  if (n < 25)   return { label: "Normal",      color: "#3d6b3f" }
  if (n < 30)   return { label: "Overweight",  color: "#b45309" }
  return              { label: "Obese",         color: "#991b1b" }
}
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const INPUT = "w-full border border-[#d4cfc6] rounded-xl px-3 py-2 text-[12px] text-[#1a2535] bg-[#faf8f4] focus:outline-none focus:border-[#203C67] focus:bg-white/50 transition-colors placeholder:text-[#b0a99e] font-[inherit]"

function SL({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] font-semibold text-[#8a9ab0] uppercase tracking-[0.08em] mb-1.5">{children}</p>
}
function IP({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide">{label}</span>
      <span className={`text-[11px] text-[#1a2535] leading-snug ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function PrescriptionModal(props: Props) {
  const {
    isOpen, onClose,
    appointmentId, appointmentDate, appointmentReason, appointmentStatus, appointmentNote,
    doctorId, userId, doctorName, doctorSpecialization, doctorHospital,
    patientId, patientName, patientAge, patientGender,
    patientBloodGroup, patientAllergies,
    patientHeight, patientWeight,
  } = props

  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mounted, setMounted]   = useState(false)
  const [tab, setTab]           = useState<PanelTab>("prescription")

  // ── Prescription state ────────────────────────────────────────────────────
  const [rxLoading, setRxLoading]                 = useState(true)
  const [mode, setMode]                           = useState<EditorMode>("typed")
  const [diagnosis, setDiagnosis]                 = useState("")
  const [followUpDate, setFollowUpDate]           = useState("")
  const [notes, setNotes]                         = useState("")
  const [meds, setMeds]                           = useState<MedRow[]>([newRow()])
  const [imagePreview, setImagePreview]           = useState<string | null>(null)
  const [existingId, setExistingId]               = useState<string | null>(null)
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null)
  const [isLocked, setIsLocked]                   = useState(false)
  const [saving, setSaving]                       = useState(false)
  const [saved, setSaved]                         = useState(false)
  const [rxError, setRxError]                     = useState<string | null>(null)

  // ── Records / upload state ────────────────────────────────────────────────
  const [uploadedRecords, setUploadedRecords]   = useState<UploadedRecord[]>([])
  const [selectedFile, setSelectedFile]         = useState<File | null>(null)
  const [recordTitle, setRecordTitle]           = useState("")
  const [reportType, setReportType]             = useState<ReportType>("lab")
  const [recordNotes, setRecordNotes]           = useState("")
  const [uploading, setUploading]               = useState(false)
  const [uploadError, setUploadError]           = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess]       = useState(false)

  // Animate in
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setTimeout(() => setMounted(true), 20)
    } else {
      document.body.style.overflow = ""
      setMounted(false)
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Fetch prescription when opened
  useEffect(() => {
    if (!isOpen) return
    setRxLoading(true)
    getPrescriptionByAppointment(appointmentId)
      .then((doc: any) => {
        if (!doc) return
        setExistingId(doc.$id)
        setExistingCreatedAt(doc.$createdAt)
        setIsLocked(hoursAgo(doc.$createdAt) > 24)
        setMode(doc.type as EditorMode)
        setNotes(doc.notes ?? "")
        setDiagnosis(doc.diagnosis ?? "")
        if (doc.medications?.length) {
          try {
            const parsed = doc.medications.map((m: any) => typeof m === "string" ? JSON.parse(m) : m)
            setMeds(parsed.map((m: any) => ({ ...m, id: Math.random().toString(36).slice(2) })))
          } catch {}
        }
        if (doc.followUpDate) setFollowUpDate(new Date(doc.followUpDate).toISOString().split("T")[0])
        if (doc.type === "typed" && doc.content && editorRef.current)
          setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = doc.content }, 80)
      })
      .finally(() => setRxLoading(false))
  }, [isOpen, appointmentId])

  // ── Prescription save ─────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true); setRxError(null)
    try {
      const content     = mode === "typed" ? (editorRef.current?.innerHTML ?? "") : undefined
      const medsToSave  = meds.filter(m => m.name).map(({ id, ...rest }) => rest)
      const followUpISO = followUpDate ? new Date(followUpDate).toISOString() : undefined
      if (existingId) {
        await updatePrescription({ prescriptionId: existingId, content, notes: notes || undefined, diagnosis: diagnosis || undefined, medications: medsToSave, followUpDate: followUpISO })
      } else {
        await createPrescription({ appointmentId, patientId, doctorId, type: mode, content, notes: notes || undefined, diagnosis: diagnosis || "", medications: medsToSave, followUpDate: followUpISO })
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setRxError(err?.message ?? "Failed to save.")
    } finally { setSaving(false) }
  }, [mode, notes, diagnosis, meds, followUpDate, existingId, appointmentId, patientId, doctorId])

  // ── Record upload ─────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile || !recordTitle.trim()) {
      setUploadError("Please select a file and enter a title.")
      return
    }
    setUploading(true); setUploadError(null)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      await uploadMedicalReport({
        doctorId,
        patientId,
        appointmentId,
        title: recordTitle.trim(),
        reportType,
        notes: recordNotes.trim() || undefined,
        file: formData,
      })
      // Add to local list so doctor sees it immediately
      setUploadedRecords(prev => [{
        id: Math.random().toString(36).slice(2),
        title: recordTitle.trim(),
        reportType,
        fileName: selectedFile.name,
        notes: recordNotes.trim(),
        uploadedAt: new Date().toISOString(),
      }, ...prev])
      // Reset form
      setSelectedFile(null)
      setRecordTitle("")
      setReportType("lab")
      setRecordNotes("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: any) {
      setUploadError(err?.message ?? "Upload failed. Please try again.")
    } finally { setUploading(false) }
  }

  const execCmd = (cmd: string) => { document.execCommand(cmd, false); editorRef.current?.focus() }

  const bmiVal      = calcBMI(patientHeight, patientWeight)
  const bmiData     = bmiVal ? bmiInfo(bmiVal) : null
  const allergyList = patientAllergies?.split(",").map(s => s.trim()).filter(Boolean) ?? []

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: mounted ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0)",
          backdropFilter: mounted ? "blur(3px)" : "blur(0px)",
        }}
        onClick={onClose}
      />

      {/* Slide-over */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "min(860px, 95vw)",
          background: "#EFECE3",
          borderLeft: "1px solid #d4cfc6",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          transform: mounted ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.32s cubic-bezier(0.32,0,0.08,1)",
        }}
      >

        {/* ── Header ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-[#d4cfc6]"
          style={{ background: "rgba(239,236,227,0.96)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[13px] font-bold text-[#203C67] flex-shrink-0">
              {patientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#1a2535] truncate">{patientName}</p>
              <p className="text-[10px] text-[#a0afc0]">
                {appointmentDate ? `${fmtDate(appointmentDate)} · ${fmtTime(appointmentDate)}` : ""}
                {appointmentReason ? ` · ${appointmentReason}` : ""}
              </p>
            </div>
            {appointmentStatus && (
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                appointmentStatus === "scheduled" ? "bg-[#dde8f5] text-[#203C67] border-[#b8d0ea]"
                : appointmentStatus === "completed" ? "bg-[#e6f4e8] text-[#2d6b3f] border-[#b8d4c0]"
                : "bg-[#fef6e4] text-[#92400e] border-[#fcd89a]"
              }`}>{appointmentStatus}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {tab === "prescription" && (
              <>
                <span className={`text-[11px] text-[#3d6b3f] transition-all duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>✓ Saved</span>
                {rxError && <p className="text-[10px] text-red-500 max-w-[160px] truncate">{rxError}</p>}
                <button
                  onClick={handleSave}
                  disabled={saving || isLocked}
                  className="text-[12px] font-semibold px-4 py-1.5 rounded-xl bg-[#203C67] text-white hover:bg-[#162d50] disabled:opacity-40 transition-colors"
                >
                  {saving ? "Saving…" : existingId ? "Update" : "Save"}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#e2ddd4] flex items-center justify-center text-[#a0afc0] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex-shrink-0 flex border-b border-[#d4cfc6] bg-[#f7f4ef]">
          {([
            { key: "prescription", icon: "📋", label: "Prescription" },
            { key: "records",      icon: "📁", label: "Add Records"  },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[12px] font-semibold border-b-2 transition-all ${
                tab === t.key
                  ? "border-[#203C67] text-[#203C67] bg-white/50"
                  : "border-transparent text-[#a0afc0] hover:text-[#5a6a7e] hover:bg-[#ede9e1]"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ PRESCRIPTION TAB ════ */}
          {tab === "prescription" && (
            <div className="flex gap-4 p-4 min-h-full">

              {/* Left sidebar */}
              <aside className="w-[180px] flex-shrink-0 flex flex-col gap-3">

                <div className="bg-[#dde8f5] border border-[#c8d8ea] rounded-2xl p-3">
                  <p className="text-[10px] font-bold text-[#203C67] mb-1">📋 About Prescriptions</p>
                  <p className="text-[10px] text-[#5a7a9a] leading-relaxed">
                    Write the diagnosis, add medications with dosage and instructions, then save. Editable for <strong>24 hours</strong> after creation. A prescription must be saved before marking the appointment complete.
                  </p>
                  {existingId && (
                    <div className={`mt-2 pt-2 border-t border-[#c8d8ea] flex items-center gap-1 text-[10px] font-semibold ${isLocked ? "text-[#9a9690]" : "text-[#2d6b3f]"}`}>
                      <span>{isLocked ? "🔒" : "✏️"}</span>
                      {isLocked ? "Locked" : "Editable · 24hr"}
                    </div>
                  )}
                </div>

                {/* Patient card */}
                <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                  <div className="flex flex-col items-center gap-1.5 pb-3 border-b border-[#ede9e1]">
                    <div className="w-10 h-10 rounded-xl bg-[#dde8f5] flex items-center justify-center text-[13px] font-bold text-[#203C67]">
                      {patientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-[12px] font-semibold text-[#1a2535] text-center">{patientName}</p>
                    <p className="text-[10px] text-[#a0afc0] text-center">
                      {[patientAge ? `${patientAge} yrs` : null, patientGender].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex gap-1 flex-wrap justify-center mt-0.5">
                      {patientBloodGroup && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{patientBloodGroup}</span>
                      )}
                      {allergyList.length > 0 && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]">⚠ {allergyList.length} allergy</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-2.5 flex flex-col gap-2">
                    <IP label="Date"   value={appointmentDate ? fmtDate(appointmentDate) : undefined} />
                    <IP label="Time"   value={appointmentDate ? fmtTime(appointmentDate) : undefined} />
                    <IP label="Reason" value={appointmentReason} />
                    {appointmentNote && (
                      <div className="bg-[#faf8f4] rounded-lg p-2 border border-[#ede9e1] mt-0.5">
                        <p className="text-[9px] font-bold text-[#a0afc0] uppercase tracking-wide mb-0.5">Note</p>
                        <p className="text-[10px] text-[#5a6a7e] leading-relaxed">{appointmentNote}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vitals */}
                {(patientHeight || patientWeight) && (
                  <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                    <SL>Vitals</SL>
                    <div className="grid grid-cols-2 gap-1.5">
                      {patientHeight && (
                        <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                          <p className="text-[8px] text-[#a0afc0] uppercase tracking-wide">Ht</p>
                          <p className="text-[14px] font-bold text-[#1a2535]">{patientHeight}</p>
                          <p className="text-[8px] text-[#a0afc0]">cm</p>
                        </div>
                      )}
                      {patientWeight && (
                        <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                          <p className="text-[8px] text-[#a0afc0] uppercase tracking-wide">Wt</p>
                          <p className="text-[14px] font-bold text-[#1a2535]">{patientWeight}</p>
                          <p className="text-[8px] text-[#a0afc0]">kg</p>
                        </div>
                      )}
                      {bmiVal && (
                        <div className="col-span-2 bg-[#f7f4ef] rounded-xl p-2 text-center">
                          <p className="text-[8px] text-[#a0afc0] uppercase tracking-wide">BMI</p>
                          <p className="text-[15px] font-bold" style={{ color: bmiData?.color }}>{bmiVal}</p>
                          <p className="text-[9px] font-medium" style={{ color: bmiData?.color }}>{bmiData?.label}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Doctor */}
                <div className="bg-[#203C67] rounded-2xl p-3">
                  <p className="text-[8px] font-bold text-[#8FABD4] uppercase tracking-wide mb-1.5">Prescribing</p>
                  <p className="text-[12px] font-semibold text-white">{doctorName}</p>
                  <p className="text-[10px] text-[#8FABD4] mt-0.5">{doctorSpecialization}</p>
                  {doctorHospital && <p className="text-[10px] text-[#6a8ab0] mt-0.5">{doctorHospital}</p>}
                </div>
              </aside>

              {/* Main editor */}
              <main className="flex-1 flex flex-col gap-3 min-w-0">

                {allergyList.length > 0 && (
                  <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-2xl px-3 py-2.5 flex items-start gap-2">
                    <span className="flex-shrink-0">⚠️</span>
                    <div>
                      <p className="text-[11px] font-bold text-[#92400e]">Known Allergies — Review Before Prescribing</p>
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {allergyList.map((a: string) => (
                          <span key={a} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {rxLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-[#d4cfc6] border-t-[#203C67] rounded-full animate-spin" />
                  </div>
                ) : (<>

                  <div className="grid grid-cols-[1fr_170px] gap-3">
                    <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                      <SL>Diagnosis / Chief Complaint</SL>
                      <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} disabled={isLocked}
                        placeholder="e.g. Acute pharyngitis, Type 2 Diabetes…" className={INPUT} />
                    </div>
                    <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                      <SL>Follow-up Date</SL>
                      <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} disabled={isLocked} className={INPUT} />
                    </div>
                  </div>

                  {/* Medications table */}
                  <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <SL>Medications</SL>
                      {!isLocked && (
                        <button onClick={() => setMeds(m => [...m, newRow()])}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea] hover:bg-[#c8d8ea] transition-colors">
                          + Add Row
                        </button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-[#f7f4ef]">
                            {["Medication", "Dosage", "Frequency", "Duration", "Instructions", ""].map(h => (
                              <th key={h} className="text-left px-2.5 py-2 text-[9px] font-semibold text-[#a0afc0] uppercase tracking-wide border-b border-[#ede9e1]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {meds.map((row, i) => (
                            <tr key={row.id} className={i % 2 === 0 ? "" : "bg-[#faf8f4]"}>
                              {(["name", "dosage", "frequency", "duration", "instructions"] as (keyof MedRow)[]).map(field => (
                                <td key={field} className="px-1 py-1">
                                  <input value={row[field]} disabled={isLocked}
                                    onChange={e => setMeds(m => m.map(r => r.id === row.id ? { ...r, [field]: e.target.value } : r))}
                                    placeholder={field === "name" ? "Amoxicillin" : field === "dosage" ? "500mg" : field === "frequency" ? "TDS" : field === "duration" ? "5 days" : "After meals"}
                                    className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-transparent bg-transparent focus:border-[#8FABD4] focus:bg-white/50 focus:outline-none transition-all placeholder:text-[#c0b9b0] text-[#1a2535]"
                                  />
                                </td>
                              ))}
                              <td className="px-1 text-center">
                                {!isLocked && meds.length > 1 && (
                                  <button onClick={() => setMeds(m => m.filter(r => r.id !== row.id))} className="text-[#c0b9b0] hover:text-red-400 text-base leading-none">×</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {!existingId && (
                    <div className="flex bg-[#f0ece4] border border-[#e2ddd4] rounded-xl p-1 gap-1 w-fit">
                      {(["typed", "image"] as EditorMode[]).map(m => (
                        <button key={m} onClick={() => setMode(m)}
                          className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all ${mode === m ? "bg-[#203C67] text-white" : "text-[#7a8fa8] hover:text-[#203C67]"}`}>
                          {m === "typed" ? "Type Notes" : "Upload Image"}
                        </button>
                      ))}
                    </div>
                  )}

                  {mode === "typed" && (
                    <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl overflow-hidden">
                      {!isLocked && (
                        <div className="flex items-center gap-1 px-3 py-2 border-b border-[#ede9e1] bg-[#f7f4ef]">
                          {TOOLBAR.map(t => (
                            <button key={t.cmd} onMouseDown={e => { e.preventDefault(); execCmd(t.cmd) }} title={t.title}
                              className="min-w-[26px] h-6 px-1.5 rounded text-[11px] font-medium text-[#5a6a7e] hover:bg-[#e2ddd4] transition-colors">
                              {t.icon}
                            </button>
                          ))}
                          <span className="ml-auto text-[9px] text-[#c0b9b0]">Additional notes</span>
                        </div>
                      )}
                      <div ref={editorRef} contentEditable={!isLocked} suppressContentEditableWarning
                        data-placeholder="Additional instructions, special precautions, or clinical notes…"
                        className="px-4 py-3 text-[12px] text-[#1a2535] leading-relaxed outline-none min-h-[100px] [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#c0b9b0]"
                        style={{ fontFamily: "Georgia, serif", background: isLocked ? "#faf8f4" : "#fff" }}
                      />
                    </div>
                  )}

                  {mode === "image" && (
                    <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl flex flex-col items-center justify-center p-8 gap-3 min-h-[160px]">
                      {imagePreview ? (
                        <div className="flex flex-col items-center gap-2 w-full">
                          <Image src={imagePreview} alt="Prescription" height={1000} width={1000}
                            className="max-w-full max-h-[300px] rounded-xl border border-[#e2ddd4] object-contain" />
                          {!isLocked && <button onClick={() => setImagePreview(null)} className="text-[11px] text-red-400 hover:text-red-600">Remove</button>}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center gap-2.5 cursor-pointer">
                          <div className="w-12 h-12 rounded-xl bg-[#dde8f5] border-2 border-dashed border-[#8FABD4] flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                          <p className="text-[12px] font-semibold text-[#203C67]">Upload prescription image</p>
                          <p className="text-[10px] text-[#a0afc0]">JPG, PNG or PDF · Max 10MB</p>
                          <input type="file" accept="image/*,.pdf" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setImagePreview(r.result as string); r.readAsDataURL(f) }} />
                          <span className="text-[11px] px-3 py-1.5 rounded-lg border border-[#8FABD4] text-[#203C67] hover:bg-[#dde8f5] transition-colors">Choose file</span>
                        </label>
                      )}
                    </div>
                  )}

                  <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-3">
                    <SL>Private Notes <span className="font-normal normal-case tracking-normal text-[#c0b9b0]">(not visible to patient)</span></SL>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isLocked} rows={2}
                      placeholder="Internal observations, reminders, differential diagnoses…"
                      className={`${INPUT} resize-none`} />
                  </div>
                </>)}
              </main>
            </div>
          )}

          {/* ════ RECORDS TAB ════ */}
          {tab === "records" && (
            <div className="p-5 flex flex-col gap-4">

              {/* Upload form */}
              <div className="bg-white/50 border border-[#e2ddd4] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-[#1a2535]">Upload Medical Record</p>
                    <p className="text-[10px] text-[#a0afc0] mt-0.5">Lab reports, imaging, discharge summaries, referrals</p>
                  </div>
                  {uploadSuccess && (
                    <span className="text-[11px] font-semibold text-[#2d6b3f] bg-[#e6f4e8] border border-[#b8d4c0] rounded-full px-3 py-1">
                      ✓ Uploaded
                    </span>
                  )}
                </div>

                {/* Report type pills */}
                <div>
                  <SL>Report Type</SL>
                  <div className="flex flex-wrap gap-1.5">
                    {REPORT_TYPES.map(rt => (
                      <button
                        key={rt.value}
                        onClick={() => setReportType(rt.value)}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          reportType === rt.value
                            ? "bg-[#203C67] text-white border-[#203C67]"
                            : "bg-[#f7f4ef] text-[#5a6a7e] border-[#e2ddd4] hover:border-[#8FABD4] hover:text-[#203C67]"
                        }`}
                      >
                        <span>{rt.icon}</span>
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <SL>Title</SL>
                  <input
                    value={recordTitle}
                    onChange={e => setRecordTitle(e.target.value)}
                    placeholder="e.g. CBC Blood Test, Chest X-Ray, MRI Brain…"
                    className={INPUT}
                  />
                </div>

                {/* File drop zone */}
                <div>
                  <SL>File</SL>
                  <label
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                      selectedFile
                        ? "border-[#203C67] bg-[#f0f4fb]"
                        : "border-[#d4cfc6] bg-[#faf8f4] hover:border-[#8FABD4] hover:bg-[#f4f7fc]"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedFile ? "bg-[#dde8f5]" : "bg-[#ede9e1]"
                    }`}>
                      {selectedFile ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <polyline points="9 15 12 18 15 15"/>
                          <line x1="12" y1="18" x2="12" y2="11"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a0afc0" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {selectedFile ? (
                        <>
                          <p className="text-[12px] font-semibold text-[#1a2535] truncate">{selectedFile.name}</p>
                          <p className="text-[10px] text-[#a0afc0]">{formatBytes(selectedFile.size)} · {selectedFile.type || "unknown type"}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[12px] font-semibold text-[#5a6a7e]">Click to choose a file</p>
                          <p className="text-[10px] text-[#a0afc0]">PDF, JPG, PNG, DICOM · Max 10MB</p>
                        </>
                      )}
                    </div>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={e => { e.preventDefault(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                        className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e2ddd4] hover:bg-red-100 flex items-center justify-center text-[#a0afc0] hover:text-red-400 transition-colors"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf,.dcm"
                      className="hidden"
                      onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>

                {/* Notes */}
                <div>
                  <SL>Notes <span className="font-normal normal-case tracking-normal text-[#c0b9b0]">(optional)</span></SL>
                  <textarea
                    value={recordNotes}
                    onChange={e => setRecordNotes(e.target.value)}
                    rows={2}
                    placeholder="Any context about this report…"
                    className={`${INPUT} resize-none`}
                  />
                </div>

                {uploadError && (
                  <p className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{uploadError}</p>
                )}

                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !recordTitle.trim()}
                  className="w-full py-2.5 rounded-xl bg-[#203C67] text-white text-[12px] font-semibold hover:bg-[#162d50] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Record
                    </>
                  )}
                </button>
              </div>

              {/* Records uploaded this session */}
              {uploadedRecords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide">Uploaded this session</p>
                  {uploadedRecords.map(rec => {
                    const rt = REPORT_TYPES.find(r => r.value === rec.reportType)
                    return (
                      <div key={rec.id} className="flex items-center gap-3 bg-white/50 border border-[#e2ddd4] rounded-xl px-3 py-2.5">
                        <span className="text-lg flex-shrink-0">{rt?.icon ?? "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[#1a2535] truncate">{rec.title}</p>
                          <p className="text-[10px] text-[#a0afc0] truncate">{rec.fileName} · {rt?.label}</p>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#e6f4e8] text-[#2d6b3f] border border-[#b8d4c0] flex-shrink-0">✓ saved</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Redirect to full records page */}
              <div className="bg-[#f7f4ef] border border-[#e2ddd4] rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                <p className="text-[28px]">🗂️</p>
                <div>
                  <p className="text-[13px] font-semibold text-[#1a2535]">View all records on the full page</p>
                  <p className="text-[11px] text-[#a0afc0] mt-0.5">See past prescriptions, all uploaded reports, and manage this patient&apos;s complete history.</p>
                </div>
                <Link
                  href={`/doctors/${userId}/patients/${patientId}/records`}
                  className="inline-flex items-center gap-2 text-[12px] font-semibold px-5 py-2.5 rounded-xl bg-[#203C67] text-white hover:bg-[#162d50] transition-colors"
                >
                  Open Records Page
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  )
}