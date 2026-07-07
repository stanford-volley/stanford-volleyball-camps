function normalizeGym(teamInfo) {
  const text = `${teamInfo?.gym || ""} ${teamInfo?.court || ""}`.toLowerCase();

  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";

  return teamInfo?.gym || "-";
}

function gymDisplay(teamInfo) {
  const gym = normalizeGym(teamInfo);
  const court = teamInfo?.court || "";

  if (!court) return gym;
  if (gym === "-" || court.toLowerCase().includes(gym.toLowerCase())) return court;

  return `${gym} — ${court}`;
}

export default function Campers({
  search,
  setSearch,
  filteredCampers,
  attendance,
  teamDetails,
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
              <th>Gym</th>
              <th>Camp</th>
              <th>Position</th>
              <th>Grade</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCampers.map((c) => {
              const teamInfo = teamDetails?.[c.main_team] || {};

              return (
                <tr key={c.id}>
                  <td>
                    <strong>
                      {c.first_name} {c.last_name}
                    </strong>
                  </td>
                  <td>{c.main_team || "-"}</td>
                  <td>{gymDisplay(teamInfo)}</td>
                  <td>{c.camp || teamInfo.camp_id || "-"}</td>
                  <td>{c.primary_position || "-"}</td>
                  <td>{c.grade || "-"}</td>
                  <td>{c.friend_group || "-"}</td>
                  <td>{attendance[c.id]?.status || "Not Marked"}</td>
                  <td>
                    <button className="small-button" onClick={() => editCamper(c)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
