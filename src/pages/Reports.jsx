export default function Reports({
  sessions,
  selectedSession,
  setSelectedSession,
  teams,
  teamFilter,
  setTeamFilter,
  attendanceCampers,
  attendance,
  presentCount,
  absentCount,
  lateCount,
}) {
  return (
    <>
      <section className="panel attendance-controls">
        <h2>Reports</h2>

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

        <button
          className="primary-button"
          onClick={() => window.print()}
        >
          Print Report
        </button>
      </section>

      <section className="stats">
        <div>
          <span>Total</span>
          <strong>{attendanceCampers.length}</strong>
        </div>

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

        <div>
          <span>Not Marked</span>
          <strong>
            {attendanceCampers.filter((c) => !attendance[c.id]).length}
          </strong>
        </div>
      </section>

      <section className="panel">
        <h2>Attendance Report</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team</th>
              <th>Position</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {attendanceCampers.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.first_name} {c.last_name}
                </td>

                <td>{c.main_team || "-"}</td>

                <td>{c.primary_position || "-"}</td>

                <td>{attendance[c.id]?.status || "Not Marked"}</td>

                <td>{attendance[c.id]?.notes || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
