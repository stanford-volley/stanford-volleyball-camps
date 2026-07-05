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
  const visibleTeams = teams.filter(([team]) => {
    const info = teamDetails[team] || {};
    return !campFilter || info.camp_id === campFilter;
  });

  return (
    <>
      <section className="panel attendance-controls">
        <h2>Attendance</h2>

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
          <option value="Checked Out">Checked Out</option>
          <option value="Not Marked">Not Marked</option>
        </select>
      </section>

      <section className="stats">
        <div><span>Present</span><strong>{presentCount}</strong></div>
        <div><span>Absent</span><strong>{absentCount}</strong></div>
        <div><span>Late</span><strong>{lateCount}</strong></div>
      </section>

      <section className="attendance-list">
        {attendanceCampers.map((c) => (
          <div className="attendance-row" key={c.id}>
            <div>
              <h3>{c.first_name} {c.last_name}</h3>
              <p>
                Camp: {teamDetails[c.main_team]?.camp_id || "—"} | Team: {c.main_team || "—"} | Position: {c.primary_position || "—"}
              </p>
            </div>

            <div className="attendance-buttons">
              <button className={attendance[c.id]?.status === "Present" ? "present active" : "present"} onClick={() => markAttendance(c.id, "Present")}>Present</button>
              <button className={attendance[c.id]?.status === "Absent" ? "absent active" : "absent"} onClick={() => markAttendance(c.id, "Absent")}>Absent</button>
              <button className={attendance[c.id]?.status === "Late" ? "late active" : "late"} onClick={() => markAttendance(c.id, "Late")}>Late</button>
            </div>

            <textarea
              className="attendance-notes"
              placeholder="Notes:"
              value={attendance[c.id]?.notes || ""}
              onChange={(e) => updateAttendanceNotes(c.id, e.target.value)}
            />
          </div>
        ))}
      </section>
    </>
  );
}
