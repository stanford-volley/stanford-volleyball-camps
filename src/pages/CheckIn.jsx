import { useEffect, useMemo, useState } from "react";

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

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayAndTomorrowKeys() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return new Set([localDateKey(today), localDateKey(tomorrow)]);
}

function normalizeGym(teamInfo) {
  const text = `${teamInfo?.gym || ""} ${teamInfo?.court || ""}`.toLowerCase();

  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";

  return teamInfo?.gym || "-";
}

function confirmToken(sessionId) {
  return `[confirmed_absent_session:${sessionId}]`;
}

function isConfirmedAbsentForSession(attendanceRow, sessionId) {
  if (!sessionId) return false;
  return String(attendanceRow?.notes || "").includes(confirmToken(sessionId));
}

function visibleNotes(notes) {
  return String(notes || "")
    .replace(/\s*\[confirmed_absent_session:[^\]]+\]/g, "")
    .replace(/\s*Confirmed (Absent|Out)( - [^—]+)?\s*—?\s*/gi, "")
    .trim();
}

function confirmedAbsentNotes(existingNotes, sessionId, sessionLabel, status = "Absent") {
  const notes = String(existingNotes || "").trim();
  const token = confirmToken(sessionId);

  if (notes.includes(token)) return notes;

  const cleanNotes = visibleNotes(notes);
  const confirmationText = `Confirmed ${status === "Checked Out" ? "Out" : "Absent"} - ${sessionLabel}`;

  return cleanNotes ? `${confirmationText} ${token} — ${cleanNotes}` : `${confirmationText} ${token}`;
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

  const visibleSessions = useMemo(() => {
    const allowedDates = getTodayAndTomorrowKeys();

    return sessions
      .filter((session) => allowedDates.has(String(session.session_date || "")))
      .sort((a, b) => {
        const dateCompare = String(a.session_date || "").localeCompare(
          String(b.session_date || "")
        );
        if (dateCompare !== 0) return dateCompare;

        const periodRank = (session) => {
          const text = `${session.session_time || ""} ${session.name || ""}`.toUpperCase();
          if (text.includes("AM")) return 1;
          if (text.includes("PM")) return 2;
          if (text.includes("EVE")) return 3;
          return 99;
        };

        const periodCompare = periodRank(a) - periodRank(b);
        if (periodCompare !== 0) return periodCompare;

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [sessions]);

  useEffect(() => {
    if (!visibleSessions.length) return;

    const selectedIsVisible = visibleSessions.some(
      (session) => session.id === selectedSession
    );

    if (!selectedIsVisible) {
      setSelectedSession(visibleSessions[0].id);
    }
  }, [visibleSessions, selectedSession, setSelectedSession]);

  const selectedSessionRow =
    visibleSessions.find((session) => session.id === selectedSession) ||
    sessions.find((session) => session.id === selectedSession);

  const selectedSessionLabel = sessionDisplayName(selectedSessionRow);

  const absentCampers = useMemo(() => {
    const q = search.toLowerCase();

    return campers
      .filter((c) => ["Absent", "Checked Out"].includes(attendance[c.id]?.status))
      .filter((c) => showConfirmed || !isConfirmedAbsentForSession(attendance[c.id], selectedSession))
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
  }, [campers, attendance, teamDetails, search, showConfirmed, selectedSession]);

  const openAbsentCount = campers.filter(
    (c) =>
      ["Absent", "Checked Out"].includes(attendance[c.id]?.status) &&
      !isConfirmedAbsentForSession(attendance[c.id], selectedSession)
  ).length;

  const confirmedCount = campers.filter(
    (c) =>
      ["Absent", "Checked Out"].includes(attendance[c.id]?.status) &&
      isConfirmedAbsentForSession(attendance[c.id], selectedSession)
  ).length;

  return (
    <>
      <section className="panel checkin-page-header">
        <h2>Check-In Follow-Up</h2>
        <p>
          This page shows campers marked <strong>Absent</strong> or <strong>Out</strong>. Use it to
          reconfirm absence for this session or quickly change a camper to Present.
        </p>

        <div className="checkin-session-panel">
          <strong>Session:</strong>
          <div className="checkin-session-buttons">
            {visibleSessions.map((session) => (
              <button
                key={session.id}
                className={selectedSession === session.id ? "line-button active" : "line-button"}
                onClick={() => setSelectedSession(session.id)}
              >
                {sessionDisplayName(session)}
              </button>
            ))}
          </div>

          {visibleSessions.length === 0 && (
            <p className="muted">
              No sessions are scheduled for today or tomorrow.
            </p>
          )}
        </div>

        <div className="checkin-summary">
          <div>
            <span>Needs Follow-Up</span>
            <strong>{openAbsentCount}</strong>
          </div>
          <div>
            <span>Confirmed Follow-Up</span>
            <strong>{confirmedCount}</strong>
          </div>
        </div>

        <div className="checkin-tools">
          <input
            className="search"
            placeholder="Search absent/out camper, team, court, coach..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label className="checkin-checkbox">
            <input
              type="checkbox"
              checked={showConfirmed}
              onChange={(e) => setShowConfirmed(e.target.checked)}
            />
            Show confirmed follow-ups
          </label>
        </div>
      </section>

      <section className="checkin-absent-list">
        {absentCampers.length === 0 ? (
          <section className="panel">
            <h2>No absent campers need follow-up.</h2>
            <p>Anyone marked Absent or Out will appear here.</p>
          </section>
        ) : (
          absentCampers.map((c) => {
            const info = teamDetails[c.main_team] || {};
            const row = attendance[c.id] || {};
            const confirmed = isConfirmedAbsentForSession(row, selectedSession);
            const cleanNote = visibleNotes(row.notes);

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
                    {confirmed
                      ? `Confirmed ${row.status === "Checked Out" ? "Out" : "Absent"}`
                      : `${row.status === "Checked Out" ? "Out" : "Absent"} - Needs Follow-Up`}
                  </span>
                  {cleanNote && <p className="checkin-note">Notes: {cleanNote}</p>}
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
                        confirmedAbsentNotes(row.notes, selectedSession, selectedSessionLabel, row.status)
                      )
                    }
                  >
                    Confirm Absence
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
