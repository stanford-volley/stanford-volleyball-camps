import { useMemo, useState } from "react";
import TeamDetails from "./TeamDetails";

export default function Teams({
  teams,
  attendance,
  teamDetails,
  editCamper,
  moveCamperTeam,
}) {
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const filteredTeams = useMemo(() => {
    return teams.filter(([team]) =>
      team.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

  if (selectedTeam) {
    const roster = teams.find(([team]) => team === selectedTeam)?.[1] || [];

    return (
      <TeamDetails
        team={selectedTeam}
        roster={roster}
        attendance={attendance}
        teams={teams}
        teamInfo={teamDetails[selectedTeam]}
        editCamper={editCamper}
        moveCamperTeam={moveCamperTeam}
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
        {filteredTeams.map(([team, roster]) => {
          const info = teamDetails[team] || {};

          return (
            <div className="team-card" key={team}>
              <h2>{team}</h2>

              <p>
                <strong>{roster.length}</strong> Campers
              </p>

              <p>
                <strong>Gym:</strong> {info.gym || "—"}
              </p>

              <p>
                <strong>Court:</strong> {info.court || "—"}
              </p>

              <p>
                <strong>Coach:</strong> {info.coach || "—"}
              </p>

              <button
                className="primary-button"
                onClick={() => setSelectedTeam(team)}
              >
                Open Team
              </button>
            </div>
          );
        })}
      </section>
    </>
  );
}
