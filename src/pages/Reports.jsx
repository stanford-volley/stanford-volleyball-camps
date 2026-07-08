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

  function drawGymCourtRosterPage(doc, pageGyms, pageTitle) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 28;

    doc.setFontSize(16);
    doc.text("COURT ASSIGNMENTS", pageWidth / 2, y, { align: "center" });
    y += 16;
    doc.setFontSize(10);
    doc.text(pageTitle, pageWidth / 2, y, { align: "center" });
    y += 18;

    pageGyms.forEach((gym) => {
      const gymTeams = teams
        .filter(([teamName]) => normalizeGym(teamDetails[teamName] || {}) === gym)
        .sort(([teamA], [teamB]) => {
          const infoA = teamDetails[teamA] || {};
          const infoB = teamDetails[teamB] || {};
          const courtCompare = courtNumber(infoA) - courtNumber(infoB);
          if (courtCompare !== 0) return courtCompare;
          return teamA.localeCompare(teamB);
        });

      if (!gymTeams.length) return;

      doc.setFillColor(140, 21, 21);
      doc.rect(margin, y, pageWidth - margin * 2, 16, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(gym.toUpperCase(), margin + 6, y + 11);
      doc.setTextColor(0, 0, 0);
      y += 20;

      const columns = Math.min(gymTeams.length, 4);
      const gap = 8;
      const tableWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
      let maxY = y;

      gymTeams.forEach(([teamName, roster], index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = margin + col * (tableWidth + gap);
        const tableY = row === 0 ? y : maxY + 10;
        const info = teamDetails[teamName] || {};
        const coaches = getCoaches(info);
        const title = `CT ${courtNumber(info) === 999 ? "" : courtNumber(info)}\n${coaches.join("\n")}\n${teamName}\n${roster.length} Campers`;

        autoTable(doc, {
          startY: tableY,
          tableWidth,
          margin: { left: x, right: pageWidth - x - tableWidth },
          head: [[{ content: title, colSpan: 4, styles: { halign: "center", fontStyle: "bold" } }]],
          body: roster.sort(sortByLastName).map((c, rowIndex) => [
            rowIndex + 1,
            c.first_name || "",
            c.last_name || "",
            friendGroupLabel(c),
          ]),
          styles: {
            fontSize: 7.6,
            cellPadding: 1.8,
            lineColor: [0, 0, 0],
            lineWidth: 0.4,
            overflow: "ellipsize",
          },
          headStyles: {
            fillColor: [245, 245, 245],
            textColor: 0,
            lineColor: [0, 0, 0],
            lineWidth: 0.6,
          },
          columnStyles: {
            0: { cellWidth: 18, halign: "center" },
            1: { cellWidth: tableWidth * 0.31 },
            2: { cellWidth: tableWidth * 0.39 },
            3: { cellWidth: 22, halign: "center" },
          },
        });

        maxY = Math.max(maxY, doc.lastAutoTable.finalY);
      });

      y = maxY + 24;
    });
  }

  function downloadMasterAttendancePDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
    const title = sessionLabel(selectedSessionRow);

    drawGymCourtRosterPage(doc, ["Maples", "APG"], title);
    doc.addPage();
    drawGymCourtRosterPage(doc, ["Rec", "Ford"], title);

    const finalY = doc.lastAutoTable?.finalY || 720;
    const summaryY = Math.min(finalY + 24, 720);
    doc.setFontSize(10);
    doc.text(
      `Summary: ${attendanceCampers.length} Total • ${presentCount} Present • ${absentCount} Absent • ${lateCount} Late • ${checkedOutCount} Out • ${notMarkedCount} Not Marked`,
      40,
      summaryY
    );

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
