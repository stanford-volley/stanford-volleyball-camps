import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [campers, setCampers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCampers();
  }, []);

  async function loadCampers() {
    const { data, error } = await supabase
      .from("campers")
      .select("*")
      .order("last_name", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setCampers(data || []);
  }

  async function importExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets["Assign to Teams"];

    if (!sheet) {
      alert("Could not find tab named Assign to Teams.");
      return;
    }

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
        camper_rank: Number(r["CAMPER RANK"] || 0)
      }));

    const { error } = await supabase.from("campers").insert(cleaned);

    if (error) {
      alert(error.message);
      return;
    }

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

  return (
    <div className="app">
      <header className="hero">
        <h1>Stanford Volleyball Camps</h1>
        <p>Camper management, team lookup, and attendance system</p>
      </header>

      <section className="stats">
        <div>
          <span>Total Campers</span>
          <strong>{campers.length}</strong>
        </div>
        <div>
          <span>Showing</span>
          <strong>{filteredCampers.length}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>Import Camp Spreadsheet</h2>
        <p>Upload your Excel file. This reads the <strong>Assign to Teams</strong> tab.</p>
        <input type="file" accept=".xlsx,.xls" onChange={importExcel} />
      </section>

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
    </div>
  );
}
