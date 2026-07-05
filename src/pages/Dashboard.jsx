import { useMemo, useState } from "react";

const GYMS = ["Maples", "APG", "Ford", "Rec"];

const CAMP_NAMES = {
  "Camp 1": "Camp 1: Beginner Day Camp",
  "Camp 2": "Camp 2: Dig/Pass/Serve Day Camp",
  "Camp 3": "Camp 3: Setter Day Camp",
  "Camp 4": "Camp 4: All Skills Day Camp",
  "Camp 5": "Camp 5: Advanced Setter Day Camp",
  "Camp 6": "Camp 6: Advanced Attacker Day Camp",
  "Camp 7": "Camp 7: Advanced Setter Camp",
  "Camp 8": "Camp 8: Individual Skills Camp",
};

function normalizeGym(info) {
  const text = `${info.gym || ""} ${info.court || ""}`.toLowerCase();

  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";

  return "Other";
}

export default function Dashboard({
  campers,
  teams,
  teamDetails,
  attendance,
  sessions,
  presentCount,
  absentCount,
  lateCount,
  importExcel,
}) {
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [dashboardStatus, setDashboardStatus] = useState("");

  const totalCampers = campers.length;
  const checkedOutCount = campers.filter(
    (c) => attendance[c.id]?.status === "Checked Out"
  ).length;
  const notMarked =
    totalCampers - presentCount - absentCount - lateCount - checkedOutCount;

  function openTeam(teamName) {
    window.dispatchEvent(new CustomEvent("openTeam", { detail: teamName }));
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(([teamName, roster]) => {
      const info = teamDetails[teamName] || {};

      const searchText = `
        ${teamName}
        ${info.camp_id || ""}
        ${info.court || ""}
        ${info.gym || ""}
        ${info.lead_coach_of_gym || ""}
        ${info.coach_1 || ""}
        ${info.coach_2 || ""}
        ${info.coach_3 || ""}
      `.toLowerCase();

      const present = roster.filter(
        (c) => attendance[c.id]?.status === "Present"
      ).length;
      const absent = roster.filter(
        (c) => attendance[c.id]?.status === "Absent"
      ).length;
      const late = roster.filter(
        (c) => attendance[c.id]?.status === "Late"
      ).length;
      const checkedOut = roster.filter(
        (c) => attendance[c.id]?.status === "Checked Out"
      ).length;
      const missing = roster.length - present - absent - late - checkedOut;

      const matchesStatus =
        !dashboardStatus ||
        (dashboardStatus === "Present" && present > 0) ||
        (dashboardStatus === "Absent" && absent > 0) ||
        (dashboardStatus === "Late" && late > 0) ||
        (dashboardStatus === "Checked Out" && checkedOut > 0) ||
        (dashboardStatus === "Missing" && missing > 0);

      return (
        searchText.includes(dashboardSearch.toLowerCase()) && matchesStatus
      );
    });
  }, [teams, teamDetails, attendance, dashboardSearch, dashboardStatus]);

  const teamsByGym = GYMS.map((gym) => ({
    gym,
    teams: filteredTeams.filter(([teamName]) => {
      const info = teamDetails[teamName] || {};
      return normalizeGym(info) === gym;
    }),
  }));

  return (
    <>
      <section className="command-hero">
        <h1>Camp Command Center</h1>
        <p>Live camp overview from the imported workbook.</p>
      </section>

      <section className="command-stats">
        <div><span>Campers</span><strong>{totalCampers}</strong></div>
        <div><span>Present</span><strong>{presentCount}</strong></div>
        <div><span>Late</span><strong>{lateCount}</strong></div>
        <div><span>Absent</span><strong>{absentCount}</strong></div>
        <div><span>Checked Out</span><strong>{checkedOutCount}</strong></div>
        <div><span>Not Marked</span><strong>{notMarked}</strong></div>
      </section>

      <section className="panel">
        <h2>Import Camp Workbook</h2>
        <p>Upload the latest Excel workbook. This replaces the current camp data.</p>
        <input type="file" accept=".xlsx,.xls" onChange={importExcel} />
      </section>

      <section className="panel dashboard-controls">
        <h2>Find Court / Team / Coach</h2>

        <input
          className="search"
          placeholder="Search team, court, coach..."
          value={dashboardSearch}
          onChange={(e) => setDashboardSearch(e.target.value)}
        />

        <select
          value={dashboardStatus}
          onChange={(e) => setDashboardStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Present">Has Present Camper</option>
          <option value="Absent">Has Absent Camper</option>
          <option value="Late">Has Late Camper</option>
          <option value="Checked Out">Has Checked Out Camper</option>
          <option value="Missing">Has Missing Camper</option>
        </select>
      </section>

      <section className="panel">
        <h2>Courts / Teams / Coaches</h2>

        {teamsByGym.map((group) => (
          <div className="gym-section" key={group.gym}>
            <h3>{group.gym}</h3>

            {group.teams.length === 0 ? (
              <p className="muted">No teams assigned.</p>
            ) : (
              <div className="dashboard-team-grid">
                {group.teams.map(([teamName, roster]) => {
                  const info = teamDetails[teamName] || {};
                  const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
                  const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
                  const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
                  const checkedOut = roster.filter((c) => attendance[c.id]?.status === "Checked Out").length;
                  const missing = roster.length - present - absent - late - checkedOut;

                  return (
                    <div className="dashboard-team-card" key={teamName}>
                      <div className="team-card-top">
                        <h3>{teamName}</h3>
                      </div>

                      <p><strong>{CAMP_NAMES[info.camp_id] || "Unassigned Camp"}</strong></p>
                      <p><strong>Court:</strong> {info.court || "—"}</p>

                      <div className="coach-list">
                        <strong>Coaches</strong>
                        <div>{info.coach_1 || info.coach || "—"}</div>
                        {info.coach_2 && <div>{info.coach_2}</div>}
                        {info.coach_3 && <div>{info.coach_3}</div>}
                      </div>

                      <div className="attendance-summary">
                        <span>{present} Present</span>
                        <span>{late} Late</span>
                        <span>{absent} Absent</span>
                        <span>{checkedOut} Out</span>
                        <span>{missing} Missing</span>
                        <span>{roster.length} Total</span>
                      </div>

                      <button className="primary-button" onClick={() => openTeam(teamName)}>
                        Open Team
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Sessions</h2>

        {sessions.length === 0 ? (
          <p>No attendance sessions created yet.</p>
        ) : (
          <div className="session-list">
            {sessions.map((session) => (
              <div className="session-row" key={session.id}>
                <strong>{session.name}</strong>
                <span>{session.session_date || "No date"}</span>
                <span>{session.session_time || "No time"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
