/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

// components/ui/doctor/PatientRecordsClient.tsx

import { useState, useRef, useTransition } from "react"
import { createPrescription, uploadMedicalReport, deletePrescription, deleteMedicalReport, getFileViewUrl } from "@/lib/actions/prescriptions.actions"
import { useRouter } from "next/navigation"

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions: string
}

interface Prescription {
  $id: string
  diagnosis: string
  medications: Medication[]
  notes: string
  followUpDate: string | null
  $createdAt: string
}

interface MedicalReport {
  $id: string
  title: string
  reportType: string
  notes: string
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  $createdAt: string
}

interface PatientInfo {
  $id: string
  name: string
  email?: string
  phone?: string
  bloodGroup?: string
  allergies?: string
  currentMedication?: string
}

interface Props {
  doctor: { $id: string; name: string; specialization: string; profilePic?: string }
  doctorId: string
  userId: string
  patient: PatientInfo
  patientId: string
  prescriptions: Prescription[]
  reports: MedicalReport[]
}

type Tab = "prescriptions" | "reports"
type Modal = null | "prescription" | "report"

const REPORT_TYPES = [
  { value: "lab", label: "Lab Report" },
  { value: "imaging", label: "Imaging / X-Ray / MRI" },
  { value: "discharge", label: "Discharge Summary" },
  { value: "referral", label: "Referral Letter" },
  { value: "other", label: "Other" },
]

const EMPTY_MED: Medication = { name: "", dosage: "", frequency: "", duration: "", instructions: "" }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata"
  })
}

const REPORT_TYPE_COLORS: Record<string, string> = {
  lab: "bg-purple-100 text-purple-700 border-purple-200",
  imaging: "bg-blue-100 text-blue-700 border-blue-200",
  discharge: "bg-orange-100 text-orange-700 border-orange-200",
  referral: "bg-teal-100 text-teal-700 border-teal-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
}

export default function PatientRecordsClient({
  doctor, doctorId, userId, patient, patientId, prescriptions: initRx, reports: initReports
}: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("prescriptions")
  const [modal, setModal] = useState<Modal>(null)
  const [isPending, startTransition] = useTransition()

  // ── Prescription form state ──
  const [diagnosis, setDiagnosis] = useState("")
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }])
  const [rxNotes, setRxNotes] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [rxError, setRxError] = useState("")

  // ── Report form state ──
  const [reportTitle, setReportTitle] = useState("")
  const [reportType, setReportType] = useState("lab")
  const [reportNotes, setReportNotes] = useState("")
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportError, setReportError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Local state for optimistic updates ──
  const [prescriptions, setPrescriptions] = useState(initRx)
  const [reports, setReports] = useState(initReports)

  // ── Expanded prescription (view detail) ──
  const [expandedRx, setExpandedRx] = useState<string | null>(null)

  function addMedication() {
    setMedications(prev => [...prev, { ...EMPTY_MED }])
  }

  function removeMedication(i: number) {
    setMedications(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateMedication(i: number, field: keyof Medication, value: string) {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

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
          doctorId, patientId,
          diagnosis,
          medications,
          notes: rxNotes,
          followUpDate: followUp || undefined,
        })
        setPrescriptions(prev => [{ ...doc, medications }, ...prev])
        setModal(null)
        resetRxForm()
      } catch {
        setRxError("Failed to save. Please try again.")
      }
    })
  }

  async function handleUploadReport() {
    if (!reportTitle.trim()) { setReportError("Title is required."); return }
    if (!reportFile) { setReportError("Please select a file."); return }
    setReportError("")

    const formData = new FormData()
    formData.append("file", reportFile)

    startTransition(async () => {
      try {
        const doc = await uploadMedicalReport({
          doctorId, patientId,
          title: reportTitle,
          reportType: reportType as any,
          notes: reportNotes,
          file: formData,
        })
        setReports(prev => [doc, ...prev])
        setModal(null)
        resetReportForm()
      } catch {
        setReportError("Upload failed. Please try again.")
      }
    })
  }

  async function handleDeleteRx(rxId: string) {
    if (!confirm("Delete this prescription?")) return
    startTransition(async () => {
      await deletePrescription(rxId, doctorId, patientId)
      setPrescriptions(prev => prev.filter(r => r.$id !== rxId))
    })
  }

  async function handleDeleteReport(reportId: string, fileId: string) {
    if (!confirm("Delete this report and its file?")) return
    startTransition(async () => {
      await deleteMedicalReport(reportId, fileId, doctorId, patientId)
      setReports(prev => prev.filter(r => r.$id !== reportId))
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF3FA] via-white to-[#E8F0FB] p-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-9 w-9 rounded-full border border-[#203C6740] flex items-center justify-center text-[#203C67] hover:bg-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[22px] font-semibold text-[#203C67]">Patient Records</h1>
            <p className="text-[13px] text-gray-500">Dr. {doctor.name} · {doctor.specialization}</p>
          </div>
        </div>

        <button
          onClick={() => setModal(tab === "prescriptions" ? "prescription" : "report")}
          className="flex items-center gap-2 bg-[#203C67] text-white text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-[#2d5494] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {tab === "prescriptions" ? "New Prescription" : "Upload Report"}
        </button>
      </div>

      {/* ── Patient Info Card ───────────────────────────────────── */}
      <div className="bg-white border border-[#203C6720] rounded-2xl p-5 mb-6 flex items-center gap-5">
        <div className="h-14 w-14 rounded-full bg-[#A6BAD7] flex items-center justify-center text-[18px] font-semibold text-[#203C67] flex-shrink-0">
          {patient.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 grid grid-cols-4 gap-4">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Patient</p>
            <p className="text-[14px] font-semibold text-gray-800">{patient.name}</p>
          </div>
          {patient.email && (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
              <p className="text-[13px] text-gray-600 truncate">{patient.email}</p>
            </div>
          )}
          {patient.bloodGroup && (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Blood Group</p>
              <p className="text-[13px] font-medium text-red-600">{patient.bloodGroup}</p>
            </div>
          )}
          {patient.allergies && (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-0.5">Allergies</p>
              <p className="text-[13px] text-orange-600 truncate">{patient.allergies}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <span className="text-[11px] bg-[#EEF3FA] text-[#203C67] border border-[#203C6720] rounded-full px-3 py-1 font-medium">
            {prescriptions.length} Rx
          </span>
          <span className="text-[11px] bg-[#EEF3FA] text-[#203C67] border border-[#203C6720] rounded-full px-3 py-1 font-medium">
            {reports.length} Reports
          </span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-[#203C6710] rounded-xl w-fit mb-5">
        {(["prescriptions", "reports"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all capitalize ${
              tab === t ? "bg-white text-[#203C67] shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "prescriptions" ? `💊 Prescriptions (${prescriptions.length})` : `📄 Reports (${reports.length})`}
          </button>
        ))}
      </div>

      {/* ── Prescriptions List ──────────────────────────────────── */}
      {tab === "prescriptions" && (
        <div className="flex flex-col gap-3">
          {prescriptions.length === 0 ? (
            <EmptyState
              icon="💊"
              title="No prescriptions yet"
              subtitle="Create the first prescription for this patient"
              action={() => setModal("prescription")}
              actionLabel="New Prescription"
            />
          ) : (
            prescriptions.map(rx => (
              <div key={rx.$id} className="bg-white border border-[#203C6720] rounded-2xl overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#f9fbff] transition-colors"
                  onClick={() => setExpandedRx(expandedRx === rx.$id ? null : rx.$id)}
                >
                  <div className="h-10 w-10 rounded-xl bg-[#EEF3FA] flex items-center justify-center text-[18px] flex-shrink-0">
                    💊
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800">{rx.diagnosis}</p>
                    <p className="text-[12px] text-gray-500">
                      {rx.medications.length} medication{rx.medications.length !== 1 ? "s" : ""} ·{" "}
                      {formatDate(rx.$createdAt)}
                      {rx.followUpDate && ` · Follow-up: ${formatDate(rx.followUpDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteRx(rx.$id) }}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                    <svg
                      className={`transition-transform text-gray-400 ${expandedRx === rx.$id ? "rotate-180" : ""}`}
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedRx === rx.$id && (
                  <div className="border-t border-[#203C6710] p-5 bg-[#fafcff]">
                    <div className="mb-4">
                      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Medications</p>
                      <div className="flex flex-col gap-2">
                        {rx.medications.map((med, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-[#203C6715]">
                            <div className="h-7 w-7 rounded-lg bg-[#203C6710] flex items-center justify-center text-[11px] font-semibold text-[#203C67] flex-shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1 grid grid-cols-4 gap-3 text-[12px]">
                              <div>
                                <p className="text-gray-400 text-[10px]">Medicine</p>
                                <p className="font-semibold text-gray-800">{med.name}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-[10px]">Dosage</p>
                                <p className="text-gray-700">{med.dosage}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-[10px]">Frequency</p>
                                <p className="text-gray-700">{med.frequency}</p>
                              </div>
                              <div>
                                <p className="text-gray-400 text-[10px]">Duration</p>
                                <p className="text-gray-700">{med.duration}</p>
                              </div>
                              {med.instructions && (
                                <div className="col-span-4">
                                  <p className="text-gray-400 text-[10px]">Instructions</p>
                                  <p className="text-gray-600 italic">{med.instructions}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {rx.notes && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                        <p className="text-[11px] font-medium text-yellow-700 mb-1">Doctor&apos;s Notes</p>
                        <p className="text-[12px] text-gray-600">{rx.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Medical Reports List ────────────────────────────────── */}
      {tab === "reports" && (
        <div className="grid grid-cols-2 gap-3">
          {reports.length === 0 ? (
            <div className="col-span-2">
              <EmptyState
                icon="📄"
                title="No reports uploaded"
                subtitle="Upload the first medical report for this patient"
                action={() => setModal("report")}
                actionLabel="Upload Report"
              />
            </div>
          ) : (
            reports.map(report => (
              <div key={report.$id} className="bg-white border border-[#203C6720] rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#EEF3FA] flex items-center justify-center text-[18px] flex-shrink-0">
                      {report.reportType === "lab" ? "🧪" :
                       report.reportType === "imaging" ? "🔬" :
                       report.reportType === "discharge" ? "🏥" :
                       report.reportType === "referral" ? "📋" : "📄"}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-800">{report.title}</p>
                      <p className="text-[11px] text-gray-400">{formatDate(report.$createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReport(report.$id, report.fileId, )}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>

                <span className={`text-[10px] font-medium border rounded-full px-2.5 py-0.5 w-fit ${REPORT_TYPE_COLORS[report.reportType] ?? REPORT_TYPE_COLORS.other}`}>
                  {REPORT_TYPES.find(t => t.value === report.reportType)?.label ?? report.reportType}
                </span>

                {report.notes && (
                  <p className="text-[12px] text-gray-500 line-clamp-2">{report.notes}</p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#203C6710]">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="truncate max-w-[120px]">{report.fileName}</span>
                    <span>· {formatBytes(report.fileSize)}</span>
                  </div>
                  <a
                    href={getFileViewUrl(report.fileId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-[#203C67] hover:underline flex items-center gap-1"
                  >
                    View
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Prescription Modal ──────────────────────────────────── */}
      {modal === "prescription" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-[17px] font-semibold text-[#203C67]">New Prescription</h2>
                <p className="text-[12px] text-gray-500">For {patient.name}</p>
              </div>
              <button onClick={() => { setModal(null); resetRxForm() }} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Diagnosis */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Diagnosis *</label>
                <input
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute pharyngitis, Type 2 diabetes..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#203C67] transition-colors"
                />
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[12px] font-medium text-gray-600">Medications *</label>
                  <button
                    onClick={addMedication}
                    className="text-[11px] text-[#203C67] font-medium flex items-center gap-1 hover:underline"
                  >
                    + Add another
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {medications.map((med, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 bg-[#fafcff]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-semibold text-[#203C67] bg-[#EEF3FA] px-2 py-0.5 rounded-md">
                          Medication {i + 1}
                        </span>
                        {medications.length > 1 && (
                          <button onClick={() => removeMedication(i)} className="text-[11px] text-red-400 hover:text-red-600">
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Medicine Name *</label>
                          <input
                            value={med.name}
                            onChange={e => updateMedication(i, "name", e.target.value)}
                            placeholder="e.g. Amoxicillin"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#203C67]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Dosage</label>
                          <input
                            value={med.dosage}
                            onChange={e => updateMedication(i, "dosage", e.target.value)}
                            placeholder="e.g. 500mg"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#203C67]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Frequency</label>
                          <input
                            value={med.frequency}
                            onChange={e => updateMedication(i, "frequency", e.target.value)}
                            placeholder="e.g. Twice daily"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#203C67]"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">Duration</label>
                          <input
                            value={med.duration}
                            onChange={e => updateMedication(i, "duration", e.target.value)}
                            placeholder="e.g. 7 days"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#203C67]"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[11px] text-gray-400 mb-1 block">Special Instructions</label>
                          <input
                            value={med.instructions}
                            onChange={e => updateMedication(i, "instructions", e.target.value)}
                            placeholder="e.g. Take after meals, avoid dairy"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-[#203C67]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Doctor&apos;s Notes</label>
                <textarea
                  value={rxNotes}
                  onChange={e => setRxNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional advice, dietary restrictions, lifestyle changes..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#203C67]"
                />
              </div>

              {/* Follow-up */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Follow-up Date (optional)</label>
                <input
                  type="date"
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#203C67]"
                />
              </div>

              {rxError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{rxError}</p>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => { setModal(null); resetRxForm() }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePrescription}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#203C67] text-white text-[13px] font-medium hover:bg-[#2d5494] transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Upload Modal ─────────────────────────────────── */}
      {modal === "report" && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-[17px] font-semibold text-[#203C67]">Upload Medical Report</h2>
                <p className="text-[12px] text-gray-500">For {patient.name}</p>
              </div>
              <button onClick={() => { setModal(null); resetReportForm() }} className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Report Title *</label>
                <input
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  placeholder="e.g. CBC Blood Test, Chest X-Ray..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#203C67]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Report Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setReportType(t.value)}
                      className={`py-2 px-3 rounded-xl border text-[12px] font-medium transition-colors text-left ${
                        reportType === t.value
                          ? "bg-[#203C67] text-white border-[#203C67]"
                          : "border-gray-200 text-gray-600 hover:border-[#203C6740]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">File *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    reportFile ? "border-[#203C67] bg-[#EEF3FA]" : "border-gray-200 hover:border-[#203C6740]"
                  }`}
                >
                  {reportFile ? (
                    <div>
                      <p className="text-[13px] font-medium text-[#203C67]">📎 {reportFile.name}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{formatBytes(reportFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] text-gray-500">Click to upload</p>
                      <p className="text-[11px] text-gray-400 mt-1">PDF, JPG, PNG — max 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={e => setReportFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Notes (optional)</label>
                <textarea
                  value={reportNotes}
                  onChange={e => setReportNotes(e.target.value)}
                  rows={2}
                  placeholder="Summary or context for this report..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#203C67]"
                />
              </div>

              {reportError && (
                <p className="text-[12px] text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{reportError}</p>
              )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <button
                onClick={() => { setModal(null); resetReportForm() }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadReport}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#203C67] text-white text-[13px] font-medium hover:bg-[#2d5494] transition-colors disabled:opacity-50"
              >
                {isPending ? "Uploading..." : "Upload Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, subtitle, action, actionLabel }: {
  icon: string; title: string; subtitle: string; action: () => void; actionLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-[40px] mb-3">{icon}</div>
      <p className="text-[15px] font-semibold text-gray-700 mb-1">{title}</p>
      <p className="text-[13px] text-gray-400 mb-5">{subtitle}</p>
      <button
        onClick={action}
        className="bg-[#203C67] text-white text-[13px] font-medium px-5 py-2.5 rounded-xl hover:bg-[#2d5494] transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  )
}