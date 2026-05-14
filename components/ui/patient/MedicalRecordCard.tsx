"use client"

import Image from "next/image"
import { useState } from "react"

interface MedicalRecordCardProps {
  prescriptionId: string
  doctorName: string
  doctorSpecialization: string
  appointmentDate: string
  appointmentReason: string
  type: "typed" | "image"
  content?: string        // rich-text HTML
  imageFileId?: string    // Appwrite Storage file ID
  imageUrl?: string       // resolved public URL from Appwrite Storage
  createdAt: string
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

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export default function MedicalRecordCard({
  doctorName,
  doctorSpecialization,
  appointmentDate,
  appointmentReason,
  type,
  content,
  imageUrl,
  createdAt,
}: MedicalRecordCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-[#203C6730] rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all overflow-hidden">

      {/* ── Card header ── */}
      <div className="flex items-start gap-3 p-4">

        {/* Doctor avatar */}
        <div className="h-10 w-10 rounded-full bg-[#203C67] flex items-center justify-center text-[12px] font-semibold text-white flex-shrink-0">
          {initials(doctorName)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[13px] font-semibold text-gray-800">Dr. {doctorName}</p>
              <p className="text-[11px] text-gray-400">{doctorSpecialization}</p>
            </div>
            {/* Date badge */}
            <span className="text-[10px] bg-[#f0f4fa] text-[#203C67] border border-[#203C6720] rounded-full px-2.5 py-1 font-medium flex-shrink-0">
              {formatDate(appointmentDate)}
            </span>
          </div>

          {/* Appointment meta */}
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[11px] text-gray-500">
              🕐 {formatTime(appointmentDate)}
            </span>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-500 truncate">
              {appointmentReason}
            </span>
          </div>
        </div>
      </div>

      {/* ── Type pill + expand toggle ── */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${
          type === "typed"
            ? "bg-blue-50 text-blue-600 border-blue-200"
            : "bg-purple-50 text-purple-600 border-purple-200"
        }`}>
          {type === "typed" ? "✏️ Written" : "📷 Image"}
        </span>

        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] text-[#203C67] font-medium hover:underline flex items-center gap-1"
        >
          {expanded ? "Hide" : "View Prescription"}
          <span className={`transition-transform duration-200 inline-block ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
      </div>

      {/* ── Expandable prescription content ── */}
      {expanded && (
        <div className="border-t border-[#203C6715] mx-4 mb-4 pt-4">
          {type === "typed" && content ? (
            <div
              className="text-[12px] text-gray-700 leading-relaxed prose prose-sm max-w-none
                prose-ul:pl-4 prose-ol:pl-4 prose-li:my-0.5
                [&_ul]:list-disc [&_ol]:list-decimal [&_strong]:font-semibold [&_em]:italic [&_u]:underline"
              style={{ fontFamily: "'Georgia', serif" }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : type === "image" && imageUrl ? (
            <div className="flex flex-col items-center gap-3">
              <Image
                src={imageUrl}
                alt="Prescription"
                className="max-w-full rounded-lg border border-gray-200 object-contain"
              />
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#203C67] hover:underline"
              >
                Open full image ↗
              </a>
            </div>
          ) : (
            <p className="text-[12px] text-gray-400 italic text-center py-4">
              Prescription content not available.
            </p>
          )}

          {/* Written on */}
          <p className="text-[10px] text-gray-400 mt-4 text-right">
            Written on {formatDate(createdAt)} at {formatTime(createdAt)}
          </p>
        </div>
      )}
    </div>
  )
}