import Coaches from "./pages/Coaches";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Teams from "./pages/Teams";
import Campers from "./pages/Campers";
import Dashboard from "./pages/Dashboard";
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import "./App.css";

const tabs = ["Dashboard", "Campers", "Teams", "Coaches", "Attendance", "Reports"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedTeamFromDashboard, setSelectedTeamFromDashboard] =
    useState(null);
  const [campers, setCampers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [campFilter, setCampFilter] = useState("");
  const [teamDetails, setTeamDetails] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCamper, setSelectedCamper] = useState(null);

  useEffect(() => {
    loadCampers();
    loadSessions();
    loadTeamDetails();
  }, []);

  useEffect(() => {
    function openTeam(e) {
      setSelectedTeamFromDashboard(e.detail);
      setActiveTab("Teams");
    }

    window.addEventListener("openTeam", openTeam);

    return () => {
      window.removeEventListener("openTeam", openTeam);
    };
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
async function deleteSession(sessionId) {
  if (!sessionId) {
    alert("Select a session first.");
    return;
  }

  if (!window.confirm("Delete this attendance session?")) return;

  await supabase.from("attendance").delete().eq("session_id", sessionId);

  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return alert(error.message);

  setSelectedSession("");
  setAttendance({});
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

  async function checkInEntireTeam(teamName) {
    if (!selectedSession) {
      alert("Create or select a session first.");
      return;
    }

    const roster = campers.filter((c) => c.main_team === teamName);

    const updates = roster.map((c) => ({
      camper_id: c.id,
      session_id: selectedSession,
      status: "Present",
      notes: attendance[c.id]?.notes || "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("attendance").upsert(updates, {
      onConflict: "camper_id,session_id",
    });

    if (error) return alert(error.message);

    await loadAttendance(selectedSession);
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
async function checkOutEntireTeam(teamName) {
  if (!selectedSession) {
    alert("Create or select a session first.");
    return;
  }

  const roster = campers.filter((c) => c.main_team === teamName);

  const updates = roster.map((c) => ({
    camper_id: c.id,
    session_id: selectedSession,
    status: "Checked Out",
    notes: attendance[c.id]?.notes || "",
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("attendance")
    .upsert(updates, {
      onConflict: "camper_id,session_id",
      ignoreDuplicates: false,
    });

  if (error) {
    alert(error.message);
    return;
  }

  setAttendance((prev) => {
    const next = { ...prev };

    roster.forEach((c) => {
      next[c.id] = {
        status: "Checked Out",
        notes: prev[c.id]?.notes || "",
      };
    });

    return next;
  });
}
  async function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);

    const camperSheet = workbook.Sheets["Assign to Teams"];
    const teamSheet = workbook.Sheets["Coach + Court Assignment"];

    if (!camperSheet) return alert("Could not find tab named Assign to Teams.");
    if (!teamSheet)
      return alert("Could not find tab named Coach + Court Assignment.");

    const camperRows = XLSX.utils.sheet_to_json(camperSheet, { defval: "" });

    const cleanedCampers = camperRows
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
        jersey_number: String(r["Jersey #"] || "").trim(),
        court_position: String(r["Court Position"] || "").trim(),
      }));

    const teamRows = XLSX.utils.sheet_to_json(teamSheet, { defval: "" });

    const cleanedTeams = teamRows
      .filter((r) => {
        const teamName = String(r["Team Name"] || "").trim();
        return teamName && teamName.toLowerCase() !== "team name";
      })
      .map((r) => {
        const court = String(r["Court"] || "").trim();

        return {
          name: String(r["Team Name"] || "").trim(),
          camp_id: String(r["Camp #"] || r["Camp ID"] || "").trim(),
          coach_1: String(r["Coach 1"] || "").trim(),
          coach_2: String(r["Coach 2"] || "").trim(),
          coach_3: String(r["Coach 3"] || "").trim(),
          coach: String(r["Coach 1"] || "").trim(),
          assistant_coach: String(r["Coach 2"] || "").trim(),
          court,
          gym: String(r["Gym"] || r["Lead Coach of Gyms"] || "").trim(),
          lead_coach_of_gym: String(r["Lead Coach of Gyms"] || "").trim(),
          assignment_date: String(r["Date"] || "").trim(),
          session_name: String(
            r["Session"] || r["Date and Session"] || ""
          ).trim(),
          rank: Number(r["Rank"] || 0),
        };
      });

    await supabase
      .from("attendance")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("attendance_sessions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("campers")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("teams")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const { error: camperError } = await supabase
      .from("campers")
      .insert(cleanedCampers);

    if (camperError) return alert(camperError.message);

    const { error: teamError } = await supabase
      .from("teams")
      .insert(cleanedTeams);

    if (teamError) return alert(teamError.message);

    const sessionMap = {};

    cleanedTeams.forEach((team) => {
      const key = `${team.assignment_date || "No Date"}-${
        team.session_name || "No Session"
      }`;

      if (!sessionMap[key]) {
        sessionMap[key] = {
          name: team.session_name || "Camp Session",
          session_date: team.assignment_date || null,
          session_time: team.session_name || null,
          source_key: key,
        };
      }
    });

    const cleanedSessions = Object.values(sessionMap);

    if (cleanedSessions.length > 0) {
      const { error: sessionError } = await supabase
        .from("attendance_sessions")
        .upsert(cleanedSessions, { onConflict: "source_key" });

      if (sessionError) return alert(sessionError.message);
    }

    alert(
      `Imported ${cleanedCampers.length} campers and ${cleanedTeams.length} teams.`
    );

    await loadCampers();
    await loadTeamDetails();
    await loadSessions();

    setAttendance({});
    setSelectedSession("");
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

    return Object.entries(grouped).sort(([a], [b]) =>
      a.localeCompare(b)
    );
  }, [campers]);

  const attendanceCampers = useMemo(() => {
  return campers.filter((c) => {
    const teamInfo = teamDetails[c.main_team] || {};

    const matchesCamp =
      !campFilter || teamInfo.camp_id === campFilter;

    const matchesTeam =
      !teamFilter || c.main_team === teamFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "Not Marked" && !attendance[c.id]) ||
      attendance[c.id]?.status === statusFilter;

    return matchesCamp && matchesTeam && matchesStatus;
  });
}, [campers, teamDetails, campFilter, teamFilter, statusFilter, attendance]);

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
            teamDetails={teamDetails}
            attendance={attendance}
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
            selectedTeamFromDashboard={selectedTeamFromDashboard}
            saveTeamInfo={saveTeamInfo}
            checkInEntireTeam={checkInEntireTeam}
            checkOutEntireTeam={checkOutEntireTeam}
          />
        )}
        
{activeTab === "Coaches" && (
  <Coaches
    teams={teams}
    teamDetails={teamDetails}
    attendance={attendance}
  />
)}
        {activeTab === "Attendance" && (
          <Attendance
            sessions={sessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            deleteSession={deleteSession}
            createSession={createSession}
            teams={teams}
            teamDetails={teamDetails}
            campFilter={campFilter}
            setCampFilter={setCampFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            presentCount={presentCount}
            absentCount={absentCount}
            lateCount={lateCount}
            attendanceCampers={attendanceCampers}
            attendance={attendance}
            markAttendance={markAttendance}
            updateAttendanceNotes={updateAttendanceNotes}
          />
        )}

        {activeTab === "Reports" && (
          <Reports
            sessions={sessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            teams={teams}
            teamDetails={teamDetails}
            campFilter={campFilter}
            setCampFilter={setCampFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            attendanceCampers={attendanceCampers}
            attendance={attendance}
            presentCount={presentCount}
            absentCount={absentCount}
            lateCount={lateCount}
          />
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
