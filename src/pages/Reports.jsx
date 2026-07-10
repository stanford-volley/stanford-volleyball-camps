import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const GYMS = ["Maples", "APG", "Rec", "Ford"];

function normalizeCampValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/camp\s*([1-8])/i);
  return match ? `Camp ${match[1]}` : text;
}

function rosterCampValue(roster, info) {
  const camperCamp = (roster || [])
    .map((camper) => normalizeCampValue(camper.camp))
    .find(Boolean);

  return camperCamp || normalizeCampValue(info?.camp_id || "");
}

function teamRank(info) {
  const value = Number(info?.rank);
  return Number.isFinite(value) && value > 0 ? value : 9999;
}

function campName(value) {
  return CAMP_OPTIONS.find((c) => c.value === value)?.label || value || "All Camps";
}

function formatSessionDate(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = String(dateValue).split("-");
  if (!year || !month || !day) return String(dateValue);
  return `${Number(month)}/${Number(day)}/${year}`;
}

function sessionLabel(session) {
  if (!session) return "Select Session";
  const date = formatSessionDate(session.session_date);
  return date ? `${date} - ${session.name}` : session.name;
}

function normalizeGym(info) {
  const text = `${info?.gym || ""} ${info?.court || ""}`.toLowerCase();
  if (text.includes("maples")) return "Maples";
  if (text.includes("apg")) return "APG";
  if (text.includes("ford")) return "Ford";
  if (text.includes("rec") || text.includes("burnham")) return "Rec";
  return "Other";
}

function courtNumber(info) {
  const match = String(info?.court || "").match(/(\d+)/);
  return match ? Number(match[1]) : 999;
}

function splitCoachNames(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function getCoaches(info) {
  return [
    ...splitCoachNames(info?.coach_1 || info?.coach),
    ...splitCoachNames(info?.coach_2 || info?.assistant_coach),
    ...splitCoachNames(info?.coach_3),
  ];
}

function sortByLastName(a, b) {
  const last = String(a.last_name || "").localeCompare(String(b.last_name || ""));
  if (last !== 0) return last;
  return String(a.first_name || "").localeCompare(String(b.first_name || ""));
}

function friendGroupLabel(camper) {
  return String(camper?.friend_group || "").trim();
}

function fitText(doc, text, maxWidth) {
  const safe = String(text || "");
  if (doc.getTextWidth(safe) <= maxWidth) return safe;

  let trimmed = safe;
  while (trimmed.length > 1 && doc.getTextWidth(`${trimmed}…`) > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}…`;
}

export default function Reports({
  sessions = [],
  selectedSession = "",
  setSelectedSession = () => {},
  teams = [],
  teamDetails = {},
  campFilter = "",
  setCampFilter = () => {},
  teamFilter = "",
  setTeamFilter = () => {},
  attendanceCampers = [],
  attendance = {},
  presentCount = 0,
  absentCount = 0,
  lateCount = 0,
}) {
  const selectedSessionRow = sessions.find((s) => s.id === selectedSession);

  const visibleTeams = teams.filter(([team]) => {
    const info = teamDetails[team] || {};
    return !campFilter || info.camp_id === campFilter;
  });

  const checkedOutCount = attendanceCampers.filter(
    (c) => attendance[c.id]?.status === "Checked Out"
  ).length;

  const notMarkedCount = attendanceCampers.filter((c) => !attendance[c.id]).length;

  function downloadAttendancePDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);

    doc.setFontSize(13);
    doc.text("Attendance Report", 40, 62);

    doc.setFontSize(10);
    doc.text(`Session: ${sessionLabel(selectedSessionRow)}`, 40, 84);
    doc.text(`Camp: ${campName(campFilter)}`, 40, 100);
    doc.text(`Team: ${teamFilter || "All Teams"}`, 40, 116);
    doc.text(`Total: ${attendanceCampers.length}`, 40, 136);
    doc.text(`Present: ${presentCount}`, 120, 136);
    doc.text(`Absent: ${absentCount}`, 210, 136);
    doc.text(`Late: ${lateCount}`, 300, 136);
    doc.text(`Out: ${checkedOutCount}`, 370, 136);
    doc.text(`Not Marked: ${notMarkedCount}`, 430, 136);

    autoTable(doc, {
      startY: 156,
      head: [["Name", "Camp", "Team", "Court", "Coach", "Status", "Notes"]],
      body: attendanceCampers.map((c) => {
        const info = teamDetails[c.main_team] || {};
        return [
          `${c.first_name || ""} ${c.last_name || ""}`,
          info.camp_id || "",
          c.main_team || "",
          info.court || "",
          info.coach_1 || "",
          attendance[c.id]?.status || "Not Marked",
          attendance[c.id]?.notes || "",
        ];
      }),
      styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [140, 21, 21], textColor: 255 },
      margin: { left: 30, right: 30 },
    });

    doc.save("attendance-report.pdf");
  }

  function downloadMissingPDF() {
    const missing = attendanceCampers.filter((c) => !attendance[c.id]);
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);
    doc.setFontSize(13);
    doc.text("Missing / Not Marked Campers", 40, 62);
    doc.setFontSize(10);
    doc.text(`Session: ${sessionLabel(selectedSessionRow)}`, 40, 84);
    doc.text(`Camp: ${campName(campFilter)}`, 40, 100);
    doc.text(`Team: ${teamFilter || "All Teams"}`, 40, 116);
    doc.text(`Missing: ${missing.length}`, 40, 136);

    autoTable(doc, {
      startY: 156,
      head: [["Name", "Camp", "Team", "Court", "Coach", "Position"]],
      body: missing.map((c) => {
        const info = teamDetails[c.main_team] || {};
        return [
          `${c.first_name || ""} ${c.last_name || ""}`,
          info.camp_id || "",
          c.main_team || "",
          info.court || "",
          info.coach_1 || "",
          c.primary_position || "",
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [140, 21, 21], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    doc.save("missing-campers-report.pdf");
  }

  function drawTeamTable(doc, teamName, roster, info, x, y, width, height) {
    const rowCount = Math.max(roster.length, 1);
    const headerHeight = 58;
    const rowHeight = Math.max(8.4, Math.min(12.4, (height - headerHeight) / rowCount));
    const numberWidth = 18;
    const friendWidth = 24;
    const firstWidth = (width - numberWidth - friendWidth) * 0.47;
    const lastWidth = width - numberWidth - friendWidth - firstWidth;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.45);
    doc.setFillColor(245, 245, 245);
    doc.rect(x, y, width, headerHeight, "FD");

    const coaches = getCoaches(info);
    const headerLines = [
      `CT ${courtNumber(info) === 999 ? "" : courtNumber(info)}`.trim(),
      ...coaches,
      teamName,
      `${roster.length} Campers`,
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    const lineHeight = 8.2;
    let headerY = y + 9;
    headerLines.slice(0, 7).forEach((line) => {
      doc.text(fitText(doc, line, width - 6), x + width / 2, headerY, { align: "center" });
      headerY += lineHeight;
    });

    const sortedRoster = [...roster].sort(sortByLastName);
    let rowY = y + headerHeight;

    sortedRoster.forEach((camper, index) => {
      const isAlt = index % 2 === 0;
      if (isAlt) {
        doc.setFillColor(238, 238, 238);
        doc.rect(x, rowY, width, rowHeight, "F");
      }

      doc.setDrawColor(0, 0, 0);
      doc.rect(x, rowY, width, rowHeight);
      doc.line(x + numberWidth, rowY, x + numberWidth, rowY + rowHeight);
      doc.line(x + numberWidth + firstWidth, rowY, x + numberWidth + firstWidth, rowY + rowHeight);
      doc.line(x + numberWidth + firstWidth + lastWidth, rowY, x + numberWidth + firstWidth + lastWidth, rowY + rowHeight);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.6);
      const textY = rowY + rowHeight * 0.72;
      doc.text(String(index + 1), x + numberWidth / 2, textY, { align: "center" });
      doc.text(fitText(doc, camper.first_name || "", firstWidth - 4), x + numberWidth + 2, textY);
      doc.text(fitText(doc, camper.last_name || "", lastWidth - 4), x + numberWidth + firstWidth + 2, textY);
      doc.text(fitText(doc, friendGroupLabel(camper), friendWidth - 4), x + numberWidth + firstWidth + lastWidth + friendWidth / 2, textY, { align: "center" });

      rowY += rowHeight;
    });
  }

  function drawGymSection(doc, gym, y, sectionHeight) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;

    const gymTeams = teams
      .filter(([teamName]) => normalizeGym(teamDetails[teamName] || {}) === gym)
      .sort(([teamA], [teamB]) => {
        const infoA = teamDetails[teamA] || {};
        const infoB = teamDetails[teamB] || {};
        const courtCompare = courtNumber(infoA) - courtNumber(infoB);
        if (courtCompare !== 0) return courtCompare;
        return teamA.localeCompare(teamB);
      });

    if (!gymTeams.length) return y;

    doc.setFillColor(140, 21, 21);
    doc.rect(margin, y, pageWidth - margin * 2, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text(gym.toUpperCase(), margin + 6, y + 11.5);
    doc.setTextColor(0, 0, 0);

    const tableTop = y + 22;
    const tableHeight = sectionHeight - 22;
    const gap = 10;
    const columns = Math.min(gymTeams.length, 4);
    const tableWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;

    gymTeams.slice(0, 4).forEach(([teamName, roster], index) => {
      const x = margin + index * (tableWidth + gap);
      drawTeamTable(doc, teamName, roster, teamDetails[teamName] || {}, x, tableTop, tableWidth, tableHeight);
    });

    return y + sectionHeight;
  }

  function drawGymCourtRosterPage(doc, pageGyms, pageTitle, footerReserve = 0) {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginBottom = 20;
    let y = 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("COURT ASSIGNMENTS", pageWidth / 2, y, { align: "center" });
    y += 16;
    doc.setFontSize(10.5);
    doc.text(pageTitle, pageWidth / 2, y, { align: "center" });
    y += 22;

    const gap = 26;
    const availableHeight = pageHeight - y - marginBottom - footerReserve - gap * (pageGyms.length - 1);

    const weights = pageGyms.map((gym) => {
      const gymTeams = teams.filter(([teamName]) => normalizeGym(teamDetails[teamName] || {}) === gym);
      const maxRows = Math.max(1, ...gymTeams.map(([, roster]) => roster.length));
      return maxRows + 7;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;

    pageGyms.forEach((gym, index) => {
      const sectionHeight = Math.max(230, (availableHeight * weights[index]) / totalWeight);
      y = drawGymSection(doc, gym, y, sectionHeight) + gap;
    });
  }

  function drawTeamRankFooter(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const footerHeight = 78;
    const y = pageHeight - footerHeight - 12;

    const campGroups = CAMP_OPTIONS.map((camp) => {
      const rankedTeams = teams
        .map(([teamName, roster]) => {
          const info = teamDetails[teamName] || {};
          return {
            teamName,
            roster,
            camp: rosterCampValue(roster, info),
            rank: teamRank(info),
          };
        })
        .filter((record) => record.camp === camp.value)
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return a.teamName.localeCompare(b.teamName);
        });

      return { ...camp, rankedTeams };
    }).filter((camp) => camp.rankedTeams.length > 0);

    if (!campGroups.length) return;

    doc.setDrawColor(140, 21, 21);
    doc.setLineWidth(0.8);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, pageWidth - margin * 2, footerHeight, 4, 4, "FD");

    doc.setFillColor(140, 21, 21);
    doc.rect(margin, y, pageWidth - margin * 2, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("TEAM RANK SNAPSHOT", margin + 6, y + 11.5);
    doc.setTextColor(0, 0, 0);

    const columns = Math.min(2, campGroups.length);
    const columnGap = 14;
    const columnWidth = (pageWidth - margin * 2 - columnGap * (columns - 1)) / columns;

    campGroups.slice(0, 2).forEach((camp, campIndex) => {
      const x = margin + campIndex * (columnWidth + columnGap);
      const top = y + 24;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.4);
      doc.text(fitText(doc, camp.label, columnWidth - 8), x + 4, top);

      const entries = camp.rankedTeams.map((record, index) => {
        const rankLabel = record.rank < 9999 ? record.rank : index + 1;
        return `${rankLabel}. ${record.teamName} (${record.roster.length})`;
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      const entriesPerRow = 3;
      const cellWidth = (columnWidth - 8) / entriesPerRow;

      entries.forEach((entry, index) => {
        const row = Math.floor(index / entriesPerRow);
        const col = index % entriesPerRow;
        doc.text(
          fitText(doc, entry, cellWidth - 4),
          x + 4 + col * cellWidth,
          top + 12 + row * 9
        );
      });
    });
  }

  function downloadMasterAttendancePDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    const title = sessionLabel(selectedSessionRow);

    drawGymCourtRosterPage(doc, ["Maples", "APG"], title);
    doc.addPage();
    drawGymCourtRosterPage(doc, ["Rec", "Ford"], title, 92);
    drawTeamRankFooter(doc);

    doc.save("master-attendance-by-gym.pdf");
  }

  return (
    <>
      <section className="panel report-controls">
        <h2>Reports</h2>

        <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
          <option value="">Select Session</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {sessionLabel(s)}
            </option>
          ))}
        </select>

        <select value={campFilter} onChange={(e) => setCampFilter(e.target.value)}>
          <option value="">All Camps</option>
          {CAMP_OPTIONS.map((camp) => (
            <option key={camp.value} value={camp.value}>
              {camp.label}
            </option>
          ))}
        </select>

        <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="">All Teams</option>
          {visibleTeams.map(([team]) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>

        <button className="primary-button" onClick={downloadAttendancePDF}>
          Attendance PDF
        </button>

        <button className="primary-button" onClick={downloadMissingPDF}>
          Missing PDF
        </button>

        <button className="primary-button" onClick={downloadMasterAttendancePDF}>
          Master Attendance PDF
        </button>
      </section>

      <section className="stats report-stats">
        <div><span>Total</span><strong>{attendanceCampers.length}</strong></div>
        <div><span>Present</span><strong>{presentCount}</strong></div>
        <div><span>Absent</span><strong>{absentCount}</strong></div>
        <div><span>Late</span><strong>{lateCount}</strong></div>
        <div><span>Checked Out</span><strong>{checkedOutCount}</strong></div>
        <div><span>Not Marked</span><strong>{notMarkedCount}</strong></div>
      </section>

      <section className="panel">
        <h2>Missing / Not Marked</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Camp</th>
              <th>Team</th>
              <th>Court</th>
              <th>Coach</th>
              <th>Position</th>
            </tr>
          </thead>

          <tbody>
            {attendanceCampers
              .filter((c) => !attendance[c.id])
              .map((c) => {
                const info = teamDetails[c.main_team] || {};

                return (
                  <tr key={c.id}>
                    <td>{c.first_name} {c.last_name}</td>
                    <td>{info.camp_id || "-"}</td>
                    <td>{c.main_team || "-"}</td>
                    <td>{info.court || "-"}</td>
                    <td>{info.coach_1 || "-"}</td>
                    <td>{c.primary_position || "-"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Full Attendance Report</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Camp</th>
              <th>Team</th>
              <th>Court</th>
              <th>Coach</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>

          <tbody>
            {attendanceCampers.map((c) => {
              const info = teamDetails[c.main_team] || {};

              return (
                <tr key={c.id}>
                  <td>{c.first_name} {c.last_name}</td>
                  <td>{info.camp_id || "-"}</td>
                  <td>{c.main_team || "-"}</td>
                  <td>{info.court || "-"}</td>
                  <td>{info.coach_1 || "-"}</td>
                  <td>{attendance[c.id]?.status || "Not Marked"}</td>
                  <td>{attendance[c.id]?.notes || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
