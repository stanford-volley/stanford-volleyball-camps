export default function Attendance({
  sessions,
  selectedSession,
  setSelectedSession,
  createSession,
  teams,
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

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
        >
          <option value="">All Teams</option>

          {teams.map(([team]) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
          <option value="Not Marked">Not Marked</option>
        </select>
      </section>

      <section className="stats">
        <div>
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div>
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>

        <div>
          <span>Late</span>
          <strong>{lateCount}</strong>
        </div>
      </section>

      <section className="attendance-list">
        {attendanceCampers.map((c) => (
          <div className="attendance-row" key={c.id}>
            <div>
              <h3>
                {c.first_name} {c.last_name}
              </h3>

              <p>
                Team: {c.main_team || "—"} | Gym: {c.gym || "—"} | Position:{" "}
                {c.primary_position || "—"}
              </p>
            </div>

            <div className="attendance-buttons">
              <button
                className={
                  attendance[c.id]?.status === "Present"
                    ? "present active"
                    : "present"
                }
                onClick={() => markAttendance(c.id, "Present")}
              >
                Present
              </button>

              <button
                className={
                  attendance[c.id]?.status === "Absent"
                    ? "absent active"
                    : "absent"
                }
                onClick={() => markAttendance(c.id, "Absent")}
              >
                Absent
              </button>

              <button
                className={
                  attendance[c.id]?.status === "Late"
                    ? "late active"
                    : "late"
                }
                onClick={() => markAttendance(c.id, "Late")}
              >
                Late
              </button>
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
