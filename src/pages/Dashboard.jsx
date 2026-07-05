import { useMemo, useState } from "react";

const GYMS = ["Maples", "APG", "Ford", "Rec"];

function normalizeGym(info) {
  const text = `${info.gym || ""} ${info.court || ""}`.toLowerCase();

  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";

  return "Other";
}

function teamStatus(roster, attendance) {
  const total = roster.length;
  const marked = roster.filter((c) => attendance[c.id]).length;

  if (total === 0) return "empty";
  if (marked === total) return "complete";
  if (marked > 0) return "partial";
  return "missing";
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
  const notMarked = totalCampers - presentCount - absentCount - lateCount - checkedOutCount;

  function openTeam(teamName) {
    window.dispatchEvent(new CustomEvent("openTeam", { detail: teamName }));
  }

  const filteredTeams = useMemo(() => {
    return teams.filter(([teamName, roster]) => {
      const info = teamDetails[teamName] || {};
      const status = teamStatus(roster, attendance);

      const searchText = `
        ${teamName}
        ${info.camp_id || ""}
        ${info.court || ""}
        ${info.gym || ""}
        ${info.lead_coach_of_gym || ""}
        ${info.coach_1 || ""}
        ${info.coach_2 || ""}
        ${info.coach_3 || ""}
        ${info.session_name || ""}
        ${info.assignment_date || ""}
      `.toLowerCase();

      const matchesSearch = searchText.includes(dashboardSearch.toLowerCase());
      const matchesStatus = !dashboardStatus || status === dashboardStatus;

      return matchesSearch && matchesStatus;
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
          placeholder="Search team, court, coach, session, date..."
          value={dashboardSearch}
          onChange={(e) => setDashboardSearch(e.target.value)}
        />

        <select
          value={dashboardStatus}
          onChange={(e) => setDashboardStatus(e.target.value)}
        >
          <option value="">All Team Statuses</option>
          <option value="complete">Complete</option>
          <option value="partial">In Progress</option>
          <option value="missing">Not Started</option>
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
                  const status = teamStatus(roster, attendance);

                  return (
                    <div className={`dashboard-team-card team-status-${status}`} key={teamName}>
                      <div className="team-card-top">
                        <h3>{teamName}</h3>
                        <span className={`team-status-pill ${status}`}>
                          {status === "complete"
                            ? "Complete"
                            : status === "partial"
                            ? "In Progress"
                            : "Not Started"}
                        </span>
                      </div>

                      <p><strong>Camp:</strong> {info.camp_id || "—"}</p>
                      <p><strong>Session:</strong> {info.session_name || "—"}</p>
                      <p><strong>Court:</strong> {info.court || "—"}</p>
                      <p><strong>Lead Coach:</strong> {info.lead_coach_of_gym || "—"}</p>
                      <p><strong>Coach 1:</strong> {info.coach_1 || info.coach || "—"}</p>
                      <p><strong>Coach 2:</strong> {info.coach_2 || info.assistant_coach || "—"}</p>
                      <p><strong>Coach 3:</strong> {info.coach_3 || "—"}</p>

                      <div className="mini-stats">
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
