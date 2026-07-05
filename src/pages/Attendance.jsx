import { useMemo, useState } from "react";

const CAMP_OPTIONS = [
  { value: "Camp 1", label: "CAMP 1: Beginner Day Camp" },
  { value: "Camp 2", label: "CAMP 2: Dig/Pass/Serve Day Camp" },
  { value: "Camp 3", label: "CAMP 3: Setter Day Camp" },
  { value: "Camp 4", label: "CAMP 4: All Skills Day Camp" },
  { value: "Camp 5", label: "CAMP 5: Advanced Setter Day Camp" },
  { value: "Camp 6", label: "CAMP 6: Advanced Attacker Day Camp" },
  { value: "Camp 7", label: "CAMP 7: Advanced Setter Camp" },
  { value: "Camp 8", label: "CAMP 8: Individual Skills Camp" },
];

export default function Attendance({
  sessions,
  selectedSession,
  setSelectedSession,
  deleteSession,
  createSession,
  teams,
  teamDetails,
  campFilter,
  setCampFilter,
  teamFilter,
  setTeamFilter,
  statusFilter,
  setStatusFilter,
  presentCount,
  absentCount,
  lateCount,
  attendanceCampers,
  attendance,
  markAttendance,
  updateAttendanceNotes,
}) {
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const visibleTeams = teams.filter(([team]) => {
    const info = teamDetails[team] || {};
    return !campFilter || info.camp_id === campFilter;
  });

  const searchedCampers = useMemo(() => {
    const q = attendanceSearch.toLowerCase();

    return attendanceCampers.filter((c) => {
      const info = teamDetails[c.main_team] || {};

      const text = `
        ${c.first_name || ""}
        ${c.last_name || ""}
        ${c.main_team || ""}
        ${c.primary_position || ""}
        ${info.camp_id || ""}
        ${info.court || ""}
        ${info.coach_1 || ""}
        ${info.coach_2 || ""}
        ${info.coach_3 || ""}
      `.toLowerCase();

      return text.includes(q);
    });
  }, [attendanceCampers, attendanceSearch, teamDetails]);

  

  const notMarkedCount = searchedCampers.filter((c) => !attendance[c.id]).length;

  return (
    <>
      <section className="panel attendance-page-header">
        <h2>Attendance</h2>

        <div className="attendance-toolbar">
          <button className="primary-button" onClick={createSession}>
            + Create Session
          </button>

          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <option value="">Select Session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.session_date ? `— ${s.session_date}` : ""}
              </option>
            ))}
          </select>

          <button
            className="danger-button"
            onClick={() => deleteSession(selectedSession)}
          >
            Delete Session
          </button>
        </div>

        <div className="attendance-filters">
          <select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
            <option value="">All Camps</option>
            {CAMP_OPTIONS.map((camp) => (
              <option key={camp.value} value={camp.value}>
                {camp.label}
              </option>
            ))}
          </select>

          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {visibleTeams.map(([team]) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Not Marked">Not Marked</option>
          </select>
        </div>

        <input
          className="search"
          placeholder="Search camper, team, court, coach..."
          value={attendanceSearch}
          onChange={(e) => setAttendanceSearch(e.target.value)}
        />
      </section>

      <section className="stats attendance-stats">
        <div><span>Total</span><strong>{searchedCampers.length}</strong></div>
        <div><span>Present</span><strong>{searchedCampers.filter((c) => attendance[c.id]?.status === "Present").length}</strong></div>
        <div><span>Absent</span><strong>{searchedCampers.filter((c) => attendance[c.id]?.status === "Absent").length}</strong></div>
        <div><span>Late</span><strong>{searchedCampers.filter((c) => attendance[c.id]?.status === "Late").length}</strong></div>
        <div><span>Not Marked</span><strong>{notMarkedCount}</strong></div>
      </section>

      <section className="attendance-list compact-attendance-list">
        {searchedCampers.map((c) => {
          const info = teamDetails[c.main_team] || {};
          const status = attendance[c.id]?.status || "Not Marked";

          return (
            <div className="attendance-row compact-attendance-row" key={c.id}>
              <div className="attendance-person">
                <h3>{c.first_name} {c.last_name}</h3>
                <p>
                  {info.camp_id || "—"} | {c.main_team || "—"} | {info.court || "—"} | {c.primary_position || "—"}
                </p>
                <span className={`status-pill status-${status.replaceAll(" ", "-").toLowerCase()}`}>
                  {status}
                </span>
              </div>

              <div className="attendance-buttons compact-buttons">
                <button className={status === "Present" ? "present active" : "present"} onClick={() => markAttendance(c.id, "Present")}>Present</button>
                <button className={status === "Absent" ? "absent active" : "absent"} onClick={() => markAttendance(c.id, "Absent")}>Absent</button>
                <button className={status === "Late" ? "late active" : "late"} onClick={() => markAttendance(c.id, "Late")}>Late</button>
              </div>

              <textarea
                className="attendance-notes compact-notes"
                placeholder="Notes:"
                value={attendance[c.id]?.notes || ""}
                onChange={(e) => updateAttendanceNotes(c.id, e.target.value)}
              />
            </div>
          );
        })}
      </section>
    </>
  );
}
