import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function splitCoachNames(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

export default function TeamDetails({
  team,
  roster,
  attendance,
  teams,
  teamInfo,
  onBack,
  editCamper,
  moveCamperTeam,
  checkInEntireTeam,
}) {
  const info = teamInfo || {};

  const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
  const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
  const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
  const notMarked = roster.length - present - absent - late;

  const coaches = [
    ...splitCoachNames(info.coach_1 || info.coach),
    ...splitCoachNames(info.coach_2 || info.assistant_coach),
    ...splitCoachNames(info.coach_3),
  ];

  function downloadRosterPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);

    doc.setFontSize(14);
    doc.text(`${team}`, 40, 65);

    doc.setFontSize(10);
    doc.text(CAMP_NAMES[info.camp_id] || "Unassigned Camp", 40, 88);
    doc.text(`Date: ${info.assignment_date || "—"}`, 40, 106);
    doc.text(`Court: ${info.court || "—"}`, 200, 106);
    doc.text(`Lead Coach: ${info.lead_coach_of_gym || "—"}`, 320, 106);

    doc.text(`Coaches: ${coaches.length ? coaches.join(", ") : "—"}`, 40, 126);

    doc.text(`Campers: ${roster.length}`, 40, 148);
    doc.text(`Present: ${present}`, 140, 148);
    doc.text(`Absent: ${absent}`, 230, 148);
    doc.text(`Late: ${late}`, 320, 148);
    doc.text(`Missing: ${notMarked}`, 390, 148);

    autoTable(doc, {
      startY: 168,
      head: [["Name", "Position", "Friend Group", "Attendance", "Notes"]],
      body: roster.map((c) => [
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.primary_position || "",
        c.friend_group || "",
        attendance[c.id]?.status || "Not Marked",
        attendance[c.id]?.notes || "",
      ]),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [140, 21, 21], textColor: 255 },
      margin: { left: 40, right: 40 },
    });

    doc.save(`${team}-roster.pdf`);
  }

  return (
    <>
      <section className="panel team-detail-header">
        <button className="primary-button" onClick={onBack}>
          ← Back to Teams
        </button>

        <button className="primary-button" onClick={downloadRosterPDF}>
          Download Team Roster PDF
        </button>

        <button
          className="primary-button"
          onClick={async () => {
            if (window.confirm(`Check in all ${roster.length} campers on ${team}?`)) {
              await checkInEntireTeam(team);
            }
          }}
        >
          ✓ Check In Entire Team
        </button>

        <h1>{team}</h1>

        <section className="stats">
          <div><span>Campers</span><strong>{roster.length}</strong></div>
          <div><span>Present</span><strong>{present}</strong></div>
          <div><span>Absent</span><strong>{absent}</strong></div>
          <div><span>Late</span><strong>{late}</strong></div>
          <div><span>Missing</span><strong>{notMarked}</strong></div>
        </section>
      </section>

      <section className="panel team-edit-panel">
        <h2>Coach + Court Assignment</h2>

        <div className="assignment-grid">
          <p><strong>Camp:</strong> {CAMP_NAMES[info.camp_id] || "—"}</p>
          <p><strong>Date:</strong> {info.assignment_date || "—"}</p>
          <p><strong>Court:</strong> {info.court || "—"}</p>
          <p><strong>Lead Coach:</strong> {info.lead_coach_of_gym || "—"}</p>

          <div>
            <strong>Coaches:</strong>
            {coaches.length ? (
              coaches.map((coach) => <div key={coach}>{coach}</div>)
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Team Roster</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Friend Group</th>
              <th>Attendance</th>
              <th>Notes</th>
              <th>Move Team</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {roster.map((c) => (
              <tr key={c.id}>
                <td>{c.first_name} {c.last_name}</td>
                <td>{c.primary_position || "-"}</td>
                <td>{c.friend_group || "-"}</td>
                <td>{attendance[c.id]?.status || "Not Marked"}</td>
                <td>{attendance[c.id]?.notes || ""}</td>
                <td>
                  <select
                    value={c.main_team || ""}
                    onChange={(e) => moveCamperTeam(c, e.target.value)}
                  >
                    {teams.map(([teamName]) => (
                      <option key={teamName} value={teamName}>
                        {teamName}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="small-button" onClick={() => editCamper(c)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
