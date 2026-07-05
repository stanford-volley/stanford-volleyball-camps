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
  const notMarked = totalCampers - presentCount - absentCount - lateCount;

  function openTeam(teamName) {
    window.dispatchEvent(
      new CustomEvent("openTeam", {
        detail: teamName,
      })
    );
  }

  return (
    <>
      <section className="command-hero">
        <h1>Camp Command Center</h1>
        <p>Live overview for campers, teams, courts, and attendance.</p>
      </section>

      <section className="command-stats">
        <div><span>Campers</span><strong>{totalCampers}</strong></div>
        <div><span>Present</span><strong>{presentCount}</strong></div>
        <div><span>Late</span><strong>{lateCount}</strong></div>
        <div><span>Absent</span><strong>{absentCount}</strong></div>
        <div><span>Not Marked</span><strong>{notMarked}</strong></div>
      </section>

      <section className="panel">
        <h2>Import Camp Workbook</h2>
        <p>
          Upload the Excel workbook. This replaces the current camp and imports
          campers plus Coach + Court Assignment.
        </p>
        <input type="file" accept=".xlsx,.xls" onChange={importExcel} />
      </section>

      <section className="panel">
        <h2>Teams / Courts</h2>

        <div className="dashboard-team-grid">
          {teams.map(([teamName, roster]) => {
            const present = roster.filter(
              (c) => c.attendance_status === "Present"
            ).length;

            return (
              <div className="dashboard-team-card" key={teamName}>
                <h3>{teamName}</h3>

                <p><strong>{roster.length}</strong> campers</p>
                <p><strong>{present}</strong> present</p>

                <button
                  className="primary-button"
                  onClick={() => openTeam(teamName)}
                >
                  Open Team
                </button>
              </div>
            );
          })}
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
