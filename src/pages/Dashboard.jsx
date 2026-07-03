export default function Dashboard({
  campers,
  teams,
  sessions,
  presentCount,
  absentCount,
  lateCount,
  importExcel,
}) {
  return (
    <>
      <section className="stats">
        <div>
          <span>Total Campers</span>
          <strong>{campers.length}</strong>
        </div>

        <div>
          <span>Teams</span>
          <strong>{teams.length}</strong>
        </div>

        <div>
          <span>Sessions</span>
          <strong>{sessions.length}</strong>
        </div>

        <div>
          <span>Present</span>
          <strong>{presentCount}</strong>
        </div>

        <div>
          <span>Absent</span>
          <strong>{absentCount}</strong>
        </div>

        <div>
          <span>Late</span>
          <strong>{lateCount}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Import Camp Spreadsheet</h2>

        <p>
          Upload your Excel file. The app imports the
          <strong> Assign to Teams </strong>
          worksheet.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={importExcel}
        />
      </section>
    </>
  );
}
