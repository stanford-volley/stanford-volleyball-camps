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
        <h2>Campers</h2>

        <inputexport default function Campers({
  search,
  setSearch,
  filteredCampers,
  attendance,
  editCamper,
}) {
  return (
    <>
      <section className="panel">
        <h2>Campers</h2>

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
              <th>Position</th>
              <th>Grade</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCampers.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>
                    {c.first_name} {c.last_name}
                  </strong>
                </td>

                <td>{c.main_team || "-"}</td>
                <td>{c.camp || "-"}</td>
                <td>{c.primary_position || "-"}</td>
                <td>{c.grade || "-"}</td>
                <td>{c.friend_group || "-"}</td>
                <td>{attendance[c.id]?.status || "Not Marked"}</td>

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
              <th>Position</th>
              <th>Grade</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCampers.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>
                    {c.first_name} {c.last_name}
                  </strong>
                </td>

                <td>{c.main_team || "-"}</td>
                <td>{c.camp || "-"}</td>
                <td>{c.primary_position || "-"}</td>
                <td>{c.grade || "-"}</td>
                <td>{c.friend_group || "-"}</td>
                <td>{attendance[c.id]?.status || "Not Marked"}</td>

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
