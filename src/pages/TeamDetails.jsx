export default function TeamDetails({
  team,
  roster,
  onBack,
}) {
  return (
    <>
      <section className="panel">
        <button
          className="primary-button"
          onClick={onBack}
        >
          ← Back to Teams
        </button>

        <h1>{team}</h1>

        <div className="stats">
          <div>
            <span>Campers</span>
            <strong>{roster.length}</strong>
          </div>

          <div>
            <span>Gym</span>
            <strong>—</strong>
          </div>

          <div>
            <span>Coach</span>
            <strong>—</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Gym</th>
              <th>Attendance</th>
            </tr>
          </thead>

          <tbody>
            {roster.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.first_name} {c.last_name}
                </td>

                <td>{c.primary_position || "-"}</td>

                <td>{c.gym || "-"}</td>

                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
