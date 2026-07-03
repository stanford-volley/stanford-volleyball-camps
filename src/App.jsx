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

  useEffect(() => {
    loadCampers();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) loadAttendance(selectedSession);
  }, [selectedSession]);

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
setAttendance(map);  }

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
      .filter((r) => r["First Name"] && r["Last Name"])
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
      return !teamFilter || c.main_team === teamFilter;
    });
  }, [campers, teamFilter]);

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

const notMarkedCount = reportCampers.filter(
  (c) => !attendance[c.id]
).length;
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
          <>
            <section className="stats">
              <div><span>Total Campers</span><strong>{campers.length}</strong></div>
              <div><span>Teams</span><strong>{teams.length}</strong></div>
              <div><span>Sessions</span><strong>{sessions.length}</strong></div>
              <div><span>Present</span><strong>{presentCount}</strong></div>
              <div><span>Absent</span><strong>{absentCount}</strong></div>
              <div><span>Late</span><strong>{lateCount}</strong></div>
            </section>

            <section className="panel">
              <h2>Import Camp Spreadsheet</h2>
              <p>
                Upload your Excel file. This reads the <strong>Assign to Teams</strong> tab.
              </p>
              <input type="file" accept=".xlsx,.xls" onChange={importExcel} />
            </section>
          </>
        )}

        {activeTab === "Campers" && (
          <>
            <section className="panel">
              <h2>Find Campers</h2>
              <input
                className="search"
                placeholder="Search by name, team, position, age, grade, club, friend group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </section>

            <section className="camper-grid">
              {filteredCampers.map((c) => (
                <div className="camper-card" key={c.id}>
                  <h3>{c.first_name} {c.last_name}</h3>
                  <p><strong>Team:</strong> {c.main_team || "—"}</p>
                  <p><strong>Position:</strong> {c.primary_position || "—"}</p>
                  <p><strong>Grade:</strong> {c.grade || "—"} | <strong>Age:</strong> {c.age || "—"}</p>
                  <p><strong>Club:</strong> {c.club_team || "—"}</p>
                  <p><strong>Friend Group:</strong> {c.friend_group || "—"}</p>
                  <p><strong>Camp:</strong> {c.camp || "—"}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {activeTab === "Teams" && (
          <section className="team-grid">
            {teams.map(([team, roster]) => (
              <div className="team-card" key={team}>
                <h3>{team}</h3>
                <p>{roster.length} campers</p>
                <ul>
                  {roster.map((c) => (
                    <li key={c.id}>
                      {c.first_name} {c.last_name} — {c.primary_position || "—"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
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

              <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
                <option value="">All Teams</option>
                {teams.map(([team]) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </section>

            <section className="stats">
              <div><span>Present</span><strong>{presentCount}</strong></div>
              <div><span>Absent</span><strong>{absentCount}</strong></div>
              <div><span>Late</span><strong>{lateCount}</strong></div>
            </section>

            <section className="attendance-list">
              {attendanceCampers.map((c) => (
                <div className="attendance-row" key={c.id}>
                  <div>
                    <h3>{c.first_name} {c.last_name}</h3>
                    <p>{c.main_team || "—"} | {c.primary_position || "—"} | Grade {c.grade || "—"}</p>
                  </div>

                  <div className="attendance-buttons">
                    <button
                      className={attendance[c.id]?.status === "Present" ? "present active" : "present"}
                      onClick={() => markAttendance(c.id, "Present")}
                    >
                      Present
                    </button>
                    <button
                      className={attendance[c.id]?.status === "Absent" ? "absent active" : "absent"}
                      onClick={() => markAttendance(c.id, "Absent")}
                    >
                      Absent
                    </button>
                    <button
                      className={attendance[c.id]?.status === "Late" ? "late active" : "late"}
                      onClick={() => markAttendance(c.id, "Late")}
                    >
                      Late
                    </button>
                  </div>
                  <textarea
  className="attendance-notes"
  placeholder="Notes: arriving late, leaving early, pickup info..."
  value={attendance[c.id]?.notes || ""}
  onChange={(e) => updateAttendanceNotes(c.id, e.target.value)}
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

      <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
        <option value="">All Teams</option>
        {teams.map(([team]) => (
          <option key={team} value={team}>{team}</option>
        ))}
      </select>

      <button className="primary-button" onClick={() => window.print()}>
        Print Report
      </button>
    </section>

    <section className="stats">
      <div><span>Total in View</span><strong>{attendanceCampers.length}</strong></div>
      <div><span>Present</span><strong>{presentCount}</strong></div>
      <div><span>Absent</span><strong>{absentCount}</strong></div>
      <div><span>Late</span><strong>{lateCount}</strong></div>
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
              <strong>{c.first_name} {c.last_name}</strong>
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
          .filter((c) => attendance[c.id] === "Absent")
          .map((c) => (
            <div className="report-row" key={c.id}>
              <strong>{c.first_name} {c.last_name}</strong>
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
            <strong>{c.first_name} {c.last_name}</strong>
            <span>{c.main_team || "—"}</span>
            <span>{c.primary_position || "—"}</span>
            <span>{attendance[c.id]?.status || "Not Marked"}</span>
          </div>
        ))}
      </div>
    </section>
  </>
)}
      </main>
    </div>
  );
}
