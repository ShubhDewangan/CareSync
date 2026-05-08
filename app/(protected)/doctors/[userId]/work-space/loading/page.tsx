// app/(protected)/doctors/[userId]/dashboard/loading.tsx
// Drop this file in the same folder as page.tsx

export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-screen bg-[#EFECE3] overflow-hidden">

      {/* ── Sidebar skeleton ── */}
      <aside className="hidden lg:flex py-5 px-4 w-[280px] min-w-[280px] flex-col flex-shrink-0">
        <div className="rounded-2xl flex flex-col items-center border border-[#203C67] bg-[#EFECE3] shadow-md overflow-hidden h-full">

          {/* Logo area */}
          <div className="w-full flex justify-center pt-4 pb-2 border-b border-[#203C6720]">
            <div className="h-14 w-32 rounded-lg bg-[#203C6715] animate-pulse" />
          </div>

          {/* Profile area */}
          <div className="w-full flex flex-col items-center px-4 pt-5 pb-4 border-b border-[#203C6720] gap-3">
            <div className="h-20 w-20 rounded-full bg-[#203C6720] animate-pulse" />
            <div className="h-4 w-32 rounded bg-[#203C6720] animate-pulse" />
            <div className="h-3 w-24 rounded bg-[#203C6715] animate-pulse" />
            <div className="flex gap-2 mt-1">
              <div className="h-6 w-16 rounded-full bg-[#203C6715] animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-[#203C6715] animate-pulse" />
            </div>
          </div>

          {/* Quick stats skeleton */}
          <div className="w-full px-4 py-4 border-b border-[#203C6720]">
            <div className="h-3 w-20 rounded bg-[#203C6715] animate-pulse mb-3" />
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between bg-[#D8E4F0] rounded-lg px-3 py-2">
                  <div className="h-3 w-28 rounded bg-[#203C6720] animate-pulse" />
                  <div className="h-3 w-6 rounded bg-[#203C6730] animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity skeleton */}
          <div className="w-full px-4 py-4">
            <div className="h-3 w-24 rounded bg-[#203C6715] animate-pulse mb-3" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#203C6730] animate-pulse flex-shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-3 w-full rounded bg-[#203C6715] animate-pulse" />
                    <div className="h-2 w-12 rounded bg-[#203C6710] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content skeleton ── */}
      <main className="flex-1 flex flex-col pb-3 sm:pb-5 pr-3 sm:pr-5 pt-3 sm:pt-5 pl-3 sm:pl-0 gap-3 sm:gap-4 overflow-hidden min-w-0">

        {/* Tab bar skeleton */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="lg:hidden w-9 h-9 rounded-xl bg-[#203C6715] animate-pulse flex-shrink-0" />
          <div className="flex-1 flex justify-center">
            <div className="bg-[#A6BAD7] flex gap-1.5 rounded-xl px-2 py-2 shadow-sm">
              {["Dashboard", "Schedule", "Patients", "Settings"].map((tab, i) => (
                <div
                  key={tab}
                  className={`px-4 py-2 rounded-lg text-[13px] font-medium animate-pulse ${
                    i === 0 ? "bg-[#203C67] w-24 h-8" : "bg-[#93abcf] w-20 h-8"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard content skeleton */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/60 rounded-2xl p-4 border border-[#203C6715] animate-pulse">
                <div className="h-3 w-20 rounded bg-[#203C6715] mb-3" />
                <div className="h-7 w-12 rounded bg-[#203C6720]" />
              </div>
            ))}
          </div>

          {/* Chart + pending row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white/60 rounded-2xl p-4 border border-[#203C6715] animate-pulse h-52">
              <div className="h-4 w-32 rounded bg-[#203C6715] mb-4" />
              <div className="flex items-end gap-2 h-32 px-2">
                {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col gap-1 items-center justify-end">
                    <div className="w-full rounded-t bg-[#203C6720]" style={{ height: `${h}%` }} />
                    <div className="h-2 w-6 rounded bg-[#203C6715]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pending requests */}
            <div className="bg-white/60 rounded-2xl p-4 border border-[#203C6715] animate-pulse">
              <div className="h-4 w-28 rounded bg-[#203C6715] mb-4" />
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[#203C6708]">
                    <div className="h-9 w-9 rounded-full bg-[#203C6720] flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-3 w-24 rounded bg-[#203C6720]" />
                      <div className="h-2 w-16 rounded bg-[#203C6715]" />
                    </div>
                    <div className="h-6 w-14 rounded-full bg-[#203C6715]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/60 rounded-2xl p-4 border border-[#203C6715] animate-pulse h-40">
                <div className="h-4 w-24 rounded bg-[#203C6715] mb-4" />
                <div className="flex flex-col gap-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-8 w-full rounded-xl bg-[#203C6710]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading status text */}
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[#203C67] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-[11px] text-[#203C67]/60 font-medium">Loading your dashboard…</span>
        </div>
      </main>
    </div>
  )
}