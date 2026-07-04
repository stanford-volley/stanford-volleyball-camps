import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TeamDetails({
  team,
  roster,
  attendance,
  teams,
  teamInfo,
  onBack,
  editCamper,
  moveCamperTeam,
  saveTeamInfo,
}) {
  const [info, setInfo] = useState({
    coach: teamInfo?.coach || "",
    assistant_coach: teamInfo?.assistant_coach || "",
    gym: teamInfo?.gym || "",
    court: teamInfo?.court || "",
    notes: teamInfo?.notes || "",
  });

  const present = roster.filter((c) => attendance[c.id]?.status === "Present").length;
  const absent = roster.filter((c) => attendance[c.id]?.status === "Absent").length;
  const late = roster.filter((c) => attendance[c.id]?.status === "Late").length;
  const notMarked = roster.filter((c) => !attendance[c.id]).length;

  function downloadRosterPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });

    doc.setFontSize(18);
    doc.text("Stanford Volleyball Camps", 40, 40);

    doc.setFontSize(14);
    doc.text(`Team: ${team}`, 40, 65);

    doc.setFontSize(10);
    doc.text(`Coach: ${info.coach || "—"}`, 40, 88);
    doc.text(`Assistant: ${info.assistant_coach || "—"}`, 200, 88);
    doc.text(`Gym: ${info.gym || "—"}`, 390, 88);
    doc.text(`Court: ${info.court || "—"}`, 480, 88);

    doc.text(`Campers: ${roster.length}`, 40, 108);
    doc.text(`Present: ${present}`, 140, 108);
    doc.text(`Absent: ${absent}`, 230, 108);
    doc.text(`Late: ${late}`, 320, 108);
    doc.text(`Not Marked: ${notMarked}`, 390, 108);

    autoTable(doc, {
      startY: 130,
      head: [["Name", "Position", "Gym", "Friend Group", "Attendance", "Notes"]],
      body: roster.map((c) => [
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.primary_position || "",
        c.gym || "",
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
      <section className="panel">
        <button className="primary-button" onClick={onBack}>
          ← Back to Teams
        </button>

        <button className="primary-button" onClick={downloadRosterPDF}>
          Download Team Roster PDF
        </button>

        <h1>{team}</h1>

        <section className="stats">
          <div><span>Campers</span><strong>{roster.length}</strong></div>
          <div><span>Present</span><strong>{present}</strong></div>
          <div><span>Absent</span><strong>{absent}</strong></div>
          <div><span>Late</span><strong>{late}</strong></div>
          <div><span>Not Marked</span><strong>{notMarked}</strong></div>
        </section>
      </section>

      <section className="panel team-edit-panel">
        <h2>Team Assignments</h2>

        <label>Coach</label>
        <input
          value={info.coach}
          onChange={(e) => setInfo({ ...info, coach: e.target.value })}
        />

        <label>Assistant Coach</label>
        <input
          value={info.assistant_coach}
          onChange={(e) => setInfo({ ...info, assistant_coach: e.target.value })}
        />

        <label>Gym</label>
        <input
          value={info.gym}
          onChange={(e) => setInfo({ ...info, gym: e.target.value })}
        />

        <label>Court</label>
        <input
          value={info.court}
          onChange={(e) => setInfo({ ...info, court: e.target.value })}
        />

        <label>Team Notes</label>
        <textarea
          rows="3"
          value={info.notes}
          onChange={(e) => setInfo({ ...info, notes: e.target.value })}
        />

        <button
          className="primary-button"
          onClick={() => saveTeamInfo(team, info)}
        >
          Save Team Assignments
        </button>
      </section>

      <section className="panel">
        <h2>Team Roster</h2>

        <table className="campers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Gym</th>
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
                <td>{c.gym || "-"}</td>
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
