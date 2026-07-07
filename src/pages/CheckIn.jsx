import { useMemo, useState } from "react";

function formatSessionDate(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = String(dateValue).split("-");
  if (!year || !month || !day) return String(dateValue);
  return `${Number(month)}/${Number(day)}/${year}`;
}

function sessionDisplayName(session) {
  const dateLabel = formatSessionDate(session?.session_date);
  return dateLabel ? `${dateLabel} - ${session.name}` : session?.name || "Camp Session";
}

function normalizeGym(teamInfo) {
  const text = `${teamInfo?.gym || ""} ${teamInfo?.court || ""}`.toLowerCase();

  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";

  return teamInfo?.gym || "-";
}

function isConfirmedAbsent(attendanceRow) {
  return String(attendanceRow?.notes || "")
    .toLowerCase()
    .includes("confirmed absent");
}

function confirmedAbsentNotes(existingNotes) {
  const notes = String(existingNotes || "").trim();
  if (!notes) return "Confirmed Absent";
  if (notes.toLowerCase().includes("confirmed absent")) return notes;
  return `Confirmed Absent — ${notes}`;
}

export default function CheckIn({
  campers,
  teamDetails,
  sessions,
  selectedSession,
  setSelectedSession,
  attendance,
  markAttendance,
  updateAttendanceNotes,
}) {
  const [search, setSearch] = useState("");
  const [showConfirmed, setShowConfirmed] = useState(false);

  const absentCampers = useMemo(() => {
    const q = search.toLowerCase();

    return campers
      .filter((c) => attendance[c.id]?.status === "Absent")
      .filter((c) => showConfirmed || !isConfirmedAbsent(attendance[c.id]))
      .filter((c) => {
        const info = teamDetails[c.main_team] || {};
        const text = `
          ${c.first_name || ""}
          ${c.last_name || ""}
          ${c.main_team || ""}
          ${c.primary_position || ""}
          ${info.camp_id || ""}
          ${info.court || ""}
          ${info.gym || ""}
          ${info.coach_1 || ""}
          ${info.coach_2 || ""}
          ${info.coach_3 || ""}
        `.toLowerCase();

        return text.includes(q);
      })
      .sort((a, b) =>
        `${a.last_name || ""} ${a.first_name || ""}`.localeCompare(
          `${b.last_name || ""} ${b.first_name || ""}`
        )
      );
  }, [campers, attendance, teamDetails, search, showConfirmed]);

  const openAbsentCount = campers.filter(
    (c) =>
      attendance[c.id]?.status === "Absent" &&
      !isConfirmedAbsent(attendance[c.id])
  ).length;

  const confirmedCount = campers.filter(
    (c) =>
      attendance[c.id]?.status === "Absent" &&
      isConfirmedAbsent(attendance[c.id])
  ).length;

  return (
    <>
      <section className="panel checkin-page-header">
        <h2>Check-In Follow-Up</h2>
        <p>
          This page only shows campers marked <strong>Absent</strong>. Use it to
          confirm true absences or quickly change a camper to Present.
        </p>

        <div className="checkin-session-panel">
          <strong>Session:</strong>
          <div className="checkin-session-buttons">
            {sessions.map((session) => (
              <button
                key={session.id}
                className={selectedSession === session.id ? "line-button active" : "line-button"}
                onClick={() => setSelectedSession(session.id)}
              >
                {sessionDisplayName(session)}
              </button>
            ))}
          </div>
        </div>

        <div className="checkin-summary">
          <div>
            <span>Needs Follow-Up</span>
            <strong>{openAbsentCount}</strong>
          </div>
          <div>
            <span>Confirmed Absent</span>
            <strong>{confirmedCount}</strong>
          </div>
        </div>

        <div className="checkin-tools">
          <input
            className="search"
            placeholder="Search absent camper, team, court, coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label className="checkin-checkbox">
            <input
              type="checkbox"
              checked={showConfirmed}
              onChange={(e) => setShowConfirmed(e.target.checked)}
            />
            Show confirmed absences
          </label>
        </div>
      </section>

      <section className="checkin-absent-list">
        {absentCampers.length === 0 ? (
          <section className="panel">
            <h2>No absent campers need follow-up.</h2>
            <p>Anyone marked Absent will appear here.</p>
          </section>
        ) : (
          absentCampers.map((c) => {
            const info = teamDetails[c.main_team] || {};
            const row = attendance[c.id] || {};
            const confirmed = isConfirmedAbsent(row);

            return (
              <div className="checkin-absent-card" key={c.id}>
                <div>
                  <h3>
                    {c.first_name} {c.last_name}
                  </h3>
                  <p>
                    <strong>{info.camp_id || c.camp || "Camp"}</strong> | {c.main_team || "No Team"} | {normalizeGym(info)} | {info.court || "No Court"}
                  </p>
                  <p>
                    <strong>Coach:</strong> {info.coach_1 || info.coach || "—"}
                  </p>
                  <span className={confirmed ? "confirmed-absent-pill" : "needs-followup-pill"}>
                    {confirmed ? "Confirmed Absent" : "Needs Follow-Up"}
                  </span>
                  {row.notes && <p className="checkin-note">Notes: {row.notes}</p>}
                </div>

                <div className="checkin-absent-actions">
                  <button
                    className="primary-button"
                    onClick={() => markAttendance(c.id, "Present")}
                  >
                    Mark Present
                  </button>

                  <button
                    className="danger-button"
                    onClick={() =>
                      updateAttendanceNotes(
                        c.id,
                        confirmedAbsentNotes(row.notes)
                      )
                    }
                  >
                    Confirm Absent
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
