import Teams from "./pages/Teams";
import Campers from "./pages/Campers";
import Dashboard from "./pages/Dashboard";
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import "./App.css";

const tabs = ["Dashboard", "Campers", "Teams", "Attendance", "Reports"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [campers, setCampers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [teamDetails, setTeamDetails] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCamper, setSelectedCamper] = useState(null);

  useEffect(() => {
    loadCampers();
    loadSessions();
    loadTeamDetails();
  }, []);

  useEffect(() => {
    if (selectedSession) loadAttendance(selectedSession);
  }, [selectedSession]);

  async function loadTeamDetails() {
    const { data, error } = await supabase.from("teams").select("*");

    if (error) return alert(error.message);

    const map = {};
    data.forEach((team) => {
      map[team.name] = team;
    });

    setTeamDetails(map);
  }

  async function loadCampers() {
    const { data, error } = await supabase
      .from("campers")
      .select("*")
      .order("last_name", { ascending: true });

    if (error) return alert(error.message);

    setCampers(data || []);
  }

  async function loadSessions() {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return alert(error.message);

    setSessions(data || []);

    if (data?.length && !selectedSession) {
      setSelectedSession(data[0].id);
    }
  }

  async function loadAttendance(sessionId) {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", sessionId);

    if (error) return alert(error.message);

    const map = {};

    data.forEach((row) => {
      map[row.camper_id] = {
        status: row.status,
        notes: row.notes || "",
      };
    });

    setAttendance(map);
  }

  async function createSession() {
    const name = prompt("Session name? Example: Day 1 AM");
    if (!name) return;

    const sessionDate = prompt("Date? Example: 2025-07-10");
    const sessionTime = prompt("Time? Example: Morning / Afternoon / Evening");

    const { error } = await supabase.from("attendance_sessions").insert({
      name,
      session_date: sessionDate || null,
      session_time: sessionTime || null,
    });

    if (error) return alert(error.message);

    await loadSessions();
  }

  async function markAttendance(camperId, status) {
    if (!selectedSession) {
      alert("Create or select a session first.");
      return;
    }

    const existingNotes = attendance[camperId]?.notes || "";

    const { error } = await supabase.from("attendance").upsert(
      {
        camper_id: camperId,
        session_id: selectedSession,
        status,
        notes: existingNotes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "camper_id,session_id" }
    );

    if (error) return alert(error.message);

    setAttendance((prev) => ({
      ...prev,
      [camperId]: {
        status,
        notes: existingNotes,
      },
    }));
  }

  async function updateAttendanceNotes(camperId, notes) {
    if (!selectedSession) return alert("Create or select a session first.");

    const status = attendance[camperId]?.status || "Present";

    const { error } = await supabase.from("attendance").upsert(
      {
        camper_id: camperId,
        session_id: selectedSession,
        status,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "camper_id,session_id" }
    );

    if (error) return alert(error.message);

    setAttendance((prev) => ({
      ...prev,
      [camperId]: {
        status,
        notes,
      },
    }));
  }

  async function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets["Assign to Teams"];

    if (!sheet) return alert("Could not find tab named Assign to Teams.");

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const cleaned = rows
      .filter((r) => {
        const first = String(r["First Name"] || "").trim();
        const last = String(r["Last Name"] || "").trim();

        return (
          first &&
          last &&
          first.toLowerCase() !== "first name" &&
          last.toLowerCase() !== "last name"
        );
      })
      .map((r) => ({
        main_team: String(r["Main Team"] || "").trim(),
        add_setters_team: String(r["Add Setters Team"] || "").trim(),
        first_name: String(r["First Name"] || "").trim(),
        last_name: String(r["Last Name"] || "").trim(),
        primary_position: String(r["Primary Position"] || "").trim(),
        secondary_position: String(r["Secondary Position"] || "").trim(),
        age: String(r["Age"] || "").trim(),
        grade: String(r["Grade in Fall"] || "").trim(),
        club_team: String(r["Club Team"] || "").trim(),
        camp: String(r["Camp"] || "").trim(),
        friend_request: String(r["Friend Request"] || "").trim(),
        friend_group: String(r["Friend Group"] || "").trim(),
        tshirt: String(r["T-Shirt"] || "").trim(),
        meal_add_on: String(r["Meal Add On"] || "").trim(),
        pickup: String(r["Pickup?"] || "").trim(),
        camper_rank: Number(r["CAMPER RANK"] || 0),
      }));

    const { error } = await supabase.from("campers").insert(cleaned);

    if (error) return alert(error.message);

    alert(`Imported ${cleaned.length} campers.`);
    loadCampers();
  }

  const filteredCampers = useMemo(() => {
    const q = search.toLowerCase();

    return campers.filter((c) => {
      const text = `
        ${c.first_name || ""}
        ${c.last_name || ""}
        ${c.main_team || ""}
        ${c.primary_position || ""}
        ${c.secondary_position || ""}
        ${c.age || ""}
        ${c.grade || ""}
        ${c.club_team || ""}
        ${c.friend_group || ""}
        ${c.camp || ""}
      `.toLowerCase();

      return text.includes(q);
    });
  }, [campers, search]);

  const teams = useMemo(() => {
    const grouped = {};

    campers.forEach((c) => {
      const team = c.main_team || "Unassigned";
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(c);
    });

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [campers]);

  const attendanceCampers = useMemo(() => {
    return campers.filter((c) => {
      const matchesTeam = !teamFilter || c.main_team === teamFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "Not Marked" && !attendance[c.id]) ||
        attendance[c.id]?.status === statusFilter;

      return matchesTeam && matchesStatus;
    });
  }, [campers, teamFilter, statusFilter, attendance]);

  const reportCampers = attendanceCampers;

  const presentCount = reportCampers.filter(
    (c) => attendance[c.id]?.status === "Present"
  ).length;

  const absentCount = reportCampers.filter(
    (c) => attendance[c.id]?.status === "Absent"
  ).length;

  const lateCount = reportCampers.filter(
    (c) => attendance[c.id]?.status === "Late"
  ).length;

  function editCamper(camper) {
    setSelectedCamper(camper);
  }

  async function saveCamper() {
    const { error } = await supabase
      .from("campers")
      .update({
        main_team: selectedCamper.main_team,
        primary_position: selectedCamper.primary_position,
        friend_group: selectedCamper.friend_group,
        gym: selectedCamper.gym || "",
        notes: selectedCamper.notes || "",
      })
      .eq("id", selectedCamper.id);

    if (error) return alert(error.message);

    setCampers((prev) =>
      prev.map((c) =>
        c.id === selectedCamper.id
          ? {
              ...c,
              ...selectedCamper,
            }
          : c
      )
    );

    setSelectedCamper(null);
  }

  async function moveCamperTeam(camper, newTeam) {
    const { error } = await supabase
      .from("campers")
      .update({ main_team: newTeam })
      .eq("id", camper.id);

    if (error) return alert(error.message);

    setCampers((prev) =>
      prev.map((c) =>
        c.id === camper.id ? { ...c, main_team: newTeam } : c
      )
    );
  }

  async function saveTeamInfo(teamName, info) {
    const { error } = await supabase.from("teams").upsert(
      {
        name: teamName,
        coach: info.coach || "",
        assistant_coach: info.assistant_coach || "",
        gym: info.gym || "",
        court: info.court || "",
        notes: info.notes || "",
      },
      { onConflict: "name" }
    );

    if (error) return alert(error.message);

    setTeamDetails((prev) => ({
      ...prev,
      [teamName]: {
        ...(prev[teamName] || {}),
        name: teamName,
        ...info,
      },
    }));

    alert("Team assignments saved.");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Stanford Camps</h2>

        {tabs.map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "nav-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </aside>

      <main className="main">
        <header className="hero">
          <h1>Stanford Volleyball Camps</h1>
          <p>Camper management, team lookup, and attendance system</p>
        </header>

        {activeTab === "Dashboard" && (
          <Dashboard
            campers={campers}
            teams={teams}
            sessions={sessions}
            presentCount={presentCount}
            absentCount={absentCount}
            lateCount={lateCount}
            importExcel={importExcel}
          />
        )}

        {activeTab === "Campers" && (
          <Campers
            search={search}
            setSearch={setSearch}
            filteredCampers={filteredCampers}
            attendance={attendance}
            editCamper={editCamper}
          />
        )}

        {activeTab === "Teams" && (
          <Teams
            teams={teams}
            attendance={attendance}
            teamDetails={teamDetails}
            editCamper={editCamper}
            moveCamperTeam={moveCamperTeam}
            saveTeamInfo={saveTeamInfo}
          />
        )}

        {activeTab === "Attendance" && (
          <>
            <section className="panel attendance-controls">
              <h2>Attendance</h2>

              <button className="primary-button" onClick={createSession}>
                + Create Session
              </button>

              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="">Select Session</option>

                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.session_date ? `— ${s.session_date}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="">All Teams</option>

                {teams.map(([team]) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Not Marked">Not Marked</option>
              </select>
            </section>

            <section className="stats">
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

            <section className="attendance-list">
              {attendanceCampers.map((c) => (
                <div className="attendance-row" key={c.id}>
                  <div>
                    <h3>
                      {c.first_name} {c.last_name}
                    </h3>

                    <p>
                      Team: {c.main_team || "—"} | Gym: {c.gym || "—"} |
                      Position: {c.primary_position || "—"}
                    </p>
                  </div>

                  <div className="attendance-buttons">
                    <button
                      className={
                        attendance[c.id]?.status === "Present"
                          ? "present active"
                          : "present"
                      }
                      onClick={() => markAttendance(c.id, "Present")}
                    >
                      Present
                    </button>

                    <button
                      className={
                        attendance[c.id]?.status === "Absent"
                          ? "absent active"
                          : "absent"
                      }
                      onClick={() => markAttendance(c.id, "Absent")}
                    >
                      Absent
                    </button>

                    <button
                      className={
                        attendance[c.id]?.status === "Late"
                          ? "late active"
                          : "late"
                      }
                      onClick={() => markAttendance(c.id, "Late")}
                    >
                      Late
                    </button>
                  </div>

                  <textarea
                    className="attendance-notes"
                    placeholder="Notes:"
                    value={attendance[c.id]?.notes || ""}
                    onChange={(e) =>
                      updateAttendanceNotes(c.id, e.target.value)
                    }
                  />
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === "Reports" && (
          <>
            <section className="panel attendance-controls">
              <h2>Reports</h2>

              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="">Select Session</option>

                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.session_date ? `— ${s.session_date}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
              >
                <option value="">All Teams</option>

                {teams.map(([team]) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>

              <button className="primary-button" onClick={() => window.print()}>
                Print Report
              </button>
            </section>

            <section className="stats">
              <div>
                <span>Total in View</span>
                <strong>{attendanceCampers.length}</strong>
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

              <div>
                <span>Not Marked</span>
                <strong>
                  {attendanceCampers.filter((c) => !attendance[c.id]).length}
                </strong>
              </div>
            </section>

            <section className="panel">
              <h2>Missing / Not Marked</h2>

              <div className="report-list">
                {attendanceCampers
                  .filter((c) => !attendance[c.id])
                  .map((c) => (
                    <div className="report-row" key={c.id}>
                      <strong>
                        {c.first_name} {c.last_name}
                      </strong>
                      <span>{c.main_team || "—"}</span>
                      <span>{c.primary_position || "—"}</span>
                      <span>Grade {c.grade || "—"}</span>
                    </div>
                  ))}
              </div>
            </section>

            <section className="panel">
              <h2>Absent Campers</h2>

              <div className="report-list">
                {attendanceCampers
                  .filter((c) => attendance[c.id]?.status === "Absent")
                  .map((c) => (
                    <div className="report-row" key={c.id}>
                      <strong>
                        {c.first_name} {c.last_name}
                      </strong>
                      <span>{c.main_team || "—"}</span>
                      <span>{c.primary_position || "—"}</span>
                      <span>Grade {c.grade || "—"}</span>
                    </div>
                  ))}
              </div>
            </section>

            <section className="panel">
              <h2>Full Attendance Report</h2>

              <div className="report-list">
                {attendanceCampers.map((c) => (
                  <div className="report-row" key={c.id}>
                    <strong>
                      {c.first_name} {c.last_name}
                    </strong>
                    <span>{c.main_team || "—"}</span>
                    <span>{c.primary_position || "—"}</span>
                    <span>{attendance[c.id]?.status || "Not Marked"}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {selectedCamper && (
          <div className="drawer-overlay">
            <div className="drawer">
              <button
                className="close-button"
                onClick={() => setSelectedCamper(null)}
              >
                ✕
              </button>

              <h2>
                {selectedCamper.first_name} {selectedCamper.last_name}
              </h2>

              <div className="drawer-section">
                <label>Team</label>

                <select
                  value={selectedCamper.main_team || ""}
                  onChange={(e) =>
                    setSelectedCamper({
                      ...selectedCamper,
                      main_team: e.target.value,
                    })
                  }
                >
                  {teams.map(([team]) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>

                <label>Gym</label>

                <input
                  value={selectedCamper.gym || ""}
                  onChange={(e) =>
                    setSelectedCamper({
                      ...selectedCamper,
                      gym: e.target.value,
                    })
                  }
                />

                <label>Primary Position</label>

                <input
                  value={selectedCamper.primary_position || ""}
                  onChange={(e) =>
                    setSelectedCamper({
                      ...selectedCamper,
                      primary_position: e.target.value,
                    })
                  }
                />

                <label>Friend Group</label>

                <input
                  value={selectedCamper.friend_group || ""}
                  onChange={(e) =>
                    setSelectedCamper({
                      ...selectedCamper,
                      friend_group: e.target.value,
                    })
                  }
                />

                <label>Notes</label>

                <textarea
                  rows="5"
                  value={selectedCamper.notes || ""}
                  onChange={(e) =>
                    setSelectedCamper({
                      ...selectedCamper,
                      notes: e.target.value,
                    })
                  }
                />

                <button className="primary-button" onClick={saveCamper}>
                  Save Camper
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
