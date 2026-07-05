export default function Dashboard({
  campers,
  teams,
  sessions,
  presentCount,
  absentCount,
  lateCount,
  importExcel,
}) {
  const totalCampers = campers.length;
  const marked = presentCount + absentCount + lateCount;
  const notMarked = totalCampers - marked;

  const teamCards = teams.map(([teamName, roster]) => {
    const teamPresent = roster.filter((c) => c.attendance_status === "Present").length;

    return {
      teamName,
      total: roster.length,
      present: teamPresent,
    };
  });

  return (
    <>
      <section className="command-hero">
        <div>
          <h1>Camp Command Center</h1>
          <p>Live camp overview, teams, attendance, and court assignments.</p>
        </div>
      </section>

      <section className="command-stats">
        <div>
          <span>Campers</span>
          <strong>{totalCampers}</strong>
        </div>

        <div>
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div>
          <span>Late</span>
          <strong>{lateCount}</strong>
        </div>

        <div>
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>

        <div>
          <span>Not Marked</span>
          <strong>{notMarked}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Import Camp Workbook</h2>
        <p>
          Upload the Excel workbook. This replaces the current camp data and
          imports campers plus Coach + Court Assignment.
        </p>

        <input type="file" accept=".xlsx,.xls" onChange={importExcel} />
      </section>

      <section className="panel">
        <h2>Teams Overview</h2>

        <div className="dashboard-team-grid">
          {teamCards.map((team) => (
            <div className="dashboard-team-card" key={team.teamName}>
              <h3>{team.teamName}</h3>

              <p>
                <strong>{team.total}</strong> campers
              </p>

              <p>
                <strong>{team.present}</strong> present
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Sessions</h2>

        {sessions.length === 0 ? (
          <p>No attendance sessions created yet.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div className="session-row" key={session.id}>
                <strong>{session.name}</strong>
                <span>{session.session_date || "No date"}</span>
                <span>{session.session_time || "No time"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
