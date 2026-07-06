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

function campName(value) {
  return CAMP_OPTIONS.find((c) => c.value === value)?.label || value || "All Camps";
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
    doc.text(`Camp: ${campName(campFilter)}`, 40, 84);
    doc.text(`Team: ${teamFilter || "All Teams"}`, 40, 100);
    doc.text(`Total: ${attendanceCampers.length}`, 40, 118);
    doc.text(`Present: ${presentCount}`, 120, 118);
    doc.text(`Absent: ${absentCount}`, 210, 118);
    doc.text(`Late: ${lateCount}`, 300, 118);
    doc.text(`Checked Out: ${checkedOutCount}`, 370, 118);
    doc.text(`Not Marked: ${notMarkedCount}`, 470, 118);

    autoTable(doc, {
      startY: 140,
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
    doc.text(`Camp: ${campName(campFilter)}`, 40, 84);
    doc.text(`Team: ${teamFilter || "All Teams"}`, 40, 100);
    doc.text(`Missing: ${missing.length}`, 40, 118);

    autoTable(doc, {
      startY: 140,
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

  return (
    <>
      <section className="panel report-controls">
        <h2>Reports</h2>

        <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
          <option value="">Select Session</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.session_date ? `— ${s.session_date}` : ""}
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
          Download Attendance PDF
        </button>

        <button className="primary-button" onClick={downloadMissingPDF}>
          Download Missing PDF
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
