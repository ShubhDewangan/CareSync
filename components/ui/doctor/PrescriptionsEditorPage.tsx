"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  createPrescription,
  getPrescriptionByAppointment,
  updatePrescription,
} from "@/lib/actions/records.actions"
import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrescriptionPageProps {
  appointmentId: string
  doctorId: string
  userId: string
  patientId: string
  patientName: string
  patientAge?: number
  patientGender?: string
  appointmentDate: string | undefined
  appointmentReason: string
  doctorName: string
  doctorSpecialization: string
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
  doctorHospital?: string
  doctorExperience?: string
  doctorRating?: number
  doctorTotalPatients?: number
  appointmentNote?: string
  appointmentStatus?: string
}

type EditorMode = "typed" | "image"
type ActiveTab  = "prescription" | "patient" | "history"

interface MedRow {
  id: string
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

const TOOLBAR = [
  { cmd: "bold",                icon: "B",  title: "Bold"          },
  { cmd: "italic",              icon: "I",  title: "Italic"        },
  { cmd: "underline",           icon: "U",  title: "Underline"     },
  { cmd: "insertUnorderedList", icon: "≡",  title: "Bullet list"   },
  { cmd: "insertOrderedList",   icon: "1.", title: "Numbered list" },
] as const

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
const hoursAgo = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60)
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
const newRow = (): MedRow => ({
  id: Math.random().toString(36).slice(2),
  name: "", dosage: "", frequency: "", duration: "", instructions: "",
})

// ─── Shared input style ───────────────────────────────────────────────────────
const INPUT = "w-full border border-[#d4cfc6] rounded-xl px-3.5 py-2.5 text-[12.5px] text-[#1a2535] bg-[#faf8f4] focus:outline-none focus:border-[#203C67] focus:bg-white transition-colors font-[inherit] placeholder:text-[#b0a99e]"

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-[#8a9ab0] uppercase tracking-[0.08em] mb-2">{children}</p>
  )
}

function InfoPair({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide">{label}</span>
      <span className={`text-[12px] text-[#1a2535] leading-snug ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-[#dde8f5] text-[#203C67] border-[#b8d0ea]",
    completed:  "bg-[#e6f4e8] text-[#2d6b3f] border-[#b8d4c0]",
    cancelled:  "bg-[#fdecea] text-[#991b1b] border-[#f5c6c2]",
    pending:    "bg-[#fef6e4] text-[#92400e] border-[#fcd89a]",
  }
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${map[status] ?? map.pending}`}>
      {status}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PrescriptionEditorPage(props: PrescriptionPageProps) {
  const {
    appointmentId, doctorId, patientId,
    patientName, patientAge, patientGender,
    appointmentDate, appointmentReason, appointmentNote, appointmentStatus,
    doctorName, doctorSpecialization, doctorHospital, doctorExperience,
    doctorRating, doctorTotalPatients,
    patientBloodGroup, patientAllergies, patientCurrentMedication,
    patientPastMedicalHistory, patientFamilyMedicalHistory,
    patientOccupation, patientAddress, patientPhone, patientEmail,
    patientHeight, patientWeight, patientInsuranceProvider,
    patientInsurancePolicyNumber, patientEmergencyContactName,
    patientEmergencyContactNumber, patientPrimaryDoctor,
  } = props

  const router    = useRouter()
  const editorRef = useRef<HTMLDivElement>(null)

  const [mode, setMode]                 = useState<EditorMode>("typed")
  const [activeTab, setActiveTab]       = useState<ActiveTab>("prescription")
  const [notes, setNotes]               = useState("")
  const [diagnosis, setDiagnosis]       = useState("")
  const [followUpDate, setFollowUpDate] = useState("")
  const [meds, setMeds]                 = useState<MedRow[]>([newRow()])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [existingId, setExistingId]     = useState<string | null>(null)
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null)
  const [isLocked, setIsLocked]         = useState(false)
  const [loading, setLoading]           = useState(true)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => { const t = setTimeout(() => setMounted(true), 40); return () => clearTimeout(t) }, [])

  useEffect(() => {
    setLoading(true)
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
          editorRef.current.innerHTML = doc.content
      })
      .catch(() => setError("Failed to load prescription."))
      .finally(() => setLoading(false))
  }, [appointmentId])

  const execCmd = (cmd: string) => { document.execCommand(cmd, false); editorRef.current?.focus() }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const addMedRow    = () => setMeds(m => [...m, newRow()])
  const removeMedRow = (id: string) => setMeds(m => m.filter(r => r.id !== id))
  const updateMed    = (id: string, field: keyof MedRow, val: string) =>
    setMeds(m => m.map(r => r.id === id ? { ...r, [field]: val } : r))

  const handleSave = useCallback(async () => {
    setSaving(true); setError(null)
    try {
      const content    = mode === "typed" ? (editorRef.current?.innerHTML ?? "") : undefined
      const medsToSave = meds.filter(m => m.name).map(({ id, ...rest }) => rest)
      const followUpISO = followUpDate ? new Date(followUpDate).toISOString() : undefined
      if (existingId) {
        await updatePrescription({ prescriptionId: existingId, content, notes: notes || undefined, diagnosis: diagnosis || undefined, medications: medsToSave, followUpDate: followUpISO })
      } else {
        await createPrescription({ appointmentId, patientId, doctorId, type: mode, content, notes: notes || undefined, diagnosis: diagnosis || "", medications: medsToSave, followUpDate: followUpISO })
      }
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message ?? "Failed to save.")
    } finally { setSaving(false) }
  }, [mode, notes, diagnosis, meds, followUpDate, existingId, appointmentId, patientId, doctorId])

  const bmiVal      = calcBMI(patientHeight, patientWeight)
  const bmiData     = bmiVal ? bmiInfo(bmiVal) : null
  const allergyList = patientAllergies?.split(",").map(s => s.trim()).filter(Boolean) ?? []

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#EFECE3]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[2.5px] border-[#c8d4c0] border-t-[#203C67] rounded-full animate-spin" />
        <p className="text-[12px] text-[#7a8fa8]">Loading workspace…</p>
      </div>
    </div>
  )

  const TAB_ITEMS: { key: ActiveTab; label: string }[] = [
    { key: "prescription", label: "Prescription" },
    { key: "patient",      label: "Patient Info"  },
    { key: "history",      label: "History"       },
  ]

  return (
    <div
      className="min-h-screen bg-[#EFECE3] font-sans"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-[#d4cfc6]"
        style={{ background: "rgba(239,236,227,0.92)", backdropFilter: "blur(14px)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] text-[#7a8fa8] hover:text-[#203C67] transition-colors"
          >
            ← Back
          </button>
          <span className="text-[#d4cfc6]">/</span>
          <span className="text-[14px] font-semibold text-[#1a2535]">Clinical Workspace</span>
          <span className="text-[13px] text-[#a0afc0]">/ {patientName}</span>
          {existingId && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
              isLocked
                ? "bg-[#f0ede8] text-[#9a9690] border-[#d4cfc6]"
                : "bg-[#e6f4e8] text-[#2d6b3f] border-[#b8d4c0]"
            }`}>
              {isLocked ? "🔒 Locked" : "✏️ Editable · 24hr"}
            </span>
          )}
          <Link
            href={`/doctors/${doctorId}/records`}
            className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-xl border border-[#d4cfc6] text-[#5a6a7e] hover:border-[#8FABD4] hover:text-[#203C67] bg-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Patient Records
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex bg-white border border-[#d4cfc6] rounded-xl p-1 gap-1">
            {TAB_ITEMS.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-[12px] font-medium px-4 py-1.5 rounded-lg transition-all ${
                  activeTab === t.key
                    ? "bg-[#203C67] text-white shadow-sm"
                    : "text-[#7a8fa8] hover:text-[#203C67]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span className={`text-[11px] text-[#3d6b3f] transition-all duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
            ✓ Saved
          </span>
          {error && <p className="text-[11px] text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || isLocked}
            className="text-[12px] font-semibold px-5 py-2 rounded-xl bg-[#203C67] text-white hover:bg-[#162d50] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : existingId ? "Update" : "Save Prescription"}
          </button>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="flex gap-4 p-5 max-w-[1340px] mx-auto">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col gap-3">

          {/* Patient card */}
          <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 pb-4 border-b border-[#ede9e1]">
              <div className="w-14 h-14 rounded-2xl bg-[#dde8f5] flex items-center justify-center text-[18px] font-bold text-[#203C67]">
                {getInitials(patientName)}
              </div>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-[#1a2535]">{patientName}</p>
                <p className="text-[11px] text-[#a0afc0] mt-0.5">
                  {[patientAge ? `${patientAge} yrs` : null, patientGender].filter(Boolean).join(" · ")}
                </p>
                <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
                  {patientBloodGroup && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">
                      {patientBloodGroup}
                    </span>
                  )}
                  {allergyList.length > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fef6e4] text-[#92400e] border border-[#fcd89a]">
                      ⚠ {allergyList.length} allergy
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Appt info */}
            <div className="pt-3 flex flex-col gap-2.5">
              <InfoPair label="Date"   value={appointmentDate ? fmtDate(appointmentDate) : undefined} />
              <InfoPair label="Time"   value={appointmentDate ? fmtTime(appointmentDate) : undefined} />
              <InfoPair label="Reason" value={appointmentReason} />
              {appointmentStatus && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide">Status</span>
                  <StatusPill status={appointmentStatus} />
                </div>
              )}
              {appointmentNote && (
                <div className="bg-[#faf8f4] rounded-xl p-2.5 border border-[#ede9e1]">
                  <p className="text-[9px] font-bold text-[#a0afc0] uppercase tracking-wide mb-1">Note</p>
                  <p className="text-[11px] text-[#5a6a7e] leading-relaxed">{appointmentNote}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vitals */}
          {(patientHeight || patientWeight) && (
            <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
              <SectionLabel>Vitals</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {patientHeight && (
                  <div className="bg-[#f7f4ef] rounded-xl p-2.5 text-center">
                    <p className="text-[9px] text-[#a0afc0] font-medium uppercase tracking-wide">Height</p>
                    <p className="text-[16px] font-bold text-[#1a2535] mt-0.5">{patientHeight}</p>
                    <p className="text-[9px] text-[#a0afc0]">cm</p>
                  </div>
                )}
                {patientWeight && (
                  <div className="bg-[#f7f4ef] rounded-xl p-2.5 text-center">
                    <p className="text-[9px] text-[#a0afc0] font-medium uppercase tracking-wide">Weight</p>
                    <p className="text-[16px] font-bold text-[#1a2535] mt-0.5">{patientWeight}</p>
                    <p className="text-[9px] text-[#a0afc0]">kg</p>
                  </div>
                )}
                {bmiVal && (
                  <div className="col-span-2 bg-[#f7f4ef] rounded-xl p-2.5 text-center">
                    <p className="text-[9px] text-[#a0afc0] font-medium uppercase tracking-wide">BMI</p>
                    <p className="text-[18px] font-bold mt-0.5" style={{ color: bmiData?.color }}>{bmiVal}</p>
                    <p className="text-[9px] font-medium" style={{ color: bmiData?.color }}>{bmiData?.label}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Doctor card */}
          <div className="bg-[#203C67] rounded-2xl p-4">
            <p className="text-[9px] font-bold text-[#8FABD4] uppercase tracking-[0.08em] mb-2">Prescribing Doctor</p>
            <p className="text-[14px] font-semibold text-white">{doctorName}</p>
            <p className="text-[11px] text-[#8FABD4] mt-0.5">{doctorSpecialization}</p>
            {doctorHospital && <p className="text-[11px] text-[#6a8ab0] mt-0.5">{doctorHospital}</p>}
            {(doctorRating !== undefined || doctorTotalPatients !== undefined || doctorExperience) && (
              <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                {doctorRating !== undefined && (
                  <div>
                    <p className="text-[14px] font-bold text-[#c8dab8]">⭐ {doctorRating}</p>
                    <p className="text-[9px] text-[#6a8ab0]">Rating</p>
                  </div>
                )}
                {doctorTotalPatients !== undefined && (
                  <div>
                    <p className="text-[14px] font-bold text-[#c8dab8]">{doctorTotalPatients}</p>
                    <p className="text-[9px] text-[#6a8ab0]">Patients</p>
                  </div>
                )}
                {doctorExperience && (
                  <div>
                    <p className="text-[14px] font-bold text-[#c8dab8]">{doctorExperience}</p>
                    <p className="text-[9px] text-[#6a8ab0]">Exp.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLocked && existingCreatedAt && (
            <div className="bg-[#f7f4ef] border border-[#d4cfc6] rounded-2xl p-3">
              <p className="text-[11px] text-[#7a8fa8] leading-relaxed">
                Written <strong className="text-[#4a5e78]">{fmtDate(existingCreatedAt)}</strong> — locked. Contact admin to edit.
              </p>
            </div>
          )}
        </aside>

        {/* ── MAIN PANEL ── */}
        <main className="flex-1 flex flex-col gap-3 min-w-0">

          {/* ════ PRESCRIPTION TAB ════ */}
          {activeTab === "prescription" && (<>

            {/* Diagnosis + Follow-up */}
            <div className="grid grid-cols-[1fr_200px] gap-3">
              <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                <SectionLabel>Diagnosis / Chief Complaint</SectionLabel>
                <input
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  disabled={isLocked}
                  placeholder="e.g. Acute pharyngitis, Type 2 Diabetes…"
                  className={INPUT}
                />
              </div>
              <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                <SectionLabel>Follow-up Date</SectionLabel>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  disabled={isLocked}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Medications */}
            <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Medications</SectionLabel>
                {!isLocked && (
                  <button
                    onClick={addMedRow}
                    className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-[#dde8f5] text-[#203C67] border border-[#c8d8ea] hover:bg-[#c8d8ea] transition-colors"
                  >
                    + Add Row
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-[#f7f4ef]">
                      {["Medication", "Dosage", "Frequency", "Duration", "Instructions", ""].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-[#a0afc0] uppercase tracking-wide border-b border-[#ede9e1] whitespace-nowrap first:rounded-tl-xl last:rounded-tr-xl">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meds.map((row, i) => (
                      <tr key={row.id} className={i % 2 === 0 ? "" : "bg-[#faf8f4]"}>
                        {(["name", "dosage", "frequency", "duration", "instructions"] as (keyof MedRow)[]).map(field => (
                          <td key={field} className="px-1.5 py-1.5">
                            <input
                              value={row[field]}
                              disabled={isLocked}
                              onChange={e => updateMed(row.id, field, e.target.value)}
                              placeholder={
                                field === "name" ? "Amoxicillin"
                                : field === "dosage" ? "500mg"
                                : field === "frequency" ? "TDS"
                                : field === "duration" ? "5 days"
                                : "After meals"
                              }
                              className="w-full text-[12px] px-2.5 py-1.5 rounded-lg border border-transparent bg-transparent focus:border-[#8FABD4] focus:bg-white focus:outline-none transition-all placeholder:text-[#c0b9b0] text-[#1a2535]"
                            />
                          </td>
                        ))}
                        <td className="px-1 text-center">
                          {!isLocked && meds.length > 1 && (
                            <button onClick={() => removeMedRow(row.id)} className="text-[#c0b9b0] hover:text-red-400 text-lg leading-none transition-colors">×</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mode toggle */}
            {!existingId && (
              <div className="flex bg-white border border-[#e2ddd4] rounded-xl p-1 gap-1 w-fit">
                {(["typed", "image"] as EditorMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`text-[12px] font-medium px-4 py-1.5 rounded-lg transition-all ${
                      mode === m
                        ? "bg-[#203C67] text-white"
                        : "text-[#7a8fa8] hover:text-[#203C67]"
                    }`}
                  >
                    {m === "typed" ? "Type Prescription" : "Upload Image"}
                  </button>
                ))}
              </div>
            )}

            {/* Typed editor */}
            {mode === "typed" && (
              <div className="bg-white border border-[#e2ddd4] rounded-2xl overflow-hidden">
                {!isLocked && (
                  <div className="flex items-center gap-1 px-4 py-2.5 border-b border-[#ede9e1] bg-[#f7f4ef]">
                    {TOOLBAR.map(t => (
                      <button
                        key={t.cmd}
                        onMouseDown={e => { e.preventDefault(); execCmd(t.cmd) }}
                        title={t.title}
                        className="min-w-[28px] h-7 px-2 rounded-lg text-[12px] font-medium text-[#5a6a7e] hover:bg-[#e8e4db] transition-colors"
                      >
                        {t.icon}
                      </button>
                    ))}
                    <div className="w-px h-4 bg-[#d4cfc6] mx-1" />
                    <select
                      onChange={e => document.execCommand("fontSize", false, e.target.value)}
                      defaultValue="3"
                      className="text-[11px] text-[#5a6a7e] bg-transparent border border-[#d4cfc6] rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="1">Small</option>
                      <option value="3">Normal</option>
                      <option value="5">Large</option>
                    </select>
                    <span className="ml-auto text-[10px] text-[#c0b9b0]">Additional notes / instructions</span>
                  </div>
                )}
                <div
                  ref={editorRef}
                  contentEditable={!isLocked}
                  suppressContentEditableWarning
                  data-placeholder="Additional instructions, special precautions, or clinical notes…"
                  className="px-5 py-4 text-[13px] text-[#1a2535] leading-relaxed outline-none min-h-[160px] [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[#c0b9b0]"
                  style={{ fontFamily: "Georgia, serif", background: isLocked ? "#faf8f4" : "#fff" }}
                />
              </div>
            )}

            {/* Image upload */}
            {mode === "image" && (
              <div className="bg-white border border-[#e2ddd4] rounded-2xl flex flex-col items-center justify-center p-10 gap-4 min-h-[200px]">
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-3 w-full">
                    <Image src={imagePreview} alt="Prescription" height={1000} width={1000}
                      className="max-w-full max-h-[400px] rounded-xl border border-[#e2ddd4] object-contain" />
                    {!isLocked && (
                      <button onClick={() => setImagePreview(null)} className="text-[11px] text-red-400 hover:text-red-600">
                        Remove image
                      </button>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-3 cursor-pointer">
                    <div className="w-16 h-16 rounded-2xl bg-[#dde8f5] border-2 border-dashed border-[#8FABD4] flex items-center justify-center">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#203C67" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-[13px] font-semibold text-[#203C67]">Upload prescription image</p>
                      <p className="text-[11px] text-[#a0afc0] mt-1">JPG, PNG or PDF · Max 10MB</p>
                    </div>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleImagePick} />
                    <span className="text-[12px] px-4 py-2 rounded-xl border border-[#8FABD4] text-[#203C67] hover:bg-[#dde8f5] transition-colors">
                      Choose file
                    </span>
                  </label>
                )}
              </div>
            )}

            {/* Private notes */}
            <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
              <SectionLabel>Doctor&apos;s Private Notes <span className="font-normal text-[#c0b9b0] normal-case tracking-normal">(not visible to patient)</span></SectionLabel>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isLocked}
                rows={3}
                placeholder="Internal observations, reminders, or differential diagnoses…"
                className={`${INPUT} resize-none`}
              />
            </div>
          </>)}

          {/* ════ PATIENT INFO TAB ════ */}
          {activeTab === "patient" && (
            <div className="flex flex-col gap-3">
              {allergyList.length > 0 && (
                <div className="bg-[#fef6e4] border border-[#fcd89a] rounded-2xl px-4 py-3 flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="text-[12px] font-bold text-[#92400e] mb-2">Known Allergies — Review Before Prescribing</p>
                    <div className="flex gap-2 flex-wrap">
                      {allergyList.map(a => (
                        <span key={a} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                  <SectionLabel>Personal Information</SectionLabel>
                  <div className="flex flex-col gap-3">
                    <InfoPair label="Full Name"   value={patientName} />
                    <InfoPair label="Age"         value={patientAge ? `${patientAge} years` : undefined} />
                    <InfoPair label="Gender"      value={patientGender} />
                    <InfoPair label="Blood Group" value={patientBloodGroup} />
                    <InfoPair label="Occupation"  value={patientOccupation} />
                    <InfoPair label="Address"     value={patientAddress} />
                    <InfoPair label="Phone"       value={patientPhone} mono />
                    <InfoPair label="Email"       value={patientEmail} mono />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                    <SectionLabel>Insurance</SectionLabel>
                    {patientInsuranceProvider ? (
                      <div className="flex flex-col gap-3">
                        <InfoPair label="Provider"      value={patientInsuranceProvider} />
                        <InfoPair label="Policy Number" value={patientInsurancePolicyNumber} mono />
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#c0b9b0]">No insurance on file</p>
                    )}
                  </div>
                  <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                    <SectionLabel>Emergency Contact</SectionLabel>
                    {patientEmergencyContactName ? (
                      <div className="flex flex-col gap-3">
                        <InfoPair label="Name"  value={patientEmergencyContactName} />
                        <InfoPair label="Phone" value={patientEmergencyContactNumber} mono />
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#c0b9b0]">No emergency contact on file</p>
                    )}
                  </div>
                  {(patientHeight || patientWeight) && (
                    <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                      <SectionLabel>Body Metrics</SectionLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {patientHeight && (
                          <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                            <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Height</p>
                            <p className="text-[15px] font-bold text-[#1a2535]">{patientHeight}</p>
                            <p className="text-[9px] text-[#a0afc0]">cm</p>
                          </div>
                        )}
                        {patientWeight && (
                          <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                            <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">Weight</p>
                            <p className="text-[15px] font-bold text-[#1a2535]">{patientWeight}</p>
                            <p className="text-[9px] text-[#a0afc0]">kg</p>
                          </div>
                        )}
                        {bmiVal && (
                          <div className="bg-[#f7f4ef] rounded-xl p-2 text-center">
                            <p className="text-[9px] text-[#a0afc0] uppercase tracking-wide">BMI</p>
                            <p className="text-[15px] font-bold" style={{ color: bmiData?.color }}>{bmiVal}</p>
                            <p className="text-[9px]" style={{ color: bmiData?.color }}>{bmiData?.label}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {patientCurrentMedication && (
                <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                  <SectionLabel>Current Medications on File</SectionLabel>
                  <p className="text-[12px] text-[#1a2535] leading-relaxed">{patientCurrentMedication}</p>
                </div>
              )}
              {patientPrimaryDoctor && (
                <div className="bg-[#dde8f5] border border-[#c8d8ea] rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-xl">👨‍⚕️</span>
                  <div>
                    <p className="text-[10px] font-bold text-[#5a7a9a] uppercase tracking-wide">Primary Physician</p>
                    <p className="text-[13px] font-semibold text-[#203C67]">Dr. {patientPrimaryDoctor}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ HISTORY TAB ════ */}
          {activeTab === "history" && (
            <div className="flex flex-col gap-3">
              {allergyList.length > 0 && (
                <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                  <SectionLabel>Allergies</SectionLabel>
                  <div className="flex gap-2 flex-wrap">
                    {allergyList.map(a => (
                      <span key={a} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#fdecea] text-[#991b1b] border border-[#f5c6c2]">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-2xl p-4 border ${patientPastMedicalHistory ? "bg-white border-[#e2ddd4]" : "bg-[#f7f4ef] border-[#ede9e1]"}`}>
                  <SectionLabel>Past Medical History</SectionLabel>
                  {patientPastMedicalHistory
                    ? <p className="text-[12px] text-[#1a2535] leading-relaxed whitespace-pre-wrap">{patientPastMedicalHistory}</p>
                    : <p className="text-[12px] text-[#c0b9b0]">No past medical history on file</p>
                  }
                </div>
                <div className={`rounded-2xl p-4 border ${patientFamilyMedicalHistory ? "bg-white border-[#e2ddd4]" : "bg-[#f7f4ef] border-[#ede9e1]"}`}>
                  <SectionLabel>Family Medical History</SectionLabel>
                  {patientFamilyMedicalHistory
                    ? <p className="text-[12px] text-[#1a2535] leading-relaxed whitespace-pre-wrap">{patientFamilyMedicalHistory}</p>
                    : <p className="text-[12px] text-[#c0b9b0]">No family history on file</p>
                  }
                </div>
              </div>

              {patientCurrentMedication && (
                <div className="bg-white border border-[#e2ddd4] rounded-2xl p-4">
                  <SectionLabel>Current Medications</SectionLabel>
                  <p className="text-[12px] text-[#1a2535] leading-relaxed">{patientCurrentMedication}</p>
                </div>
              )}

              {!patientPastMedicalHistory && !patientFamilyMedicalHistory && !patientCurrentMedication && !allergyList.length && (
                <div className="bg-white border border-[#e2ddd4] rounded-2xl p-16 text-center">
                  <p className="text-3xl mb-3">📂</p>
                  <p className="text-[13px] text-[#c0b9b0]">No medical history on file</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}