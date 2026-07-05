export default function CamperProfile({
  camper,
  teamInfo,
  attendance,
  sessions,
  onClose,
}) {
  if (!camper) return null;

  return (
    <div className="camper-modal-backdrop">
      <div className="camper-modal">

        <button className="close-button" onClick={onClose}>
          ✕
        </button>

        <h1>
          {camper.first_name} {camper.last_name}
        </h1>

        <div className="camper-section">
          <strong>Camp</strong>
          <div>{teamInfo?.camp_id || "—"}</div>
        </div>

        <div className="camper-section">
          <strong>Team</strong>
          <div>{camper.main_team || "—"}</div>
        </div>

        <div className="camper-section">
          <strong>Court</strong>
          <div>{teamInfo?.court || "—"}</div>
        </div>

        <div className="camper-section">
          <strong>Position</strong>
          <div>{camper.primary_position || "—"}</div>
        </div>

        <div className="camper-section">
          <strong>Coaches</strong>

          <div>{teamInfo?.coach_1 || "—"}</div>

          {teamInfo?.coach_2 && <div>{teamInfo.coach_2}</div>}

          {teamInfo?.coach_3 && <div>{teamInfo.coach_3}</div>}
        </div>

        <div className="camper-section">
          <strong>Attendance</strong>

          {sessions.map((session) => (
            <div key={session.id}>
              • {session.name}
            </div>
          ))}

          <div style={{marginTop:10}}>
            Current Status:
            <strong>
              {" "}
              {attendance?.status || "Not Marked"}
            </strong>
          </div>
        </div>

      </div>
    </div>
  );
}
