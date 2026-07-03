export default function Campers({
  search,
  setSearch,
  filteredCampers,
  attendance,
  editCamper,
}) {
  return (
    <>
      <section className="panel">
        <h2>Find Campers</h2>
        <input
          className="search"
          placeholder="Search by name, team, position, age, grade, club, friend group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="panel">
        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Team</th>
              <th>Camp</th>
              <th>Gym</th>
              <th>Position</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCampers.map((c) => (
              <tr key={c.id}>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.main_team || "-"}</td>
                <td>{c.camp || "-"}</td>
                <td>{c.gym || "-"}</td>
                <td>{c.primary_position || "-"}</td>
                <td>{c.friend_group || "-"}</td>
                <td>{attendance[c.id]?.status || "-"}</td>
                <td>{attendance[c.id]?.notes || ""}</td>
                <td>
                  <button
                    className="small-button"
                    onClick={() => editCamper(c)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
