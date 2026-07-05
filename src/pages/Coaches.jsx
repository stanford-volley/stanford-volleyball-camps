import { useMemo, useState } from "react";

const CAMP_OPTIONS = [
  { value: "Camp 1", label: "CAMP 1: Beginner Day Camp" },
  { value: "Camp 2", label: "CAMP 2: Dig/Pass/Serve Day Camp" },
  { value: "Camp 3", label: "CAMP 3: Setter Day Camp" },
  { value: "Camp 4", label: "CAMP 4: All Skills Day Camp" },
  { value: "Camp 5", label: "CAMP 5: Advanced Setter Day Camp" },
  { value: "Camp 6", label: "CAMP 6: Advanced Attacker Day Camp" },
  { value: "Camp 7", label: "CAMP 7: Advanced Setter Camp" },
  { value: "Camp 8", label: "CAMP 8: Individual Skills Camp" },
];

export default function Coaches({
  teams,
  teamDetails,
  attendance,
}) {
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");

  const coachGroups = useMemo(() => {
    const grouped = {};

    teams.forEach(([teamName, roster]) => {
      const info = teamDetails[teamName] || {};

      if (campFilter && info.camp_id !== campFilter) return;

      const coaches = [
        info.coach_1 || info.coach,
        info.coach_2 || info.assistant_coach,
        info.coach_3,
      ].filter(Boolean);

      coaches.forEach((coach) => {
        if (!grouped[coach]) {
          grouped[coach] = [];
        }

        grouped[coach].push({
          teamName,
          roster,
          info,
        });
      });
    });

    return Object.entries(grouped)
      .filter(([coach]) => coach.toLowerCase().includes(search.toLowerCase()))
      .sort(([a], [b]) => a.localeCompare(b));
  }, [teams, teamDetails, attendance, search, campFilter]);

  return (
    <>
      <section className="panel coach-controls">
        <h2>Coach Command Center</h2>

        <input
          className="search"
          placeholder="Search coach..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
          <option value="">All Camps</option>
          {CAMP_OPTIONS.map((camp) => (
            <option key={camp.value} value={camp.value}>
              {camp.label}
            </option>
          ))}
        </select>
      </section>

      <section className="coach-grid">
        {coachGroups.map(([coach, assignments]) => {
          const totalCampers = assignments.reduce(
            (sum, a) => sum + a.roster.length,
            0
          );

          const present = assignments.reduce(
            (sum, a) =>
              sum +
              a.roster.filter((c) => attendance[c.id]?.status === "Present").length,
            0
          );

          const absent = assignments.reduce(
            (sum, a) =>
              sum +
              a.roster.filter((c) => attendance[c.id]?.status === "Absent").length,
            0
          );

          return (
            <div className="coach-card" key={coach}>
              <h3>{coach}</h3>

              <div className="mini-stats">
                <span>{assignments.length} Teams</span>
                <span>{totalCampers} Campers</span>
                <span>{present} Present</span>
                <span>{absent} Absent</span>
              </div>

              <table className="campers-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Camp</th>
                    <th>Court</th>
                    <th>Campers</th>
                  </tr>
                </thead>

                <tbody>
                  {assignments.map((a) => (
                    <tr key={`${coach}-${a.teamName}`}>
                      <td>{a.teamName}</td>
                      <td>{a.info.camp_id || "-"}</td>
                      <td>{a.info.court || "-"}</td>
                      <td>{a.roster.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
    </>
  );
}
