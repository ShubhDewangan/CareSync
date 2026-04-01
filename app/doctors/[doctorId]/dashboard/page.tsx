import Image from "next/image";
import Link from "next/link";
import { Doctors } from "@/constants";
import { recentAppointments } from "@/lib/actions/appointment.actions";
import { Appointment } from "@/types/appwrite";
import { formatDateTime } from "@/lib/utils";

// ── Status Pill ──────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    scheduled: "doc-pill-scheduled",
    pending: "doc-pill-pending",
    cancelled: "doc-pill-cancelled",
  };
  return (
    <span className={`doc-pill ${map[status] ?? "doc-pill-pending"}`}>
      {status}
    </span>
  );
};

// ── Stat Card ────────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: "teal" | "green" | "amber" | "red";
  icon: string;
}) => (
  <div className={`doc-stat-card doc-stat-${accent}`}>
    <div className={`doc-stat-icon doc-stat-icon-${accent}`}>{icon}</div>
    <p className={`doc-stat-value doc-stat-val-${accent}`}>{value}</p>
    <p className="doc-stat-label">{label}</p>
    {sub && <p className={`doc-stat-sub doc-stat-sub-${accent}`}>{sub}</p>}
  </div>
);

// ── Page ─────────────────────────────────────────────────────
const DoctorDashboard = async ({
  params,
}: {
  params: Promise<{ doctorName: string }>;
}) => {
  const { doctorName } = await params;
  const name = decodeURIComponent(doctorName);
  const doctor = Doctors.find((d) => d.name === name);

  const appointmentData = await recentAppointments();
  const allAppointments = (
    appointmentData?.documents as unknown as Appointment[]
  ) ?? [];

  const doctorAppointments = allAppointments.filter(
    (a) => a.primaryDoctor === name
  );

  const stats = {
    today: doctorAppointments.filter(
      (a) =>
        new Date(a.schedule).toDateString() === new Date().toDateString()
    ).length,
    total: doctorAppointments.length,
    pending: doctorAppointments.filter((a) => a.status === "pending").length,
    cancelled: doctorAppointments.filter((a) => a.status === "cancelled").length,
  };

  const todayAppointments = doctorAppointments.filter(
    (a) => new Date(a.schedule).toDateString() === new Date().toDateString()
  );

  const waitingQueue = doctorAppointments.filter(
    (a) => a.status === "pending"
  ).slice(0, 4);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="doc-root">
      {/* ── Header ── */}
      <header className="doc-header">
        <div className="doc-logo">
          Care<span>Sync</span>
          <span className="doc-logo-sub">/ Doctor</span>
        </div>

        <div className="doc-header-center">
          <div className="doc-live-dot" />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="doc-header-right">
          <div className="doc-notif">
            🔔
            {stats.pending > 0 && (
              <span className="doc-notif-badge">{stats.pending}</span>
            )}
          </div>
          <div className="doc-chip">
            {doctor ? (
              <Image
                src={doctor.image}
                alt={name}
                width={30}
                height={30}
                className="doc-chip-img"
              />
            ) : (
              <div className="doc-chip-avatar">{initials}</div>
            )}
            <span className="doc-chip-name">Dr. {name.split(" ").slice(-1)}</span>
          </div>
        </div>
      </header>

      <div className="doc-layout">
        {/* ── Sidebar ── */}
        <aside className="doc-sidebar">
          <div className="doc-nav-section">Main</div>
          <div className="doc-nav-item doc-nav-active">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/></svg>
            Dashboard
          </div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v3M11 1v3M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Appointments
            <span className="doc-nav-badge">{stats.today}</span>
          </div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            My Patients
            <span className="doc-nav-badge">{stats.total}</span>
          </div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Medical Records
          </div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Prescriptions
            {stats.pending > 0 && (
              <span className="doc-nav-badge doc-nav-badge-red">{stats.pending}</span>
            )}
          </div>

          <div className="doc-nav-section">Analytics</div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><path d="M1 12l4-4 3 3 4-5 3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Reports
          </div>
          <div className="doc-nav-item">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Schedule
          </div>

          <div className="doc-sidebar-spacer" />

          <div className="doc-availability">
            <span>Available</span>
            <div className="doc-toggle" />
          </div>

          <Link href="/" className="doc-nav-item doc-nav-signout">
            <svg className="doc-nav-icon" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sign Out
          </Link>
        </aside>

        {/* ── Content ── */}
        <div className="doc-content">

          {/* Greeting */}
          <div className="doc-greeting">
            <h1 className="doc-page-title">Good morning, Dr. {name}</h1>
            <p className="doc-page-sub">
              {stats.today} appointments today · {stats.pending} pending review
            </p>
          </div>

          {/* Alert */}
          {stats.pending > 0 && (
            <div className="doc-alert">
              ⚠️ &nbsp; You have <strong>{stats.pending}</strong> pending appointments requiring review
            </div>
          )}

          {/* Stats */}
          <div className="doc-stats">
            <StatCard label="Today's Appointments" value={stats.today} sub="Scheduled for today" accent="teal" icon="📅" />
            <StatCard label="Total Patients" value={stats.total} sub="All time" accent="green" icon="✓" />
            <StatCard label="Pending Reviews" value={stats.pending} sub="Requires attention" accent="amber" icon="⏳" />
            <StatCard label="Cancelled" value={stats.cancelled} sub="Last 30 days" accent="red" icon="✕" />
          </div>

          {/* Schedule + Queue */}
          <div className="doc-two-col">

            {/* Today's Schedule */}
            <div className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-title">Today&apos;s Schedule</span>
                <span className="doc-card-action">View all →</span>
              </div>
              <div className="doc-card-body doc-card-list">
                {todayAppointments.length === 0 ? (
                  <p className="doc-empty">No appointments today.</p>
                ) : (
                  todayAppointments.map((appt) => {
                    const initials = appt.patient?.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2) ?? "?";
                    return (
                      <div key={appt.$id} className="doc-appt-item">
                        <div className="doc-appt-time">
                          <span className="doc-appt-hour">
                            {new Date(appt.schedule).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).split(" ")[0]}
                          </span>
                          <span className="doc-appt-ampm">
                            {new Date(appt.schedule).getHours() >= 12 ? "PM" : "AM"}
                          </span>
                        </div>
                        <div className="doc-appt-avatar">{initials}</div>
                        <div className="doc-appt-info">
                          <p className="doc-appt-name">{appt.patient?.name ?? "Unknown"}</p>
                          <p className="doc-appt-reason">{appt.reason ?? "Appointment"}</p>
                        </div>
                        <StatusPill status={appt.status} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right col */}
            <div className="doc-right-col">

              {/* Waiting Queue */}
              <div className="doc-card">
                <div className="doc-card-header">
                  <span className="doc-card-title">Waiting Queue</span>
                  <span className="doc-card-action">Manage →</span>
                </div>
                <div className="doc-card-body doc-card-list">
                  {waitingQueue.length === 0 ? (
                    <p className="doc-empty">No patients waiting.</p>
                  ) : (
                    waitingQueue.map((appt, i) => (
                      <div key={appt.$id} className="doc-queue-item">
                        <div className="doc-queue-num">{i + 1}</div>
                        <div className="doc-queue-info">
                          <p className="doc-queue-name">{appt.patient?.name ?? "Unknown"}</p>
                          <p className="doc-queue-meta">{appt.reason ?? "Appointment"}</p>
                        </div>
                        <span className="doc-queue-wait">
                          {i === 0 ? "Now" : `~${i * 20}m`}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="doc-card">
                <div className="doc-card-header">
                  <span className="doc-card-title">Quick Actions</span>
                </div>
                <div className="doc-actions-grid">
                  <button className="doc-action-btn">📝 Write Prescription</button>
                  <button className="doc-action-btn">📋 Add Medical Note</button>
                  <button className="doc-action-btn">📅 Schedule Appointment</button>
                  <button className="doc-action-btn">📁 View Records</button>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom row */}
          <div className="doc-three-col">

            {/* Weekly bar chart */}
            <div className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-title">Weekly Patient Load</span>
                <span className="doc-card-action">This week</span>
              </div>
              <div className="doc-card-body">
                <div className="doc-mini-chart">
                  {[40, 65, 55, 85, 70, 30, 20].map((h, i) => (
                    <div
                      key={i}
                      className={`doc-bar ${i === 3 ? "doc-bar-active" : ""}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="doc-chart-labels">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i} className={`doc-chart-label ${i === 3 ? "doc-chart-label-active" : ""}`}>{d}</span>
                  ))}
                </div>
                <div className="doc-chart-summary">
                  <span>Total: <strong>31</strong></span>
                  <span>Avg: <strong>6.2/day</strong></span>
                </div>
              </div>
            </div>

            {/* Recent appointments summary */}
            <div className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-title">Recent Appointments</span>
                <span className="doc-card-action">View all →</span>
              </div>
              <div className="doc-card-body doc-card-list">
                {doctorAppointments.slice(0, 4).map((appt) => (
                  <div key={appt.$id} className="doc-appt-item">
                    <div className="doc-appt-avatar">
                      {appt.patient?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?"}
                    </div>
                    <div className="doc-appt-info">
                      <p className="doc-appt-name">{appt.patient?.name ?? "Unknown"}</p>
                      <p className="doc-appt-reason">{formatDateTime(appt.schedule).dateOnly}</p>
                    </div>
                    <StatusPill status={appt.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor info card */}
            <div className="doc-card">
              <div className="doc-card-header">
                <span className="doc-card-title">My Profile</span>
                <span className="doc-card-action">Edit →</span>
              </div>
              <div className="doc-card-body">
                <div className="doc-profile-header">
                  {doctor ? (
                    <Image src={doctor.image} alt={name} width={52} height={52} className="doc-profile-img" />
                  ) : (
                    <div className="doc-profile-avatar">{initials}</div>
                  )}
                  <div>
                    <p className="doc-profile-name">Dr. {name}</p>
                    <p className="doc-profile-spec">General Medicine</p>
                  </div>
                </div>
                <div className="doc-profile-rows">
                  {[
                    ["Specialization", "General Medicine"],
                    ["Experience", "12 years"],
                    ["Ward", "3B"],
                    ["Total Patients", stats.total],
                    ["Today's Load", stats.today],
                  ].map(([k, v]) => (
                    <div key={k} className="doc-profile-row">
                      <span className="doc-profile-key">{k}</span>
                      <span className="doc-profile-val">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="doc-footer">
        <p>© 2026 CareSync · Dr. {name} · General Medicine</p>
        <Link href="/" className="doc-footer-signout">→ Sign Out</Link>
      </footer>
    </div>
  );
};

export default DoctorDashboard;