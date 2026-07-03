import { useMemo, useState } from "react";

export default function Teams({ teams }) {
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(() => {
    return teams.filter(([team]) =>
      team.toLowerCase().includes(search.toLowerCase())
    );
  }, [teams, search]);

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

            <hr />

            <p>
              <strong>Gym:</strong> —
            </p>

            <p>
              <strong>Coach:</strong> —
            </p>

            <button
              className="primary-button"
              onClick={() =>
                alert(
                  `${team}\n\nThis page is coming next.\n\n${roster.length} campers`
                )
              }
            >
              Open Team
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
