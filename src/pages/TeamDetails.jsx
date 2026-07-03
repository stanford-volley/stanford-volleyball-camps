export default function TeamDetails({
  team,
  roster,
  attendance,
  onBack,
}) {
  const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
  const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
  const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
  const notMarked = roster.filter((c) => !attendance[c.id]).length;

  return (
    <>
      <section className="panel">
        <button className="primary-button" onClick={onBack}>
          ← Back to Teams
        </button>
        <button className="primary-button" onClick={() => window.print()}>
  Print Team Roster
</button>

        <h1>{team}</h1>

        <section className="stats">
          <div><span>Campers</span><strong>{roster.length}</strong></div>
          <div><span>Present</span><strong>{present}</strong></div>
          <div><span>Absent</span><strong>{absent}</strong></div>
          <div><span>Late</span><strong>{late}</strong></div>
          <div><span>Not Marked</span><strong>{notMarked}</strong></div>
        </section>
      </section>

      <section className="panel">
        <h2>Team Roster</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Gym</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {roster.map((c) => (
              <tr key={c.id}>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.primary_position || "-"}</td>
                <td>{c.gym || "-"}</td>
                <td>{c.friend_group || "-"}</td>
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
