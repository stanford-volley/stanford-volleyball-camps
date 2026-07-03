import { useMemo, useState } from "react";
import TeamDetails from "./TeamDetails";

export default function Teams({ teams, attendance, editCamper }) {
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
  editCamper={editCamper}
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
