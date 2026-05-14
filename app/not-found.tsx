/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/not-found.tsx
'use client'

import { AuthUser, FullUser } from "@/context/UserContext"
import { getPatient } from "@/lib/actions/patient.actions"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"



export default function NotFound() {
  const navLinksPatient = [
    { href: "/alldoctors", label: "Find Doctors" },
    { href: "/appointments", label: "Appointments" },
  ]
  
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [patient, setPatient] = useState<FullUser>(null)
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
  async function checkSession() {
    try {
      const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch('/api/user', { signal: controller.signal })
        clearTimeout(timeout)

      const data = await res.json()
      setAuthUser(data ?? null)
      const p = await getPatient(authUser?.$id as string)
      setPatient(p as any)
    } catch {
      setAuthUser(null)
    }
  }
  checkSession()
})


  const navLinksDoctor = [
    { href: `/patients/${authUser?.$id}/work-space`, label: 'Work Space' }
  ]


  return (
    <div className="flex h-screen w-screen bg-[#EFECE3] overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex py-5 px-4 w-[260px] min-w-[260px] flex-col flex-shrink-0">
        <div className="rounded-2xl flex flex-col border border-[#203C67] bg-[#EFECE3] shadow-md overflow-hidden h-full">

          {/* Logo */}
          <div className="w-full flex justify-center pt-4 pb-3 border-b border-[#203C6720]">
            <Link href="/">
              <Image src="/logo.png" alt="CareSync" height={1000} width={1000} className="h-14 w-fit" />
            </Link>
          </div>

          {/* Message */}
          <div className="px-5 pt-6 pb-4 border-b border-[#203C6720]">
            <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">Navigation</p>
            <p className="text-[13px] text-[#203C67]/70 leading-relaxed">
              Looks like you wandered off. Here are some places to get you back on track.
            </p>
          </div>

          {/* Nav links */}
          <div className="px-4 py-4 flex flex-col gap-2">
            {navLinksPatient.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D8E4F0] hover:bg-[#c3d4e8] text-[#203C67] text-[13px] font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Go back button */}
          <div className="px-4 pb-4 mt-auto">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#203C67] text-[#EFECE3] text-[13px] font-medium hover:bg-[#162d50] transition-colors"
            >
              ← Go to Homepage
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-hidden relative">

        {/* Dot matrix 404 */}
        <div className="w-full max-w-2xl">
          <svg
            viewBox="0 0 680 280"
            width="100%"
            className="mb-8"
            aria-label="404"
          >
            {/* ── 4 (left) ── */}
            {[
              [120,40],[120,60],[120,80],[120,100],[120,120],
              [120,140],[140,140],[160,140],[180,140],[200,140],
              [200,40],[200,60],[200,80],[200,100],[200,120],
              [200,160],[200,180],[200,200],[200,220],[200,240],
              [140,100],[160,100],[180,100],
            ].map(([cx, cy], i) => (
              <circle key={`l4-${i}`} cx={cx} cy={cy} r="5" fill="#203C67" opacity="0.85" />
            ))}

            {/* ── 0 (middle) ── */}
            {[
              [280,60],[300,40],[320,40],[340,40],[360,60],
              [280,80],[280,100],[280,120],[280,140],[280,160],[280,180],
              [360,80],[360,100],[360,120],[360,140],[360,160],[360,180],
              [280,200],[300,220],[320,220],[340,220],[360,200],
              [300,60],[320,60],[340,60],
              [300,200],[320,200],[340,200],
            ].map(([cx, cy], i) => (
              <circle key={`o-${i}`} cx={cx} cy={cy} r="5" fill="#203C67" opacity="0.85" />
            ))}

            {/* ── 4 (right) ── */}
            {[
              [420,40],[420,60],[420,80],[420,100],[420,120],
              [420,140],[440,140],[460,140],[480,140],[500,140],
              [500,40],[500,60],[500,80],[500,100],[500,120],
              [500,160],[500,180],[500,200],[500,220],[500,240],
              [440,100],[460,100],[480,100],
            ].map(([cx, cy], i) => (
              <circle key={`r4-${i}`} cx={cx} cy={cy} r="5" fill="#203C67" opacity="0.85" />
            ))}

            {/* Subtle scattered dots for texture */}
            {[
              [60,180],[70,200],[80,160],[90,220],[100,190],
              [560,60],[570,90],[580,130],[590,160],[610,80],
              [50,60],[65,90],[75,120],[605,200],[620,230],
            ].map(([cx, cy], i) => (
              <circle key={`scatter-${i}`} cx={cx} cy={cy} r="3" fill="#203C67" opacity="0.18" />
            ))}
          </svg>

          {/* Text */}
          <div className="flex flex-col gap-4">
            <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#203C67] leading-tight">
              We couldn&apos;t find the page<br className="hidden sm:block" /> you were looking for.
            </h1>
            <p className="text-[14px] text-[#203C67]/60 max-w-md">
              The page may have been moved, deleted, or the URL might be incorrect.
            </p>

            {/* Mobile nav links */}
            <div className="flex flex-wrap gap-3 mt-2 lg:hidden">
              {patient?.userType === 'patient' ? navLinksPatient.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D8E4F0] hover:bg-[#c3d4e8] text-[#203C67] text-[13px] font-medium transition-colors"
                >
                  {link.label}
                </Link>
              )): navLinksDoctor.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D8E4F0] hover:bg-[#c3d4e8] text-[#203C67] text-[13px] font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#203C67] text-[#EFECE3] text-[13px] font-medium hover:bg-[#162d50] transition-colors"
              >
                ← Homepage
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}