import { useEffect, useMemo, useState } from "react";
import TeamDetails from "./TeamDetails";

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

function campLabel(campId) {
  return CAMP_OPTIONS.find((c) => c.value === campId)?.label || campId || "Unassigned Camp";
}

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
  markAttendance,
  updateAttendanceNotes,
}) {
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (selectedTeamFromDashboard) setSelectedTeam(selectedTeamFromDashboard);
  }, [selectedTeamFromDashboard]);

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

  const teamsByCamp = CAMP_OPTIONS.map((camp) => ({
    ...camp,
    teams: filteredTeams.filter(([team]) => {
      const info = teamDetails[team] || {};
      return info.camp_id === camp.value;
    }),
  })).filter((camp) => !campFilter || camp.value === campFilter);

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
        markAttendance={markAttendance}
        updateAttendanceNotes={updateAttendanceNotes}
        onBack={() => setSelectedTeam(null)}
      />
    );
  }

  return (
    <>
      <section className="panel team-controls">
        <h2>Team Command Center</h2>

        <input
          className="search"
          placeholder="Search teams, courts, coaches..."
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

      {teamsByCamp.map((camp) => (
        <section className="panel camp-team-section" key={camp.value}>
          <h2>{camp.label}</h2>

          {camp.teams.length === 0 ? (
            <p className="muted">No teams assigned to this camp.</p>
          ) : (
            <section className="team-grid">
              {camp.teams.map(([team, roster]) => {
                const info = teamDetails[team] || {};
                const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
                const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
                const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
                const checkedOut = roster.filter((c) => attendance[c.id]?.status === "Checked Out").length;
                const missing = roster.length - present - absent - late - checkedOut;

                return (
                  <div className="team-card" key={team}>
                    <h2>{team}</h2>

                    <p><strong>Camp:</strong> {campLabel(info.camp_id)}</p>
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
          )}
        </section>
      ))}
    </>
  );
}
