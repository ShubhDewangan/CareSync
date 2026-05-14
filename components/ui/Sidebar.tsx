// components/ui/Sidebar.tsx
"use client"

import { useRouter } from "next/navigation"
import Image from 'next/image'
import Link from "next/link"
import SignOutButton from '@/components/ui/signOutButton'
import { Patient, Doctor } from '@/types/appwrite'

type AuthUser = {
  $id: string
  name: string
  userType: "patient" | "doctor"
  email: string
} | null

type FullUser =
  | (Patient & { userType: "patient" })
  | (Doctor  & { userType: "doctor"  })
  | null

interface SidebarProps {
  admin: boolean
  authUser: AuthUser
  fullUser: FullUser
  fullUserChecked: boolean
  onLogout: () => void
  stats?: {
    upcoming: number
    lastVisitDoctor?: string
    lastVisitDate?: string
    active?: number
  }
  onClose?: () => void
}

export default function Sidebar({ authUser, fullUser, fullUserChecked, onLogout, stats, onClose }: SidebarProps) {
  const router = useRouter()

  const dashboardRoute = authUser
    ? authUser.userType === "patient"
      ? `/patients/${authUser.$id}/dashboard`
      : `/doctors/${authUser.$id}/work-space`
    : null

  const registerRoute = authUser
    ? authUser.userType === "patient"
      ? `/patients/${authUser.$id}/register`
      : `/doctors/${authUser.$id}/register`
    : null

  const profilePic           = fullUser?.profilePic || '/assets/images/user_default.webp'
  const registrationComplete = !!fullUser

  const initials = authUser?.name
    ? authUser.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <div style={{
      width: 260, minWidth: 260, margin: "16px 0 16px 16px",
      display: "flex", flexDirection: "column",
      background: "#edeae4",
      border: "1px solid rgba(32,60,103,0.15)",
      borderRadius: 18,
      boxShadow: "0 2px 16px rgba(32,60,103,0.08)",
      overflow: "hidden",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid rgba(32,60,103,0.1)", display: "flex", justifyContent: "center" }}>
        <Link href="/">
          <Image src="/logo.png" alt="CareSync" height={1000} width={1000} style={{ height: 44, width: "auto" }} />
        </Link>
      </div>

      {/* ── Profile ── */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(32,60,103,0.1)" }}>
        {authUser ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              {fullUser?.profilePic ? (
                <Image
                  src={profilePic || '/assets/images/user_default.webp'}
                  alt="profile"
                  height={200} width={200}
                  style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(32,60,103,0.2)" }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8dab8, #8ab878)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "#2d5230",
                  border: "2px solid rgba(61,107,63,0.2)",
                }}>
                  {initials}
                </div>
              )}
              {/* Online dot */}
              <div style={{
                position: "absolute", bottom: 2, right: 2,
                width: 12, height: 12, borderRadius: "50%",
                background: "#4ade80", border: "2px solid #edeae4",
              }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a2e10", margin: 0 }}>{authUser.name}</p>
              <p style={{ fontSize: 11, color: "#9a9690", margin: "2px 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {authUser.email}
              </p>
              <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                  background: "#A6BAD7", color: "#203C67", border: "1px solid rgba(32,60,103,0.2)",
                }}>
                  {authUser.userType === "doctor" ? "Doctor" : "Patient"}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                  background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                }}>
                  Active
                </span>
              </div>
            </div>

            {/* Loading shimmer */}
            {!fullUser && !fullUserChecked && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #A6BAD7", borderTopColor: "#203C67", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 11, color: "#9a9690" }}>Loading profile…</span>
              </div>
            )}

            {/* Dashboard / Register button */}
            {registrationComplete ? (
              <Link href={dashboardRoute!} style={{
                display: "block", width: "100%", textAlign: "center",
                fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 10,
                background: "#2a3320", color: "#e8ede0", textDecoration: "none",
                transition: "background 0.15s",
              }}>
                Your Dashboard →
              </Link>
            ) : fullUserChecked && !fullUser ? (
              <Link href={registerRoute!} style={{
                display: "block", width: "100%", textAlign: "center",
                fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 10,
                background: "#3d6b3f", color: "#e8ede0", textDecoration: "none",
              }}>
                Complete Registration →
              </Link>
            ) : null}
          </div>
        ) : (
          /* Not logged in */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#d8e4dc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>
              👤
            </div>
            <p style={{ fontSize: 13, color: "#7a7670", margin: 0, textAlign: "center" }}>
              Sign in to access your health dashboard
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <button
                onClick={() => router.push('/signin')}
                style={{
                  width: "100%", fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 10,
                  background: "#203C67", color: "#fff", border: "none", cursor: "pointer",
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/login')}
                style={{
                  width: "100%", fontSize: 13, fontWeight: 500, padding: "9px 0", borderRadius: 10,
                  background: "transparent", color: "#203C67", border: "1px solid rgba(32,60,103,0.3)", cursor: "pointer",
                }}
              >
                Log In
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Menu ── */}
          <div className="mb-3 p-5">
            <p className="text-[9px] font-semibold text-[#a0afc0] uppercase tracking-widest px-1 mb-2">Menu</p>
            <div className="flex flex-col gap-1">
              {[
                {
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                  label: "Find Doctors",
                  href: "/alldoctors",
                },
                // {
                //   icon: (
                //     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                //       <rect x="3" y="3" width="18" height="18" rx="2"/>
                //       <path d="M3 9h18M9 21V9"/>
                //     </svg>
                //   ),
                //   label: "Hospitals/Clinic",
                //   href: "/hospitals",
                // },
                {
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  ),
                  label: "Medical Records",
                  href: `/patients/${authUser?.$id}/records`,
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f0ede6] hover:bg-[#e8e4dc] border border-transparent hover:border-[#d8d4c8] text-[#1a2535] transition-all group"
                >
                  <span className="text-[#5a6a7e] group-hover:text-[#203C67] transition-colors">{item.icon}</span>
                  <span className="text-[13px] font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

      {/* ── Quick Stats ── */}
      {authUser && (
        <div style={{ padding: "8px 12px 12px", borderTop: "1px solid rgba(32,60,103,0.08)" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#9a9690", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 4px 8px" }}>
            Quick Stats
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(32,60,103,0.08)" }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#203C67", margin: 0 }}>{stats?.upcoming ?? 0}</p>
              <p style={{ fontSize: 10, color: "#9a9690", margin: "2px 0 0" }}>Upcoming</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(32,60,103,0.08)" }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: "#3d6b3f", margin: 0 }}>{stats?.active ?? 0}</p>
              <p style={{ fontSize: 10, color: "#9a9690", margin: "2px 0 0" }}>Active Rx</p>
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(32,60,103,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 10, color: "#9a9690", margin: 0 }}>Last visit</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#2a3320", margin: "2px 0 0" }}>
                {stats?.lastVisitDoctor || "No past visits"}
              </p>
            </div>
            {stats?.lastVisitDate && (
              <span style={{ fontSize: 11, color: "#9a9690" }}>{stats.lastVisitDate}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: "auto", padding: "12px", borderTop: "1px solid rgba(32,60,103,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
        {authUser && <SignOutButton onLogout={onLogout} />}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <Link href="/help" style={{ fontSize: 11, color: "#9a9690", textDecoration: "none" }}>Help</Link>
          <span style={{ color: "#d0cdc7", fontSize: 11 }}>·</span>
          <Link href="/help/how-to-use" style={{ fontSize: 11, color: "#9a9690", textDecoration: "none" }}>How to use</Link>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}