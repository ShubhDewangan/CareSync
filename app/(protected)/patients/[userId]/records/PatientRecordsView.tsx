"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Medication {
  name: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

interface Prescription {
  $id: string
  $createdAt: string
  diagnosis: string
  medications: string[]   // array of JSON strings from Appwrite
  notes?: string
  followUpDate?: string
  content?: string
  type: "typed" | "image"
  doctorId?: string
}

interface MedicalReport {
  $id: string
  $createdAt: string
  title: string
  reportType: string
  notes?: string
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
}

interface Patient {
  $id: string
  name: string
  email?: string
  bloodGroup?: string
  allergies?: string
  profilePic?: string
}

interface Props {
  userId: string
  patient: Patient
  prescriptions: Prescription[]
  reports: MedicalReport[]
}

type Tab = "prescriptions" | "reports"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  })

function parseMeds(raw: string[]): Medication[] {
  if (!raw?.length) return []
  return raw.map(m => {
    try { return typeof m === "string" ? JSON.parse(m) : m }
    catch { return { name: m } }
  })
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

const REPORT_ICONS: Record<string, string> = {
  lab: "🧪", imaging: "🔬", discharge: "🏥", referral: "📋", other: "📄",
}

const REPORT_LABELS: Record<string, string> = {
  lab: "Lab Report", imaging: "Imaging / X-Ray", discharge: "Discharge Summary",
  referral: "Referral Letter", other: "Other",
}

const REPORT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  lab:       { bg: "#f3f0fb", color: "#6b3fa0", border: "#d4c5f0" },
  imaging:   { bg: "#eaf4fb", color: "#1a6b9a", border: "#b8d9f0" },
  discharge: { bg: "#fef6ec", color: "#9a5a2a", border: "#f5cba7" },
  referral:  { bg: "#f0f7ec", color: "#3d6b3f", border: "#b8d4a8" },
  other:     { bg: "#f8f6f2", color: "#6a6660", border: "#e0ddd5" },
}

function isActivePrescription(p: Prescription): boolean {
  if (p.followUpDate && new Date(p.followUpDate) > new Date()) return true
  const created = new Date(p.$createdAt)
  const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  return daysSince <= 30
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 14px" }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: "#9a9690", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "#e8e4dc" }} />
    </div>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 10 }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#6a6660", margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: "#bab8b4", margin: 0 }}>{sub}</p>
    </div>
  )
}

// ─── Prescription Card ────────────────────────────────────────────────────────

function PrescriptionCard({ rx }: { rx: Prescription }) {
  const [expanded, setExpanded] = useState(false)
  const meds = parseMeds(rx.medications)
  const active = isActivePrescription(rx)

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${active ? "#b8d4a8" : "#e8e4dc"}`,
      borderRadius: 16,
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}>
      {/* Active band */}
      {active && (
        <div style={{ height: 3, background: "linear-gradient(90deg, #3d6b3f, #8ab878)" }} />
      )}

      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", cursor: "pointer" }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: active ? "#f0f7ec" : "#faf9f7",
          border: `1px solid ${active ? "#b8d4a8" : "#ece9e3"}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
        }}>
          💊
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#2a3320", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rx.diagnosis || "Prescription"}
            </p>
            {active && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: "#f0f7ec", color: "#3d6b3f", border: "1px solid #b8d4a8",
                letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
              }}>
                Active
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "#9a9690", margin: 0 }}>
            {meds.length} medication{meds.length !== 1 ? "s" : ""} · {fmtDate(rx.$createdAt)}
            {rx.followUpDate && ` · Follow-up: ${fmtDate(rx.followUpDate)}`}
          </p>
        </div>

        {/* Chevron */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9690" strokeWidth="2"
          style={{ flexShrink: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f0ede8", padding: "16px 18px", background: "#faf9f7", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Medications */}
          {meds.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9a9690", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Medications
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {meds.map((med, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr 80px 100px 80px",
                    gap: 8, background: "#fff", borderRadius: 10, padding: "10px 14px",
                    border: "1px solid #ece9e3", fontSize: 12, alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontSize: 9, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Medicine</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#2a3320", margin: 0 }}>{med.name}</p>
                      {med.instructions && <p style={{ fontSize: 10, color: "#7a7670", margin: "2px 0 0", fontStyle: "italic" }}>{med.instructions}</p>}
                    </div>
                    {med.dosage && (
                      <div>
                        <p style={{ fontSize: 9, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dosage</p>
                        <p style={{ fontSize: 12, color: "#4a5a3a", margin: 0 }}>{med.dosage}</p>
                      </div>
                    )}
                    {med.frequency && (
                      <div>
                        <p style={{ fontSize: 9, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Frequency</p>
                        <p style={{ fontSize: 12, color: "#4a5a3a", margin: 0 }}>{med.frequency}</p>
                      </div>
                    )}
                    {med.duration && (
                      <div>
                        <p style={{ fontSize: 9, color: "#9a9690", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Duration</p>
                        <p style={{ fontSize: 12, color: "#4a5a3a", margin: 0 }}>{med.duration}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rich text content */}
          {rx.content && rx.content !== "<br>" && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#9a9690", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                Additional Instructions
              </p>
              <div
                style={{ fontSize: 12, color: "#2a3320", lineHeight: 1.75, padding: "10px 14px", background: "#fff", borderRadius: 10, border: "1px solid #ece9e3", fontFamily: "Georgia, serif" }}
                dangerouslySetInnerHTML={{ __html: rx.content }}
              />
            </div>
          )}

          {/* Follow-up */}
          {rx.followUpDate && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#fef6ec", border: "1px solid #f5cba7", borderRadius: 10, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#9a5a2a", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>Follow-up</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#6a3a1a", margin: "2px 0 0" }}>{fmtDate(rx.followUpDate)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: MedicalReport }) {
  const colors = REPORT_COLORS[report.reportType] ?? REPORT_COLORS.other

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: colors.bg, border: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {REPORT_ICONS[report.reportType] ?? "📄"}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#2a3320", margin: 0 }}>{report.title}</p>
            <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 0" }}>{fmtDate(report.$createdAt)}</p>
          </div>
        </div>

        {/* View button */}
        <a
          href={`${process.env.NEXT_PUBLIC_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_BUCKET_ID}/files/${report.fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 9,
            background: "#2a3320", color: "#e8ede0", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          }}
        >
          View
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      {/* Type pill */}
      <span style={{
        display: "inline-block", fontSize: 10, fontWeight: 600, padding: "3px 10px",
        borderRadius: 20, background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
        width: "fit-content",
      }}>
        {REPORT_LABELS[report.reportType] ?? report.reportType}
      </span>

      {report.notes && (
        <p style={{ fontSize: 12, color: "#7a7670", margin: 0, lineHeight: 1.6 }}>{report.notes}</p>
      )}

      {/* File info */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, paddingTop: 8,
        borderTop: "1px solid #f0ede8",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9a9690" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span style={{ fontSize: 11, color: "#9a9690", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {report.fileName}
        </span>
        <span style={{ fontSize: 11, color: "#bab8b4", flexShrink: 0 }}>{formatBytes(report.fileSize)}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PatientRecordsView({ userId, patient, prescriptions, reports }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("prescriptions")

  const activePrescriptions = (prescriptions as any).filter(isActivePrescription)
  const pastPrescriptions   = (prescriptions as any).filter((p: any) => !isActivePrescription(p))

  const tabBtn = (t: Tab): React.CSSProperties => ({
    fontSize: 12, fontWeight: 600, padding: "7px 16px", borderRadius: 9,
    border: "none", cursor: "pointer", transition: "all 0.18s",
    background: tab === t ? "#2a3320" : "transparent",
    color:      tab === t ? "#e8ede0" : "#7a7670",
  })

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#edeae4", fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Sidebar (matches dashboard) ── */}
      <div style={{ width: 260, flexShrink: 0, padding: "20px 0 20px 20px" }}>
        <div style={{
          height: "100%", background: "#edeae4", border: "1px solid #c8c0b0",
          borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Patient info */}
          <div style={{ padding: "20px 16px", borderBottom: "1px solid #ddd9d2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #c8dab8, #8ab878)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#2d5230", flexShrink: 0,
              }}>
                {patient.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2a3320", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{patient.name}</p>
                <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{patient.email}</p>
                <span style={{ fontSize: 10, background: "#A6BAD7", color: "#2a3320", padding: "2px 8px", borderRadius: 20, display: "inline-block", marginTop: 4, fontWeight: 600 }}>
                  Patient
                </span>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: "12px 10px", borderBottom: "1px solid #ddd9d2", display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "Dashboard",        href: `/patients/${userId}/dashboard` },
              { label: "Book Appointment", href: `/patients/${userId}/appointments` },
              { label: "Find Doctors",     href: "/doctors" },
              { label: "Medical Records",  href: `/patients/${userId}/records`, active: true },
              { label: "Prescriptions",    href: `/patients/${userId}/prescriptions` },
              { label: "Settings",         href: `/patients/${userId}/settings` },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: "block", padding: "8px 12px", borderRadius: 9, fontSize: 13,
                  fontWeight: item.active ? 700 : 500, textDecoration: "none",
                  background: item.active ? "#2a3320" : "transparent",
                  color: item.active ? "#e8ede0" : "#6a6660",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Summary */}
          <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9a9690", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Summary</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid #e8e4dc" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#3d6b3f", margin: 0 }}>{activePrescriptions.length}</p>
                <p style={{ fontSize: 10, color: "#9a9690", margin: "2px 0 0" }}>Active Rx</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid #e8e4dc" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#1a6b9a", margin: 0 }}>{reports.length}</p>
                <p style={{ fontSize: 10, color: "#9a9690", margin: "2px 0 0" }}>Reports</p>
              </div>
            </div>
            {patient.bloodGroup && (
              <div style={{ background: "#fdf0ed", border: "1px solid #f5c6c0", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>🩸</span>
                <div>
                  <p style={{ fontSize: 9, color: "#9a5a2a", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Blood Group</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#c0392b", margin: "1px 0 0" }}>{patient.bloodGroup}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, padding: "20px 24px 20px 16px", display: "flex", flexDirection: "column", gap: 16, overflow: "auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#2a3320", margin: 0 }}>Medical Records</h1>
            <p style={{ fontSize: 13, color: "#9a9690", margin: "3px 0 0" }}>Your complete health history</p>
          </div>
          <a href={`/patients/${userId}/dashboard`} style={{
            fontSize: 12, color: "#6a6660", textDecoration: "none",
            border: "1px solid #ddd9d2", borderRadius: 20, padding: "6px 14px",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            ← Dashboard
          </a>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 12, padding: 4, gap: 4, alignSelf: "flex-start" }}>
          <button style={tabBtn("prescriptions")} onClick={() => setTab("prescriptions")}>
            💊 Prescriptions ({prescriptions.length})
          </button>
          <button style={tabBtn("reports")} onClick={() => setTab("reports")}>
            📄 Reports ({reports.length})
          </button>
        </div>

        {/* ── PRESCRIPTIONS ── */}
        {tab === "prescriptions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {prescriptions.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16 }}>
                <EmptyState icon="💊" title="No prescriptions yet" sub="Your doctor will issue prescriptions after your appointments" />
              </div>
            ) : (
              <>
                {activePrescriptions.length > 0 && (
                  <div>
                    <SectionLabel text={`Active Prescriptions (${activePrescriptions.length})`} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {activePrescriptions.map((rx: any) => <PrescriptionCard key={rx.$id} rx={rx} />)}
                    </div>
                  </div>
                )}

                {pastPrescriptions.length > 0 && (
                  <div>
                    <SectionLabel text={`Past Prescriptions (${pastPrescriptions.length})`} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {pastPrescriptions.map((rx: any) => <PrescriptionCard key={rx.$id} rx={rx} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === "reports" && (
          <div>
            {reports.length === 0 ? (
              <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 16 }}>
                <EmptyState icon="📄" title="No reports uploaded" sub="Your doctor will upload reports and test results here" />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                {reports.map(r => <ReportCard key={r.$id} report={r} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}