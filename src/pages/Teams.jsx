import { useEffect, useMemo, useState } from "react";
import TeamDetails from "./TeamDetails";

export default function Teams({
  teams,
  attendance,
  teamDetails,
  editCamper,
  moveCamperTeam,
  saveTeamInfo,
  selectedTeamFromDashboard,
  checkInEntireTeam,
  checkOutEntireTeam,
}) {
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (selectedTeamFromDashboard) setSelectedTeam(selectedTeamFromDashboard);
  }, [selectedTeamFromDashboard]);

  const camps = [...new Set(
    Object.values(teamDetails || {})
      .map((t) => t.camp_id)
      .filter(Boolean)
  )].sort();

  const filteredTeams = useMemo(() => {
    return teams.filter(([team, roster]) => {
      const info = teamDetails[team] || {};
      const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
      const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;

      const text = `
        ${team}
        ${info.camp_id || ""}
        ${info.court || ""}
        ${info.gym || ""}
        ${info.coach_1 || ""}
        ${info.coach_2 || ""}
        ${info.coach_3 || ""}
        ${present}
        ${absent}
      `.toLowerCase();

      return (
        (!campFilter || info.camp_id === campFilter) &&
        text.includes(search.toLowerCase())
      );
    });
  }, [teams, teamDetails, attendance, search, campFilter]);

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
        saveTeamInfo={saveTeamInfo}
        checkInEntireTeam={checkInEntireTeam}
        checkOutEntireTeam={checkOutEntireTeam}
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
          placeholder="Search teams, courts, coaches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
          <option value="">All Camps</option>
          {camps.map((camp) => (
            <option key={camp} value={camp}>{camp}</option>
          ))}
        </select>
      </section>

      <section className="team-grid">
        {filteredTeams.map(([team, roster]) => {
          const info = teamDetails[team] || {};
          const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
          const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
          const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
          const checkedOut = roster.filter((c) => attendance[c.id]?.status === "Checked Out").length;
          const missing = roster.length - present - absent - late - checkedOut;

          return (
            <div className="team-card" key={team}>
              <h2>{team}</h2>

              <p><strong>Camp:</strong> {info.camp_id || "—"}</p>
              <p><strong>Campers:</strong> {roster.length}</p>
              <p><strong>Gym:</strong> {info.gym || "—"}</p>
              <p><strong>Court:</strong> {info.court || "—"}</p>
              <p><strong>Coach 1:</strong> {info.coach_1 || info.coach || "—"}</p>
              <p><strong>Coach 2:</strong> {info.coach_2 || info.assistant_coach || "—"}</p>
              <p><strong>Coach 3:</strong> {info.coach_3 || "—"}</p>

              <div className="mini-stats">
                <span>{present} Present</span>
                <span>{absent} Absent</span>
                <span>{late} Late</span>
                <span>{missing} Missing</span>
              </div>

              <button className="primary-button" onClick={() => setSelectedTeam(team)}>
                Open Team
              </button>
            </div>
          );
        })}
      </section>
    </>
  );
}
