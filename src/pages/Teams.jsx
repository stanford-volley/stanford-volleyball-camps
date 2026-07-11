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

const BLOCK_CAMPS = {
  1: ["Camp 1", "Camp 2"],
  2: ["Camp 3", "Camp 4"],
  3: ["Camp 5", "Camp 6"],
  4: ["Camp 7", "Camp 8"],
};

const styles = {
  snapshotPanel: { background: "#fff", borderRadius: 16, padding: 18, marginBottom: 18, boxShadow: "0 2px 12px rgba(0,0,0,.08)" },
  snapshotTitle: { margin: "0 0 4px", fontSize: 24 },
  snapshotHelp: { margin: "0 0 16px", color: "#666" },
  campHeader: { background: "#8c1515", color: "white", borderRadius: 10, padding: "10px 14px", margin: "14px 0 10px", fontSize: 18, fontWeight: 800 },
  countGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 8 },
  countButton: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%", border: "1px solid #d8d8d8", borderRadius: 10, background: "#f8f8f8", padding: "10px 12px", cursor: "pointer", textAlign: "left", fontSize: 15, fontWeight: 800 },
  countBadge: { minWidth: 34, borderRadius: 999, padding: "4px 8px", background: "#8c1515", color: "white", textAlign: "center", fontSize: 14 },
  rank: { color: "#777", fontSize: 12, marginRight: 6 },
};

function normalizeCampValue(value) {
  const match = String(value || "").match(/camp\s*([1-8])/i);
  return match ? `Camp ${match[1]}` : "";
}

function campNumber(value) {
  const match = normalizeCampValue(value).match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function campLabel(campId) {
  const normalized = normalizeCampValue(campId);
  return CAMP_OPTIONS.find((camp) => camp.value === normalized)?.label || normalized || "Unassigned Camp";
}

function mostCommonCamp(roster) {
  const counts = new Map();
  for (const camper of roster || []) {
    const camp = normalizeCampValue(camper.camp);
    if (!camp) continue;
    counts.set(camp, (counts.get(camp) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || campNumber(a[0]) - campNumber(b[0]))[0]?.[0] || "";
}

function detectActiveBlock(teams) {
  const counts = new Map();
  for (const [, roster] of teams || []) {
    for (const camper of roster || []) {
      const number = campNumber(camper.camp);
      if (!number) continue;
      const block = Math.ceil(number / 2);
      counts.set(block, (counts.get(block) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 1;
}

function resolveTeamCamp(roster, info, activeBlock) {
  const rosterCamp = mostCommonCamp(roster);
  if (rosterCamp) return rosterCamp;

  const localCamp = normalizeCampValue(info?.camp_id);
  const localNumber = campNumber(localCamp);
  const activeCamps = BLOCK_CAMPS[activeBlock] || [];
  if (localNumber === 1) return activeCamps[0] || localCamp;
  if (localNumber === 2) return activeCamps[1] || localCamp;
  return localCamp;
}

function teamRank(info) {
  const value = Number(info?.rank);
  return Number.isFinite(value) && value > 0 ? value : 9999;
}

function sortRecordsByRank(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  return a.team.localeCompare(b.team);
}

function gymFromInfo(info) {
  const gym = String(info?.gym || "").trim();
  const court = String(info?.court || "").trim();
  if (/maples/i.test(court)) return "Maples";
  if (/apg/i.test(court)) return "APG";
  if (/ford/i.test(court)) return "Ford";
  if (/rec|burnham/i.test(court)) return "Rec";
  return gym || "—";
}

export default function Teams({ teams, attendance, teamDetails, editCamper, moveCamperTeam, saveTeamInfo, selectedTeamFromDashboard, checkInEntireTeam, checkOutEntireTeam, markAttendance, updateAttendanceNotes }) {
  const [search, setSearch] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  useEffect(() => {
    if (selectedTeamFromDashboard) setSelectedTeam(selectedTeamFromDashboard);
  }, [selectedTeamFromDashboard]);

  const activeBlock = useMemo(() => detectActiveBlock(teams), [teams]);
  const activeCampValues = BLOCK_CAMPS[activeBlock] || [];

  const teamRecords = useMemo(() => teams.map(([team, roster]) => {
    const info = teamDetails[team] || {};
    return { team, roster, info, actualCamp: resolveTeamCamp(roster, info, activeBlock), rank: teamRank(info) };
  }).sort(sortRecordsByRank), [teams, teamDetails, activeBlock]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return teamRecords.filter(({ team, roster, info, actualCamp }) => {
      const text = `${team} ${actualCamp} ${campLabel(actualCamp)} ${info.court || ""} ${gymFromInfo(info)} ${info.coach_1 || ""} ${info.coach_2 || ""} ${info.coach_3 || ""} ${roster.length}`.toLowerCase();
      return (!campFilter || actualCamp === campFilter) && text.includes(query);
    });
  }, [teamRecords, search, campFilter]);

  const teamsByCamp = useMemo(() => CAMP_OPTIONS.filter((camp) => activeCampValues.includes(camp.value)).map((camp) => ({
    ...camp,
    records: filteredRecords.filter((record) => record.actualCamp === camp.value).sort(sortRecordsByRank),
  })).filter((camp) => !campFilter || camp.value === campFilter), [filteredRecords, campFilter, activeCampValues]);

  if (selectedTeam) {
    const roster = teams.find(([team]) => team === selectedTeam)?.[1] || [];
    const info = teamDetails[selectedTeam] || {};
    const actualCamp = resolveTeamCamp(roster, info, activeBlock);
    return <TeamDetails team={selectedTeam} roster={roster} attendance={attendance} teams={teams} teamInfo={{ ...info, camp_id: actualCamp }} editCamper={editCamper} moveCamperTeam={moveCamperTeam} saveTeamInfo={saveTeamInfo} checkInEntireTeam={checkInEntireTeam} checkOutEntireTeam={checkOutEntireTeam} markAttendance={markAttendance} updateAttendanceNotes={updateAttendanceNotes} onBack={() => setSelectedTeam(null)} />;
  }

  return <>
    <section className="panel team-controls">
      <h2>Team Command Center</h2>
      <input className="search" placeholder="Search teams, courts, coaches..." value={search} onChange={(event) => setSearch(event.target.value)} />
      <select value={campFilter} onChange={(event) => setCampFilter(event.target.value)}>
        <option value="">All Camps</option>
        {CAMP_OPTIONS.filter((camp) => activeCampValues.includes(camp.value)).map((camp) => <option key={camp.value} value={camp.value}>{camp.label}</option>)}
      </select>
    </section>

    <section style={styles.snapshotPanel}>
      <h2 style={styles.snapshotTitle}>Active Team Count</h2>
      <p style={styles.snapshotHelp}>Live camper totals. Teams are ordered by the Rank column from Coach + Court Assignment.</p>
      {teamsByCamp.map((camp) => <div key={`snapshot-${camp.value}`}>
        <div style={styles.campHeader}>{camp.label}</div>
        <div style={styles.countGrid}>
          {camp.records.map(({ team, roster, rank }) => <button key={`count-${team}`} type="button" style={styles.countButton} onClick={() => setSelectedTeam(team)} title={`Open ${team}`}>
            <span>{rank < 9999 && <span style={styles.rank}>#{rank}</span>}{team}</span>
            <span style={styles.countBadge}>{roster.length}</span>
          </button>)}
        </div>
      </div>)}
    </section>

    {teamsByCamp.map((camp) => <section className="panel camp-team-section" key={camp.value}>
      <h2>{camp.label}</h2>
      {camp.records.length === 0 ? <p className="muted">No teams assigned to this camp.</p> : <section className="team-grid">
        {camp.records.map(({ team, roster, info, actualCamp }) => {
          const present = roster.filter((camper) => attendance[camper.id]?.status === "Present").length;
          const absent = roster.filter((camper) => attendance[camper.id]?.status === "Absent").length;
          const late = roster.filter((camper) => attendance[camper.id]?.status === "Late").length;
          const checkedOut = roster.filter((camper) => attendance[camper.id]?.status === "Checked Out").length;
          const missing = roster.length - present - absent - late - checkedOut;
          return <div className="team-card" key={team}>
            <h2>{team}</h2>
            <p><strong>Camp:</strong> {campLabel(actualCamp)}</p>
            <p><strong>Campers:</strong> {roster.length}</p>
            <p><strong>Gym:</strong> {gymFromInfo(info)}</p>
            <p><strong>Court:</strong> {info.court || "—"}</p>
            <p><strong>Coach 1:</strong> {info.coach_1 || info.coach || "—"}</p>
            <p><strong>Coach 2:</strong> {info.coach_2 || info.assistant_coach || "—"}</p>
            <p><strong>Coach 3:</strong> {info.coach_3 || "—"}</p>
            <div className="mini-stats"><span>{present} Present</span><span>{absent} Absent</span><span>{late} Late</span><span>{missing} Missing</span></div>
            <button className="primary-button" onClick={() => setSelectedTeam(team)}>Open Team</button>
          </div>;
        })}
      </section>}
    </section>)}
  </>;
}
