    "use client"

    // components/doctor/tabs/DashboardTab.tsx

    import { useState } from "react"

    interface Doctor {
    name: string
    email: string
    specialization: string
    profilePic?: string
    $id: string
    }

    type RequestStatus = "pending" | "confirmed" | "declined"

    interface PendingRequest {
    id: string
    name: string
    date: string
    time: string
    reason: string
    status: RequestStatus
    avatar: string
    }

    const EARNINGS_DATA = [
    { day: "Mon", lastWeek: 1800, thisWeek: 2100 },
    { day: "Tue", lastWeek: 2500, thisWeek: 1500 },
    { day: "Wed", lastWeek: 1200, thisWeek: 3000 },
    { day: "Thu", lastWeek: 2000, thisWeek: 2800 },
    { day: "Fri", lastWeek: 3000, thisWeek: 3500 },
    { day: "Sat", lastWeek: 1000, thisWeek: 1200 },
    { day: "Sun", lastWeek: 500, thisWeek: 0 },
    ]

    const INITIAL_REQUESTS: PendingRequest[] = [
    { id: "1", name: "Priya Sharma", date: "Thu, Apr 17", time: "10:00 AM", reason: "Follow-up consultation", status: "pending", avatar: "PS" },
    { id: "2", name: "Amit Tiwari", date: "Fri, Apr 18", time: "2:30 PM", reason: "Fever and fatigue", status: "pending", avatar: "AT" },
    { id: "3", name: "Sneha Gupta", date: "Mon, Apr 21", time: "11:00 AM", reason: "Blood test review", status: "pending", avatar: "SG" },
    { id: "4", name: "Rahul Verma", date: "Tue, Apr 22", time: "4:00 PM", reason: "Chest pain check", status: "pending", avatar: "RV" },
    ]

    const STAT_CARDS = [
    { tag: "PENDING", value: "8", mention: "needs action", dot: "bg-yellow-400", textColor: "text-yellow-600" },
    { tag: "SCHEDULED", value: "24", mention: "confirmed", dot: "bg-green-500", textColor: "text-green-700" },
    { tag: "EARNED", value: "₹18.4K", mention: "completed only", dot: "bg-[#203C67]", textColor: "text-[#203C67]" },
    { tag: "TOTAL PATIENTS", value: "312", mention: "all time", dot: "bg-gray-500", textColor: "text-gray-600" },
    ]

    const MAX_EARNING = Math.max(...EARNINGS_DATA.flatMap((d) => [d.lastWeek, d.thisWeek]))

    export default function DashboardTab({ doctor }: { doctor: Doctor }) {
    const [requests, setRequests] = useState<PendingRequest[]>(INITIAL_REQUESTS)

    const handleRequest = (id: string, action: "confirmed" | "declined") => {
        setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: action } : r))
        )
    }

    const thisWeekTotal = EARNINGS_DATA.reduce((s, d) => s + d.thisWeek, 0)
    const lastWeekTotal = EARNINGS_DATA.reduce((s, d) => s + d.lastWeek, 0)
    const diff = thisWeekTotal - lastWeekTotal
    const diffPct = Math.round((diff / lastWeekTotal) * 100)

    return (
        <div className="flex flex-col gap-4 flex-1">
        {/* Stat cards */}
        <section className="grid grid-cols-4 gap-4">
            {STAT_CARDS.map((stat) => (
            <div
                key={stat.tag}
                className="flex flex-col border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm hover:bg-white/60 transition-colors"
            >
                <span className="flex gap-2 items-center text-[11px] font-medium tracking-widest text-gray-500 mb-2">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${stat.dot}`} />
                {stat.tag}
                </span>
                <span className={`text-3xl font-semibold ${stat.textColor}`}>{stat.value}</span>
                <span className="text-[12px] text-gray-500 mt-1">{stat.mention}</span>
            </div>
            ))}
        </section>

        {/* Charts row */}
        <section className="flex gap-4 flex-1 min-h-0">
            {/* Earnings chart */}
            <div className="flex-1 border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col">
            <div className="flex items-start justify-between mb-1">
                <div>
                <h2 className="text-[#203C67] font-semibold text-[16px]">Earnings</h2>
                <span className="text-gray-500 text-[12px]">
                    this week <span className="text-gray-400">vs</span> last week
                </span>
                </div>
                <div className="text-right">
                <p className="text-[13px] font-semibold text-[#203C67]">₹{thisWeekTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[11px] font-medium ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {diff >= 0 ? "▲" : "▼"} {Math.abs(diffPct)}% vs last week
                </p>
                </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-2 flex-1 mt-4 min-h-0">
                {EARNINGS_DATA.map((d) => {
                const lwH = Math.round((d.lastWeek / MAX_EARNING) * 100)
                const twH = Math.round((d.thisWeek / MAX_EARNING) * 100)
                return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-[3px] w-full" style={{ height: "100px" }}>
                        <div
                        className="flex-1 rounded-t-sm bg-[#C8D9EE] hover:bg-[#a8c2e0] transition-colors cursor-pointer"
                        style={{ height: `${lwH}%` }}
                        title={`Last week: ₹${d.lastWeek}`}
                        />
                        <div
                        className="flex-1 rounded-t-sm bg-[#203C67] hover:bg-[#2d5494] transition-colors cursor-pointer"
                        style={{ height: `${twH}%` }}
                        title={`This week: ₹${d.thisWeek}`}
                        />
                    </div>
                    <span className="text-[10px] text-gray-400">{d.day}</span>
                    </div>
                )
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-[#C8D9EE]" />
                <span className="text-[11px] text-gray-500">Last week</span>
                </div>
                <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-[#203C67]" />
                <span className="text-[11px] text-gray-500">This week</span>
                </div>
            </div>
            </div>

            {/* Pending requests */}
            <div className="w-[340px] min-w-[300px] border border-[#203C67] rounded-xl p-5 bg-white/40 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div>
                <h2 className="text-[#203C67] font-semibold text-[16px]">Pending Requests</h2>
                <span className="text-gray-500 text-[12px]">confirm → scheduled · decline → cancelled</span>
                </div>
                <span className="text-[11px] bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-full px-2 py-0.5 font-medium">
                {requests.filter((r) => r.status === "pending").length} new
                </span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
                {requests.map((req) => (
                <div
                    key={req.id}
                    className={`border rounded-lg p-3 transition-opacity ${
                    req.status !== "pending" ? "opacity-50" : "border-[#203C6740] bg-white/50"
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-[#A6BAD7] flex items-center justify-center text-[11px] font-semibold text-[#203C67] flex-shrink-0">
                        {req.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-gray-800 truncate">{req.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                        {req.date} · {req.time}
                        </p>
                    </div>
                    {req.status === "confirmed" && (
                        <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                        confirmed
                        </span>
                    )}
                    {req.status === "declined" && (
                        <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 rounded-full px-2 py-0.5">
                        declined
                        </span>
                    )}
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2 pl-10">{req.reason}</p>
                    {req.status === "pending" && (
                    <div className="flex gap-2 pl-10">
                        <button
                        onClick={() => handleRequest(req.id, "confirmed")}
                        className="flex-1 text-[11px] py-1.5 rounded-md bg-[#203C67] text-white hover:bg-[#2d5494] transition-colors font-medium"
                        >
                        Confirm
                        </button>
                        <button
                        onClick={() => handleRequest(req.id, "declined")}
                        className="flex-1 text-[11px] py-1.5 rounded-md border border-[#203C6740] text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                        Decline
                        </button>
                    </div>
                    )}
                </div>
                ))}
            </div>
            </div>
        </section>
        </div>
    )
    }