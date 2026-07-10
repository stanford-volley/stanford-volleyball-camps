import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import CheckIn from "./pages/CheckIn";
import Teams from "./pages/Teams";
import Campers from "./pages/Campers";
import Dashboard from "./pages/Dashboard";
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import "./App.css";

const tabs = ["Dashboard", "Check-In", "Campers", "Teams", "Attendance", "Reports"];

const BLOCK_SESSION_TEMPLATES = {
  "Block 1": [
    { day: 1, period: "AM", date: "2026-07-08" },
    { day: 1, period: "PM", date: "2026-07-08" },
    { day: 2, period: "AM", date: "2026-07-09" },
    { day: 2, period: "PM", date: "2026-07-09" },
  ],
  "Block 2": [
    { day: 1, period: "AM", date: "2026-07-10" },
    { day: 1, period: "PM", date: "2026-07-10" },
    { day: 2, period: "AM", date: "2026-07-11" },
    { day: 2, period: "PM", date: "2026-07-11" },
    { day: 3, period: "AM", date: "2026-07-12" },
    { day: 3, period: "PM", date: "2026-07-12" },
  ],
  "Block 3": [
    { day: 1, period: "AM", date: "2026-07-13" },
    { day: 1, period: "PM", date: "2026-07-13" },
    { day: 2, period: "AM", date: "2026-07-14" },
    { day: 2, period: "PM", date: "2026-07-14" },
    { day: 3, period: "AM", date: "2026-07-15" },
    { day: 3, period: "PM", date: "2026-07-15" },
    { day: 4, period: "AM", date: "2026-07-16" },
    { day: 4, period: "PM", date: "2026-07-16" },
  ],
  "Block 4": [
    { day: 1, period: "PM", date: "2026-07-17" },
    { day: 1, period: "EVE", date: "2026-07-17" },
    { day: 2, period: "AM", date: "2026-07-18" },
    { day: 2, period: "PM", date: "2026-07-18" },
    { day: 2, period: "EVE", date: "2026-07-18" },
    { day: 3, period: "AM", date: "2026-07-19" },
    { day: 3, period: "PM", date: "2026-07-19" },
    { day: 3, period: "EVE", date: "2026-07-19" },
    { day: 4, period: "AM", date: "2026-07-20" },
  ],
};


const BLOCK_CAMP_MAP = {
  "Block 1": ["Camp 1", "Camp 2"],
  "Block 2": ["Camp 3", "Camp 4"],
  "Block 3": ["Camp 5", "Camp 6"],
  "Block 4": ["Camp 7", "Camp 8"],
};

function normalizeCampValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/camp\s*([1-8])/i);
  return match ? `Camp ${match[1]}` : text;
}

function camperCampValue(camper, teamDetails) {
  const info = teamDetails[camper.main_team] || {};

  // IMPORTANT: some block workbooks reuse the local labels "Camp 1" / "Camp 2"
  // inside Coach + Court Assignment even when the camper registration value is
  // actually CAMP 3 / CAMP 4, CAMP 5 / CAMP 6, etc.
  // The camper.camp field is the most reliable full camp name from the workbook,
  // so use it first. Fall back to team info only when camper.camp is blank.
  return normalizeCampValue(camper.camp || info.camp_id || "");
}

function teamCampValue(teamName, campers, teamDetails) {
  const teamRoster = campers.filter((camper) => camper.main_team === teamName);
  const rosterCamp = teamRoster.map((camper) => normalizeCampValue(camper.camp)).find(Boolean);
  const info = teamDetails[teamName] || {};

  return rosterCamp || normalizeCampValue(info.camp_id || "");
}

function normalizeSourceValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeCamperSourceKey(camper) {
  return [
    normalizeSourceValue(camper.first_name),
    normalizeSourceValue(camper.last_name),
    normalizeSourceValue(camper.camp || camper.main_team),
  ]
    .filter(Boolean)
    .join("__");
}

function quotePostgrestValue(value) {
  return `"${String(value).replaceAll('"', '\"')}"`;
}

function formatSessionDate(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = String(dateValue).split("-");
  if (!year || !month || !day) return String(dateValue);
  return `${Number(month)}/${Number(day)}/${year}`;
}

function sessionDisplayName(session) {
  const dateLabel = formatSessionDate(session?.session_date);
  return dateLabel ? `${dateLabel} - ${session.name}` : session?.name || "Camp Session";
}


function getSessionBlockName(session) {
  const match = String(session?.name || "").match(/Block\s*\d+/i);
  return match ? match[0].replace(/block/i, "Block") : "";
}

function getSessionPeriodRank(session) {
  const time = String(session?.session_time || session?.name || "").toUpperCase();
  if (time.includes("AM")) return 1;
  if (time.includes("PM")) return 2;
  if (time.includes("EVE")) return 3;
  return 99;
}

function getSessionDayNumber(session) {
  const match = String(session?.name || "").match(/Day\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}


export default function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedTeamFromDashboard, setSelectedTeamFromDashboard] = useState(null);
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

  const activeAttendanceSessionId = getAttendanceSessionId(selectedSession);

  useEffect(() => {
    if (selectedSession) loadAttendance(selectedSession);
  }, [selectedSession, sessions]);

  useEffect(() => {
    const channel = supabase
      .channel("attendance-sessions-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_sessions",
        },
        async () => {
          const refreshedSessions = await loadSessions();

          if (
            selectedSession &&
            refreshedSessions.length &&
            !refreshedSessions.some((session) => session.id === selectedSession)
          ) {
            setSelectedSession(refreshedSessions[0].id);
          }

          if (!refreshedSessions.length) {
            setSelectedSession("");
            setAttendance({});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeAttendanceSessionId]);

  useEffect(() => {
    if (!activeAttendanceSessionId) return;

    const channel = supabase
      .channel(`attendance-live-${activeAttendanceSessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
          filter: `session_id=eq.${activeAttendanceSessionId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedCamperId = payload.old?.camper_id;
            if (!deletedCamperId) return;

            setAttendance((prev) => {
              const next = { ...prev };
              delete next[deletedCamperId];
              return next;
            });

            return;
          }

          const row = payload.new;
          if (!row?.camper_id) return;

          setAttendance((prev) => ({
            ...prev,
            [row.camper_id]: {
              status: row.status,
              notes: row.notes || "",
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeAttendanceSessionId]);


  function getAttendanceSessionId(sessionId = selectedSession) {
    if (!sessionId) return "";

    const currentSession = sessions.find((session) => session.id === sessionId);
    if (!currentSession) return sessionId;

    const currentBlock = getSessionBlockName(currentSession);
    const currentDay = getSessionDayNumber(currentSession);

    // Daily attendance behavior:
    // AM / PM / EVE sessions on the same Block + Day share one attendance record.
    // Example: Block 1 - Day 1 AM and Block 1 - Day 1 PM both use the first
    // Block 1 - Day 1 session as their attendance key. Block 1 - Day 2 starts fresh.
    if (!currentBlock || !currentDay) {
      return sessionId;
    }

    const daySessions = sessions
      .filter((session) => {
        return (
          getSessionBlockName(session) === currentBlock &&
          getSessionDayNumber(session) === currentDay
        );
      })
      .sort((a, b) => {
        const rankCompare = getSessionPeriodRank(a) - getSessionPeriodRank(b);
        if (rankCompare !== 0) return rankCompare;
        const dateCompare = String(a.session_date || "").localeCompare(String(b.session_date || ""));
        if (dateCompare !== 0) return dateCompare;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });

    return daySessions[0]?.id || sessionId;
  }

  async function loadTeamDetails() {
    const { data, error } = await supabase.from("teams").select("*");

    if (error) return alert(error.message);

    const map = {};

    (data || []).forEach((team) => {
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

  async function loadSessions(options = {}) {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .order("session_date", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true });

    if (error) return alert(error.message);

    const sessionRows = data || [];
    setSessions(sessionRows);

    if (options.forceSelectFirst) {
      setSelectedSession(sessionRows[0]?.id || "");
      return sessionRows;
    }

    if (sessionRows.length && !selectedSession) {
      setSelectedSession(sessionRows[0].id);
    }

    return sessionRows;
  }

  async function seedAttendanceFromPreviousSameDay(sessionId) {
    const currentSession = sessions.find((session) => session.id === sessionId);

    if (!currentSession?.session_date) return [];

    const currentBlock = getSessionBlockName(currentSession);
    const currentDay = getSessionDayNumber(currentSession);
    const currentRank = getSessionPeriodRank(currentSession);

    const possiblePreviousSessions = sessions
      .filter((session) => {
        if (session.id === sessionId) return false;
        if (session.session_date !== currentSession.session_date) return false;
        if (currentBlock && getSessionBlockName(session) !== currentBlock) return false;
        if (currentDay && getSessionDayNumber(session) !== currentDay) return false;
        return getSessionPeriodRank(session) < currentRank;
      })
      .sort((a, b) => getSessionPeriodRank(b) - getSessionPeriodRank(a));

    const previousSession = possiblePreviousSessions[0];
    if (!previousSession?.id) return [];

    const { data: previousAttendance, error: previousError } = await supabase
      .from("attendance")
      .select("camper_id, status, notes")
      .eq("session_id", previousSession.id);

    if (previousError) {
      alert(previousError.message);
      return [];
    }

    if (!previousAttendance?.length) return [];

    const rowsToCopy = previousAttendance.map((row) => ({
      camper_id: row.camper_id,
      session_id: sessionId,
      status: row.status,
      notes: row.notes || "",
      updated_at: new Date().toISOString(),
    }));

    const { data: copiedRows, error: copyError } = await supabase
      .from("attendance")
      .upsert(rowsToCopy, { onConflict: "camper_id,session_id" })
      .select("*");

    if (copyError) {
      alert(copyError.message);
      return [];
    }

    return copiedRows || [];
  }

  async function loadAttendance(sessionId) {
    const attendanceSessionId = getAttendanceSessionId(sessionId);

    if (!attendanceSessionId) {
      setAttendance({});
      return;
    }

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("session_id", attendanceSessionId);

    if (error) return alert(error.message);

    const map = {};

    (data || []).forEach((row) => {
      map[row.camper_id] = {
        status: row.status,
        notes: row.notes || "",
      };
    });

    setAttendance(map);
  }

  async function createSession() {
    const name = prompt("Session name? Example: Block 1 - Day 1 AM");
    if (!name) return;

    const sessionDate = prompt("Date? Example: 2026-07-04. Leave blank if unknown.");
    const sessionTime = prompt("Time? Example: AM / PM / EVE. Leave blank if already in name.");
    const sourceKey = `manual-${normalizeSourceValue(name)}-${normalizeSourceValue(sessionDate)}`;

    const { data, error } = await supabase
      .from("attendance_sessions")
      .upsert(
        {
          name,
          session_date: sessionDate || null,
          session_time: sessionTime || null,
          source_key: sourceKey,
        },
        { onConflict: "source_key" }
      )
      .select("*")
      .single();

    if (error) return alert(error.message);

    await loadSessions();

    if (data?.id) {
      setSelectedSession(data.id);
      await loadAttendance(data.id);
    }
  }

  async function createBlockSessions(blockName) {
    const template = BLOCK_SESSION_TEMPLATES[blockName];

    if (!template) {
      alert("Choose a valid block first.");
      return;
    }

    if (!window.confirm(`Create ${template.length} sessions for ${blockName}? Existing sessions will stay saved.`)) {
      return;
    }

    const rows = template.map((session) => ({
      name: `${blockName} - Day ${session.day} ${session.period}`,
      session_date: session.date,
      session_time: session.period,
      source_key: `${normalizeSourceValue(blockName)}-day-${session.day}-${normalizeSourceValue(session.period)}`,
    }));

    const { data, error } = await supabase
      .from("attendance_sessions")
      .upsert(rows, { onConflict: "source_key" })
      .select("*");

    if (error) return alert(error.message);

    await loadSessions();

    if (data?.[0]?.id) {
      setSelectedSession(data[0].id);
      await loadAttendance(data[0].id);
    }
  }

  async function deleteSession(sessionId) {
    if (!sessionId) {
      alert("Select a session first.");
      return;
    }

    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionName = sessionToDelete?.name || "this attendance session";

    if (
      !window.confirm(
        `Delete ${sessionName}? This removes only that session and its attendance records. Other sessions stay saved.`
      )
    ) {
      return;
    }

    const { error: attendanceDeleteError } = await supabase
      .from("attendance")
      .delete()
      .eq("session_id", sessionId);

    if (attendanceDeleteError) return alert(attendanceDeleteError.message);

    const { error: sessionDeleteError } = await supabase
      .from("attendance_sessions")
      .delete()
      .eq("id", sessionId);

    if (sessionDeleteError) return alert(sessionDeleteError.message);

    setAttendance({});

    const remainingSessions = await loadSessions({ forceSelectFirst: true });
    const nextSessionId = remainingSessions?.[0]?.id || "";

    if (nextSessionId) {
      await loadAttendance(nextSessionId);
    }
  }

  async function markAttendance(camperId, status) {
    const attendanceSessionId = getAttendanceSessionId(selectedSession);

    if (!attendanceSessionId) {
      alert("Create or select a session first.");
      return;
    }

    const existingNotes = attendance[camperId]?.notes || "";

    const { error } = await supabase.from("attendance").upsert(
      {
        camper_id: camperId,
        session_id: attendanceSessionId,
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

  async function clearAttendance(camperId) {
    const attendanceSessionId = getAttendanceSessionId(selectedSession);

    if (!attendanceSessionId) {
      alert("Create or select a session first.");
      return;
    }

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("camper_id", camperId)
      .eq("session_id", attendanceSessionId);

    if (error) return alert(error.message);

    setAttendance((prev) => {
      const next = { ...prev };
      delete next[camperId];
      return next;
    });
  }

  async function checkInEntireTeam(teamName) {
    const attendanceSessionId = getAttendanceSessionId(selectedSession);

    if (!attendanceSessionId) {
      alert("Create or select a session first.");
      return;
    }

    const roster = campers.filter((c) => c.main_team === teamName);

    const updates = roster.map((c) => ({
      camper_id: c.id,
      session_id: attendanceSessionId,
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

  async function checkOutEntireTeam(teamName) {
    const attendanceSessionId = getAttendanceSessionId(selectedSession);

    if (!attendanceSessionId) {
      alert("Create or select a session first.");
      return;
    }

    const roster = campers.filter((c) => c.main_team === teamName);

    const updates = roster.map((c) => ({
      camper_id: c.id,
      session_id: attendanceSessionId,
      status: "Checked Out",
      notes: attendance[c.id]?.notes || "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("attendance").upsert(updates, {
      onConflict: "camper_id,session_id",
      ignoreDuplicates: false,
    });

    if (error) return alert(error.message);

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

  async function updateAttendanceNotes(camperId, notes) {
    const attendanceSessionId = getAttendanceSessionId(selectedSession);

    if (!attendanceSessionId) return alert("Create or select a session first.");

    const status = attendance[camperId]?.status || "Present";

    const { error } = await supabase.from("attendance").upsert(
      {
        camper_id: camperId,
        session_id: attendanceSessionId,
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

    const camperSheet = workbook.Sheets["Assign to Teams"];
    const teamSheet = workbook.Sheets["Coach + Court Assignment"];

    if (!camperSheet) return alert("Could not find tab named Assign to Teams.");
    if (!teamSheet) return alert("Could not find tab named Coach + Court Assignment.");

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
      }))
      .map((camper) => ({
        ...camper,
        source_key: makeCamperSourceKey(camper),
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
          session_name: String(r["Session"] || r["Date and Session"] || "").trim(),
          rank: Number(r["Rank"] || 0),
        };
      });

    const incomingCamperKeys = cleanedCampers
      .map((camper) => camper.source_key)
      .filter(Boolean);

    const incomingTeamNames = cleanedTeams
      .map((team) => team.name)
      .filter(Boolean);

    const { data: existingCampers, error: existingCamperError } = await supabase
      .from("campers")
      .select("id, first_name, last_name, camp, main_team, source_key");

    if (existingCamperError) return alert(existingCamperError.message);

    const campersNeedingSourceKeys = (existingCampers || [])
      .map((camper) => ({
        id: camper.id,
        source_key: camper.source_key || makeCamperSourceKey(camper),
      }))
      .filter((camper) => camper.source_key);

    for (const camper of campersNeedingSourceKeys) {
      const { error } = await supabase
        .from("campers")
        .update({ source_key: camper.source_key })
        .eq("id", camper.id)
        .is("source_key", null);

      if (error) return alert(error.message);
    }

    const { error: camperError } = await supabase
      .from("campers")
      .upsert(cleanedCampers, { onConflict: "source_key" });

    if (camperError) return alert(camperError.message);

    const { data: refreshedCampers, error: refreshedCamperError } = await supabase
      .from("campers")
      .select("id, source_key");

    if (refreshedCamperError) return alert(refreshedCamperError.message);

    const camperIdsToRemove = (refreshedCampers || [])
      .filter((camper) => camper.source_key && !incomingCamperKeys.includes(camper.source_key))
      .map((camper) => camper.id);

    if (camperIdsToRemove.length > 0) {
      await supabase.from("attendance").delete().in("camper_id", camperIdsToRemove);

      const { error: removeCamperError } = await supabase
        .from("campers")
        .delete()
        .in("id", camperIdsToRemove);

      if (removeCamperError) return alert(removeCamperError.message);
    }

    const { error: teamError } = await supabase
      .from("teams")
      .upsert(cleanedTeams, { onConflict: "name" });

    if (teamError) return alert(teamError.message);

    const { data: existingTeams, error: existingTeamError } = await supabase
      .from("teams")
      .select("id, name");

    if (existingTeamError) return alert(existingTeamError.message);

    const teamIdsToRemove = (existingTeams || [])
      .filter((team) => team.name && !incomingTeamNames.includes(team.name))
      .map((team) => team.id);

    if (teamIdsToRemove.length > 0) {
      const { error: removeTeamError } = await supabase
        .from("teams")
        .delete()
        .in("id", teamIdsToRemove);

      if (removeTeamError) return alert(removeTeamError.message);
    }

    const sessionMap = {};

    cleanedTeams.forEach((team) => {
      const key = `${team.assignment_date || "No Date"}-${team.session_name || "No Session"}`;

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

    alert(`Imported ${cleanedCampers.length} campers and ${cleanedTeams.length} teams.`);

    await loadCampers();
    await loadTeamDetails();
    await loadSessions();

    if (selectedSession) {
      await loadAttendance(selectedSession);
    }
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
    const selectedSessionObject = sessions.find((session) => session.id === selectedSession) || null;
    const selectedBlock = getSessionBlockName(selectedSessionObject);
    const blockCampValues = BLOCK_CAMP_MAP[selectedBlock] || [];
    const normalizedCampFilter = normalizeCampValue(campFilter);

    return campers.filter((c) => {
      const campValue = camperCampValue(c, teamDetails);

      const matchesCamp = normalizedCampFilter
        ? campValue === normalizedCampFilter
        : blockCampValues.length
        ? blockCampValues.includes(campValue)
        : true;

      const matchesTeam = !teamFilter || c.main_team === teamFilter;
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "Not Marked" && !attendance[c.id]) ||
        attendance[c.id]?.status === statusFilter;

      return matchesCamp && matchesTeam && matchesStatus;
    });
  }, [campers, teamDetails, campFilter, teamFilter, statusFilter, attendance, sessions, selectedSession]);

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
      prev.map((c) => (c.id === camper.id ? { ...c, main_team: newTeam } : c))
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

        {activeTab === "Check-In" && (
          <CheckIn
            campers={campers}
            teamDetails={teamDetails}
            sessions={sessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            attendance={attendance}
            markAttendance={markAttendance}
            clearAttendance={clearAttendance}
            updateAttendanceNotes={updateAttendanceNotes}
          />
        )}

        {activeTab === "Campers" && (
          <Campers
            search={search}
            setSearch={setSearch}
            filteredCampers={filteredCampers}
            attendance={attendance}
            teamDetails={teamDetails}
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
            markAttendance={markAttendance}
            updateAttendanceNotes={updateAttendanceNotes}
          />
        )}

        {activeTab === "Attendance" && (
          <Attendance
            sessions={sessions}
            selectedSession={selectedSession}
            setSelectedSession={setSelectedSession}
            deleteSession={deleteSession}
            createSession={createSession}
            createBlockSessions={createBlockSessions}
            teams={teams}
            teamDetails={teamDetails}
            campFilter={campFilter}
            setCampFilter={setCampFilter}
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            attendanceCampers={attendanceCampers}
            attendance={attendance}
            markAttendance={markAttendance}
            clearAttendance={clearAttendance}
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

              <p>
                <strong>Current Status:</strong>{" "}
                {attendance[selectedCamper.id]?.status || "Not Marked"}
              </p>

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

                <div className="drawer-actions">
                  <button className="primary-button" onClick={saveCamper}>
                    Save Camper
                  </button>

                  <button
                    className="present"
                    onClick={() => markAttendance(selectedCamper.id, "Present")}
                  >
                    Present
                  </button>

                  <button
                    className="absent"
                    onClick={() => markAttendance(selectedCamper.id, "Absent")}
                  >
                    Absent
                  </button>

                  <button
                    className="late"
                    onClick={() => markAttendance(selectedCamper.id, "Late")}
                  >
                    Late
                  </button>

                  <button
                    className="checkout"
                    onClick={() => markAttendance(selectedCamper.id, "Checked Out")}
                  >
                    Out
                  </button>

                  <button
                    className="undo-attendance"
                    onClick={() => clearAttendance(selectedCamper.id)}
                  >
                    Undo / Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
