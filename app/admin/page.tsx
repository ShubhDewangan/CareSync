/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/page.tsx
import { getLoggedInUser } from "@/lib/actions/auth.actions"
import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import ColorBends from "@/components/ColorBends"
import CategoryScroll from "@/components/ui/CategoryScroll"
import { getAdminDashboardData } from "@/lib/actions/admin.actions"
import { DataTable } from "@/components/table/DataTable"
import { columns } from "@/components/table/columns"
import StatCard from "@/components/ui/StatCard"

export default async function AdminDashboardPage() {
    // const authUser = await getLoggedInUser()
  // if (!authUser) redirect("/")
  const data = await getAdminDashboardData()
  // const appointments = await getRecentPatients()
 
  const stats = data?.stats
  const weekly = data?.weeklyAppointments ?? []

  const pendingAppointments = data?.stats.pendingAppointments ?? 0;
  const scheduledAppointments = data?.stats.scheduledAppointments ?? 0;
  const cancelledAppointments = data?.stats.cancelledAppointments ?? 0;

  const recentAppointments = data?.recentAppointments ?? []
  const maxWeekly = Math.max(...weekly.map((d) => d.count), 1)

    const statScrollData = [
      { tag: "Total Patients: ", data: `${stats?.totalPatients}`},
      { tag: "Total Doctors: ", data: `${stats?.totalDoctors}`},
      { tag: "Appts Today: ", data: `${stats?.appointmentsToday}`},
      { tag: "Cancelled/week: ", data: `${stats?.cancelledThisWeek}`},
      { tag: "New Patients: ", data: `${stats?.newPatientsToday}`},
      { tag: "New Doctors: ", data: `${stats?.newDoctorsToday}`},
    ]

  return (
    <>
      {/* ── Animated background ── */}
      <div className="bg-black fixed inset-0 w-screen h-screen">
        <ColorBends
          colors={["#ff5c7ac5", "#8a5cffae", "#00ffd0ad"]}
          rotation={0}
          speed={0.1}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={0.5}
          parallax={0.5}
          noise={0.1}
          transparent
          autoRotate={0}
        />
      </div>

      <div className="relative flex w-screen flex-col overflow-hidden">

        {/* ── Sidebar ── */}
        <div className="flex"><div className="max-w-[250px] w-[250px] flex-shrink-0 m-4 h-fit z-10 rounded-2xl bg-[#71677a9d] backdrop-blur-md border border-white/20 flex flex-col items-center py-5 px-3 gap-3">

          {/* Admin badge */}
            <div className="flex w-full gap-2 justify-center p-4">
                <div className="w-10 h-10 admin-tag rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.7">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
                </div>
                <div className="bg-white/20 rounded-full admin-tag px-7 py-1.5 text-white text-[15px] font-semibold tracking-wide flex items-center justify-center">
                    Admin
                </div>
            </div>

          {/* Nav buttons */}
          <div className="flex flex-col gap-2 w-full mt-2">
            {[
              { label: "Your Dashboard", active: true },
              { label: "Stats" },
              { label: "Editing Tab" },
              { label: "Settings" },
              { label: 'Logs'},
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full py-2 px-2 rounded-xl text-[12px] font-medium transition-all
                  ${item.active
                    ? "bg-[#4d5472] text-white"
                    : "bg-white/15 text-white/80 hover:bg-white/25"
                  }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Bottom note */}
          <div className=" bg-white/10 rounded-xl p-3 text-[10px] text-white/60 leading-relaxed">
            Should be handled carefully and edited more carefully, please record the query of patients and doctor while consulting them!
          </div>
        </div>
{/*         
        <div className="absolute w-screen top-[170px]">
            <CategoryScroll categories={statScrollData}/>
        </div> */}

        {/* ── Main ── */}
        <div className="flex flex-col overflow-y-auto remove-scrollbar">

          {/* ── Topbar ── */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">

            {/* Logo center */}
            <div className="flex-1" />
            <Link href='/'>
                <div className="flex items-center gap-2">
                <Image src="/logo-white.png" alt="logo" height={1000} width={1000} className="h-[50px] w-fit" />
                {/* <span className="text-white text-[18px] font-semibold">CareSync</span>     */}
                </div>
            </Link>
            <div className="flex-1 flex justify-end">
              <div className="bg-[#a497ab59] rounded-full text-white/70 text-[10px] px-3 py-1">
                &lt;i&gt; Click on Logo to go to Home page
              </div>
            </div>
          </div>

          {/* ── Welcome ── */}
          <div className="px-6 pb-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-white text-[22px] font-mono font-semibold">Welcome Admin...</h1>
              <p className="text-white/60 text-[12px] mt-1 max-w-[320px] leading-relaxed">
                this is admin dashboard, every data can be manipulated here and stored here please handle safe
              </p>
            </div>

            {/* Search bar */}
            <div className="flex items-center gap-2 bg-[#71677a9d] border border-white/20 rounded-full px-4 py-2 w-[320px] flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              <input
                type="text"
                placeholder="Search patients and doctors by name, date, etc."
                className="bg-transparent text-white/70 text-[12px] outline-none flex-1 placeholder:text-white/40"
              />
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.6">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div className="px-6 pb-6 flex flex-col gap-5">

            {/* Quick Stats */}
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-widest">Quick Stats</p>
              <CategoryScroll categories={statScrollData}/>
            </div>

            <div className="flex flex-col">
              <p className="text-white/50 text-[11px] uppercase tracking-widest mb-2">Bold Stats</p>
              <div className="flex gap-3">
                <StatCard type={"pending"} count={maxWeekly} label={"Appointments this Week"} icon={"/assets/icons/appointments.svg"}/>
                <StatCard type={"pending"} count={pendingAppointments} label={"Pending Appointments"} icon={"/assets/icons/pending.svg"}/>
                <StatCard type={"scheduled"} count={scheduledAppointments} label={"Scheduled Appointments"} icon={"/assets/icons/check.svg"}/>
                <StatCard type={"cancelled"} count={cancelledAppointments} label={"Cancelled Appointments"} icon={"/assets/icons/cancelled.svg"}/>
              </div>
            </div>

            {/* Top Performing Doctors */}
            {/* <div>
              <p className="text-white/50 text-[11px] uppercase tracking-widest mb-2">Top Performing Doctors</p>
              <div className="flex gap-3 overflow-x-auto remove-scrollbar pb-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white/10 border border-white/20 rounded-xl p-3 flex flex-col items-center gap-2 min-w-[100px] flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#8FABD4]/40 border border-white/30 flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#8FABD4">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    </div>
                    <p className="text-white text-[11px] font-semibold text-center">Name here</p>
                    <p className="text-white/50 text-[10px]">Neurologist</p>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Patient Details and Approval section */}

          </div>
          </div>
        </div>
        <div className="w-screen p-4 remove-scrollbar">
          <p className="text-white/50 text-[11px] uppercase tracking-widest mb-2">Patient Details and Approval section</p>
        <DataTable columns={columns} data={recentAppointments as any} />
        </div>
      </div>
    </>
  )
}