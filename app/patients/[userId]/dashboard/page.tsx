
import Image from "next/image";
import Link from "next/link";
import { getPatient } from "@/lib/actions/patient.actions";
import { getUser } from "@/lib/actions/patient.actions";
import { recentAppointments } from "@/lib/actions/appointment.actions";
import { formatDateTime } from "@/lib/utils";
import { Doctors } from "@/constants";
import { Appointment, Patient } from "@/types/appwrite";
import SignOutButton from "@/components/ui/signOutButton";
import { redirect } from "next/navigation";
import EditProfileModal from "@/components/ui/EditDetailsModal";

// ─── Status Badge ────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    scheduled: { label: "Scheduled", cls: "badge-scheduled" },
    pending: { label: "Pending", cls: "badge-pending" },
    cancelled: { label: "Cancelled", cls: "badge-cancelled" },
  };
  const s = map[status] ?? { label: status, cls: "badge-pending" };
  return <span className={`dash-badge ${s.cls}`}>{s.label}</span>;
};

// ─── Stat Card ───────────────────────────────────────────────
const StatCard = ({
  label,
  value,
  sub,
  accent,
  className
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  className?: string;
}) => (
  <div className={`${className? className: ''} dash-stat-card`}>
    <p className="dash-stat-label">{label}</p>
    <p className="dash-stat-value" style={accent ? { color: accent } : {}}>
      {value}
    </p>
    {sub && <p className="dash-stat-sub">{sub}</p>}
  </div>
);

// ─── Page ────────────────────────────────────────────────────
const PatientDashboard = async ({
  params,
}: {
  params: Promise<{ userId: string }>;
}) => {
  const { userId } = await params;

  let user, patient, appointmentData

    try {
        user = await getUser(userId)
        patient = await getPatient(userId)
        appointmentData = await recentAppointments()
    } catch (error) {
        console.log(error)
    }
    console.log('patient result:', patient) // ← check terminal output

  if (!patient) redirect(`/patients/${userId}/register`)

  if (!user) redirect('/')

  const appointments: Appointment[] =
    (appointmentData?.documents as unknown as Appointment[])?.filter(
      (a) => a.userId === userId
    ) ?? [];

  const stats = {
    total: appointments.length,
    upcoming: appointments.filter(
      (a) => a.status === "scheduled" || a.status === "pending"
    ).length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
    nextDate: appointments.find((a) => a.status === "scheduled")?.schedule,
  };

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // if (!(patient?.privacyConsent && patient?.treatmentConsent && patient?.disclosureConsent && patient.gender && patient.birthDate)) {
  //   redirect(`/patients/${userId}/register`)
  // }

  return (
    <div className="dash-root font-label ">
      {/* ── Top Nav ── */}
        <div className="flex items-center justify-center mt-5"><Image
          src='/logo.png'
          height={1000}
          width={1000}
          alt='Patient'
          className=' h-[70px] w-fit'
        /></div>

      {/* ── Main ── */}
      <main className="dash-main">
        {/* Greeting */}
        <div className="dash-greeting flex justify-between">
          <h1>Welcome Back, {user.name.split(" ")[0]}</h1>
        <div className="dash-header-right">
          <Link href={`/patients/${userId}/new-appointment`}>
            <button className="dash-add-btn">+ Add Appointment</button>
          </Link>
          <div className="dash-avatar" title={user.name}>
            {initials}
          </div>
        </div>
        </div>

        {/* Stat Cards */}
        <div className="dash-stats">
          <StatCard label="Total Appointments" value={stats.total} sub="All time" className="stat-bg-0" />
          <StatCard
            label="Upcoming"
            value={stats.upcoming}
            sub={
              stats.nextDate
                ? `Next: ${formatDateTime(stats.nextDate).dateOnly}`
                : "None scheduled"
            }
            className='stat-bg-1'
            accent="#1D9E75"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            sub="Last 30 days"
            accent="#E24B4A"
            className='stat-bg-2'
          />
          <StatCard
            label="Primary Doctor"
            value={patient.primaryDoctor ? `Dr. ${patient.primaryDoctor}` : '-'}
            sub="Your doctor"
            className='stat-bg-3'
          />
        </div>

        {/* Bottom Grid */}
        <div className="dash-grid">
          {/* Recent Appointments */}
          <section className="dash-section">
            <h2 className="dash-section-title">Recent Appointment(s)</h2>
            <div className="dash-appt-list p-5 bg-white flex-1 max-h-[392px] h-full overflow-y-auto remove-scrollbar">
              {appointments.length === 0 ? (
                <p className="dash-empty">No appointments yet.</p>
              ) : (
                appointments.slice(0, 5).map((appt) => {
                  const doctor = Doctors.find(
                    (d) => d.name === appt.primaryDoctor
                  );
                  return (
                    <div key={appt.$id} className="dash-appt-card">
                      <div className="dash-appt-date">
                        <span className="dash-appt-day">
                          {new Date(appt.schedule).getDate()}
                        </span>
                        <span className="dash-appt-month">
                          {new Date(appt.schedule).toLocaleString("default", {
                            month: "short",
                          })}
                        </span>
                      </div>
                      <div className="dash-appt-info">
                        <p className="dash-appt-doctor">
                          {doctor?.name ?? appt.primaryDoctor}
                        </p>
                        <p className="dash-appt-detail">
                          {formatDateTime(appt.schedule).timeOnly} ·{" "}
                          {appt.reason ?? "Appointment"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {appt.status === 'pending' && (
                        <button className="px-1 text-sm rounded-full active:bg-red-100 bg-red-200 transition-colors duration-300">Cancel</button>
                        )
                        }
                      <StatusBadge status={appt.status} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Profile */}
          <section className="dash-section">
            <h2 className="dash-section-title">My Profile</h2>
            <div className="dash-profile-card">
              <div className="flex justify-between dash-profile-card-top">
                <div className="dash-profile-header ">
                  <div className="dash-profile-avatar">{initials}</div>
                <div>
                  <p className="dash-profile-name">{user.name}</p>
                  <p className="dash-profile-email">{user.email}</p>
                </div>
                </div>

                <EditProfileModal userId={userId} patientId={patient.$id} user={user} patient={patient} />
              </div>
              <div className="dash-profile-rows">
                {[
                  ["Phone", user.phone],
                  [
                    "Date of birth",
                    patient?.birthDate
                      ? formatDateTime(patient?.birthDate).dateOnly
                      : "—",
                  ],
                  ["Gender", patient?.gender ?? "—"],
                  ["Address", patient?.address ?? "—"],
                  ["Occupation", patient?.occupation ?? "—"],
                  ["Insurance", patient?.insuranceProvider ?? "—"],
                  ["Policy No.", patient?.insurancePolicyNumber ?? "—"],
                  ["Emergency Contact", `${patient?.emergencyContactName}  (${patient?.emergencyContactNumber})`],
                ].map(([key, val]) => (
                  <div key={key} className="dash-profile-row">
                    <span className="dash-profile-key">{key}</span>
                    <span className="dash-profile-val">{val}</span>
                  </div>
                ))}
              </div>
              {/* <PasswordModal password={}} userId={userId}/> */}
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="dash-footer">
        <p>© 2026 CareSync</p>
        <SignOutButton/>
      </footer>
    </div>
  );
};

export default PatientDashboard;