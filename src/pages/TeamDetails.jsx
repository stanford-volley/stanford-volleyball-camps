import { useMemo, useState } from "react";
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
  markAttendance,
  updateAttendanceNotes,
}) {
  const [teamSearch, setTeamSearch] = useState("");
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

  const filteredRoster = useMemo(() => {
    const q = teamSearch.toLowerCase();

    return roster.filter((c) => {
      const text = `
        ${c.first_name || ""}
        ${c.last_name || ""}
        ${c.primary_position || ""}
        ${c.friend_group || ""}
        ${attendance[c.id]?.status || "Not Marked"}
        ${attendance[c.id]?.notes || ""}
      `.toLowerCase();

      return text.includes(q);
    });
  }, [roster, teamSearch, attendance]);

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

    doc.save(`${team}-roster.pdf`);
  }

  function downloadTeamPacketPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);

    doc.setFontSize(15);
    doc.text(`Team Packet: ${team}`, 40, 66);

    doc.setFontSize(10);
    doc.text(CAMP_NAMES[info.camp_id] || "Unassigned Camp", 40, 88);
    doc.text(`Court: ${info.court || "—"}`, 40, 106);
    doc.text(`Lead Coach: ${info.lead_coach_of_gym || "—"}`, 180, 106);
    doc.text(`Coaches: ${coaches.length ? coaches.join(", ") : "—"}`, 40, 126);

    doc.text(`Present: ${present}`, 40, 148);
    doc.text(`Absent: ${absent}`, 130, 148);
    doc.text(`Late: ${late}`, 220, 148);
    doc.text(`Out: ${checkedOut}`, 290, 148);
    doc.text(`Missing: ${missing}`, 360, 148);
    doc.text(`Total: ${roster.length}`, 455, 148);

    autoTable(doc, {
      startY: 170,
      head: [["Name", "Pos", "Status", "Notes"]],
      body: roster.map((c) => [
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.primary_position || "",
        attendance[c.id]?.status || "Not Marked",
        attendance[c.id]?.notes || "",
      ]),
      styles: { fontSize: 9, cellPadding: 5, minCellHeight: 18, overflow: "linebreak" },
      headStyles: { fillColor: [140, 21, 21], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 170 },
        1: { cellWidth: 55 },
        2: { cellWidth: 85 },
        3: { cellWidth: 220 },
      },
      margin: { left: 40, right: 40 },
    });

    const y = doc.lastAutoTable.finalY + 25;
    if (y < 720) {
      doc.setFontSize(12);
      doc.text("Team Notes", 40, y);
      doc.rect(40, y + 10, 532, 70);
    }

    doc.save(`${team}-team-packet.pdf`);
  }

  return (
    <>
      <section className="panel team-detail-header">
        <div className="team-detail-actions">
          <button className="primary-button" onClick={onBack}>
            ← Back to Teams
          </button>

          <button className="primary-button" onClick={downloadRosterPDF}>
            Download Roster PDF
          </button>

          <button className="primary-button" onClick={downloadTeamPacketPDF}>
            Download Team Packet PDF
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
        </div>

        <h1>{team}</h1>

        <div className="team-detail-meta">
          <div><strong>{CAMP_NAMES[info.camp_id] || "Unassigned Camp"}</strong></div>
          <div><strong>Court:</strong> {info.court || "—"}</div>
          <div><strong>Lead Coach:</strong> {info.lead_coach_of_gym || "—"}</div>
        </div>

        <section className="stats team-detail-stats">
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
        <div className="team-roster-heading">
          <h2>Team Roster</h2>
          <input
            className="search team-roster-search"
            placeholder="Search this team..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
          />
        </div>

        <div className="team-attendance-list">
          {filteredRoster.map((c) => {
            const status = attendance[c.id]?.status || "Not Marked";

            return (
              <div className="team-attendance-row" key={c.id}>
                <div className="team-attendance-person">
                  <strong>{c.first_name} {c.last_name}</strong>
                  <span>{c.primary_position || "—"} | Friend Group: {c.friend_group || "—"}</span>
                </div>

                <div className="team-attendance-buttons">
                  <button
                    className={status === "Present" ? "present active" : "present"}
                    onClick={() => markAttendance(c.id, "Present")}
                  >
                    Present
                  </button>
                  <button
                    className={status === "Absent" ? "absent active" : "absent"}
                    onClick={() => markAttendance(c.id, "Absent")}
                  >
                    Absent
                  </button>
                  <button
                    className={status === "Late" ? "late active" : "late"}
                    onClick={() => markAttendance(c.id, "Late")}
                  >
                    Late
                  </button>
                  <button
                    className={status === "Checked Out" ? "checkout active" : "checkout"}
                    onClick={() => markAttendance(c.id, "Checked Out")}
                  >
                    Out
                  </button>
                </div>

                <textarea
                  className="team-attendance-notes"
                  placeholder="Notes..."
                  value={attendance[c.id]?.notes || ""}
                  onChange={(e) => updateAttendanceNotes(c.id, e.target.value)}
                />

                <div className="team-attendance-actions">
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

                  <button className="small-button" onClick={() => editCamper(c)}>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
