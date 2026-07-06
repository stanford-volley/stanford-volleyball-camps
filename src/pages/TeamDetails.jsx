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

function safeFileName(value) {
  return String(value || "team")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
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
  const checkedOut = roster.filter((c) => attendance[c.id]?.status === "Checked Out").length;
  const missing = roster.length - present - absent - late - checkedOut;

  const coaches = [
    ...splitCoachNames(info.coach_1 || info.coach),
    ...splitCoachNames(info.coach_2 || info.assistant_coach),
    ...splitCoachNames(info.coach_3),
  ];

  function addHeader(doc, title, subtitle) {
    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);

    doc.setFontSize(14);
    doc.text(title, 40, 65);

    if (subtitle) {
      doc.setFontSize(10);
      doc.text(subtitle, 40, 84);
    }
  }

  function downloadRosterPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    addHeader(doc, `${team} Roster`, CAMP_NAMES[info.camp_id] || "Unassigned Camp");

    doc.setFontSize(10);
    doc.text(`Date: ${info.assignment_date || "—"}`, 40, 106);
    doc.text(`Court: ${info.court || "—"}`, 200, 106);
    doc.text(`Lead Coach: ${info.lead_coach_of_gym || "—"}`, 320, 106);
    doc.text(`Coaches: ${coaches.length ? coaches.join(", ") : "—"}`, 40, 126);

    doc.text(`Campers: ${roster.length}`, 40, 148);
    doc.text(`Present: ${present}`, 140, 148);
    doc.text(`Absent: ${absent}`, 230, 148);
    doc.text(`Late: ${late}`, 320, 148);
    doc.text(`Out: ${checkedOut}`, 390, 148);
    doc.text(`Missing: ${missing}`, 450, 148);

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

    doc.save(`${safeFileName(team)}-roster.pdf`);
  }

  function downloadTeamPacketPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    addHeader(doc, `${team} Team Packet`, CAMP_NAMES[info.camp_id] || "Unassigned Camp");

    doc.setFontSize(11);
    doc.text(`Court: ${info.court || "—"}`, 40, 108);
    doc.text(`Date: ${info.assignment_date || "—"}`, 220, 108);
    doc.text(`Lead Coach: ${info.lead_coach_of_gym || "—"}`, 40, 128);

    doc.setFontSize(12);
    doc.text("Coaches", 40, 158);

    doc.setFontSize(10);
    if (coaches.length) {
      coaches.forEach((coach, index) => {
        doc.text(`${index + 1}. ${coach}`, 40, 178 + index * 16);
      });
    } else {
      doc.text("—", 40, 178);
    }

    const rosterStartY = coaches.length ? 190 + coaches.length * 16 : 205;

    autoTable(doc, {
      startY: rosterStartY,
      head: [["#", "Camper", "Position", "Present", "Late", "Absent", "Notes"]],
      body: roster.map((c, index) => [
        String(index + 1),
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.primary_position || "",
        "☐",
        "☐",
        "☐",
        "",
      ]),
      styles: { fontSize: 8, cellPadding: 4, minCellHeight: 18 },
      headStyles: { fillColor: [140, 21, 21], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 140 },
        2: { cellWidth: 70 },
        3: { cellWidth: 50, halign: "center" },
        4: { cellWidth: 45, halign: "center" },
        5: { cellWidth: 50, halign: "center" },
        6: { cellWidth: 145 },
      },
      margin: { left: 40, right: 40 },
    });

    let y = doc.lastAutoTable.finalY + 24;
    if (y > 650) {
      doc.addPage();
      y = 50;
    }

    doc.setFontSize(12);
    doc.text("Team Notes", 40, y);
    doc.setDrawColor(180);
    doc.rect(40, y + 12, 532, 90);

    doc.save(`${safeFileName(team)}-team-packet.pdf`);
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

        <button className="primary-button" onClick={downloadTeamPacketPDF}>
          Download Team Packet PDF
        </button>

       

        <h1>{team}</h1>

        <section className="stats">
          <div><span>Campers</span><strong>{roster.length}</strong></div>
          <div><span>Present</span><strong>{present}</strong></div>
          <div><span>Absent</span><strong>{absent}</strong></div>
          <div><span>Late</span><strong>{late}</strong></div>
          <div><span>Out</span><strong>{checkedOut}</strong></div>
          <div><span>Missing</span><strong>{missing}</strong></div>
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
