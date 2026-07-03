import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TeamDetails({ team, roster, attendance, onBack }) {
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
    doc.text(`Campers: ${roster.length}`, 40, 88);
    doc.text(`Present: ${present}`, 140, 88);
    doc.text(`Absent: ${absent}`, 230, 88);
    doc.text(`Late: ${late}`, 320, 88);
    doc.text(`Not Marked: ${notMarked}`, 390, 88);

    autoTable(doc, {
      startY: 110,
      head: [["Name", "Position", "Gym", "Friend Group", "Attendance", "Notes"]],
      body: roster.map((c) => [
        `${c.first_name || ""} ${c.last_name || ""}`,
        c.primary_position || "",
        c.gym || "",
        c.friend_group || "",
        attendance[c.id]?.status || "Not Marked",
        attendance[c.id]?.notes || "",
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [140, 21, 21],
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 115 },
        1: { cellWidth: 60 },
        2: { cellWidth: 60 },
        3: { cellWidth: 75 },
        4: { cellWidth: 75 },
        5: { cellWidth: 130 },
      },
      margin: { left: 40, right: 40 },
    });

const pdfBlob = doc.output("blob");
const pdfUrl = URL.createObjectURL(pdfBlob);

const link = document.createElement("a");
link.href = pdfUrl;
link.download = `${team}-roster.pdf`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(pdfUrl);  }
  return (
    <>
      <section className="panel">
        <button className="primary-button" onClick={onBack}>
          ← Back to Teams
        </button>

        <button className="primary-button" onClick={downloadRosterPDF}>
DOWNLOAD PDF TEST
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
