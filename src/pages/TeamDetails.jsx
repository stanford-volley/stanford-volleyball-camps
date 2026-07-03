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
import { useMemo, useState } from "react";
import TeamDetails from "./TeamDetails";

export default function Teams({ teams, attendance }) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const filteredTeams = useMemo(() => {
    return teams.filter(([team]) =>
      team.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

  if (selectedTeam) {
    const roster =
      teams.find(([team]) => team === selectedTeam)?.[1] || [];

    return (
      <TeamDetails
        team={selectedTeam}
        roster={roster}
        attendance={attendance}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  return (
    <>
      <section className="panel">
        <h2>Team Command Center</h2>

        <input
          className="search"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <section className="team-grid">
        {filteredTeams.map(([team, roster]) => (
          <div className="team-card" key={team}>
            <h2>{team}</h2>

            <p>
              <strong>{roster.length}</strong> Campers
            </p>

            <p>
              <strong>Gym:</strong> —
            </p>

            <p>
              <strong>Coach:</strong> —
            </p>

            <button
              className="primary-button"
              onClick={() => setSelectedTeam(team)}
            >
              Open Team
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
