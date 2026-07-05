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

  <section className="panel">
  <h2>Courts & Teams</h2>

  <div className="dashboard-team-grid">
    {teams.map(([teamName, roster]) => {
      const total = roster.length;

      return (
        <div className="dashboard-team-card" key={teamName}>
          <h3>{teamName}</h3>

          <p>
            <strong>{total}</strong> Campers
          </p>

          <p>
            Court: <strong>{roster[0]?.court || "—"}</strong>
          </p>

          <p>
            Coach:
            <strong> {roster[0]?.coach_1 || "—"}</strong>
          </p>

          <button
            className="primary-button"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("openTeam", {
                  detail: teamName,
                })
              );
            }}
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
