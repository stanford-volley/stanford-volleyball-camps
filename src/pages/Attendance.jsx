import { useMemo, useState } from "react";

const CAMP_OPTIONS = [
  { value: "Camp 1", label: "CAMP 1: Beginner Day Camp", lineCount: 2 },
  { value: "Camp 2", label: "CAMP 2: Dig/Pass/Serve Day Camp", lineCount: 4 },
  { value: "Camp 3", label: "CAMP 3: Setter Day Camp", lineCount: 2 },
  { value: "Camp 4", label: "CAMP 4: All Skills Day Camp", lineCount: 4 },
  { value: "Camp 5", label: "CAMP 5: Advanced Setter Day Camp", lineCount: 2 },
  { value: "Camp 6", label: "CAMP 6: Advanced Attacker Day Camp", lineCount: 4 },
  { value: "Camp 7", label: "CAMP 7: Advanced Setter Camp", lineCount: 2 },
  { value: "Camp 8", label: "CAMP 8: Individual Skills Camp", lineCount: 4 },
];

const BLOCK_CAMP_MAP = {
  "Block 1": ["Camp 1", "Camp 2"],
  "Block 2": ["Camp 3", "Camp 4"],
  "Block 3": ["Camp 5", "Camp 6"],
  "Block 4": ["Camp 7", "Camp 8"],
};

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

function getSelectedSessionObject(sessions, selectedSession) {
  return sessions.find((session) => session.id === selectedSession) || null;
}

function getBlockFromSession(session) {
  const name = String(session?.name || "");
  const match = name.match(/Block\s*[1-4]/i);
  if (!match) return "";
  return match[0].replace(/block/i, "Block").replace(/\s+/, " ");
}

function campLabel(campValue) {
  return CAMP_OPTIONS.find((camp) => camp.value === campValue)?.label || campValue;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getLastInitial(camper) {
  const last = String(camper.last_name || "").trim().toUpperCase();
  const firstLetter = last[0] || "";
  return LETTERS.includes(firstLetter) ? firstLetter : "Z";
}

function rangeLabel(startIndex, endIndex) {
  const start = LETTERS[startIndex];
  const end = LETTERS[endIndex];
  return start === end ? start : `${start}-${end}`;
}

function getRangeTotal(prefixCounts, startIndex, endIndex) {
  const before = startIndex === 0 ? 0 : prefixCounts[startIndex - 1];
  return prefixCounts[endIndex] - before;
}

function getCombinations(items, choose) {
  if (choose === 0) return [[]];
  if (items.length < choose) return [];

  const [first, ...rest] = items;
  const withFirst = getCombinations(rest, choose - 1).map((combo) => [
    first,
    ...combo,
  ]);
  const withoutFirst = getCombinations(rest, choose);

  return [...withFirst, ...withoutFirst];
}

function buildLineRanges(campersForCamp, lineCount) {
  if (!campersForCamp.length || !lineCount) return [];

  const counts = LETTERS.map(
    (letter) => campersForCamp.filter((c) => getLastInitial(c) === letter).length
  );

  const prefixCounts = [];
  counts.reduce((sum, count, index) => {
    prefixCounts[index] = sum + count;
    return prefixCounts[index];
  }, 0);

  const total = campersForCamp.length;
  const possibleCuts = Array.from({ length: 25 }, (_, index) => index);
  const combinations = getCombinations(possibleCuts, lineCount - 1);

  let bestRanges = null;
  let bestScore = Infinity;

  combinations.forEach((cuts) => {
    const endpoints = [...cuts, 25];
    let start = 0;
    const ranges = endpoints.map((end) => {
      const range = {
        start,
        end,
        count: getRangeTotal(prefixCounts, start, end),
      };
      start = end + 1;
      return range;
    });

    const target = total / lineCount;
    const variance = ranges.reduce(
      (score, range) => score + Math.pow(range.count - target, 2),
      0
    );

    const emptyPenalty = ranges.filter((range) => range.count === 0).length * 1000;
    const score = variance + emptyPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestRanges = ranges;
    }
  });

  return (bestRanges || []).map((range, index) => ({
    id: `${range.start}-${range.end}`,
    label: rangeLabel(range.start, range.end),
    startLetter: LETTERS[range.start],
    endLetter: LETTERS[range.end],
    count: range.count,
    lineNumber: index + 1,
  }));
}

function camperIsInRange(camper, range) {
  if (!range) return true;
  const initial = getLastInitial(camper);
  return initial >= range.startLetter && initial <= range.endLetter;
}

function camperCampValue(camper, teamDetails) {
  const info = teamDetails[camper.main_team] || {};
  return info.camp_id || "";
}

export default function Attendance({
  sessions,
  selectedSession,
  setSelectedSession,
  deleteSession,
  createSession,
  createBlockSessions,
  teams,
  teamDetails,
  campFilter,
  setCampFilter,
  teamFilter,
  setTeamFilter,
  statusFilter,
  setStatusFilter,
  attendanceCampers,
  attendance,
  markAttendance,
  clearAttendance,
  updateAttendanceNotes,
}) {
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [selectedLineKey, setSelectedLineKey] = useState("");

  const selectedSessionObject = getSelectedSessionObject(sessions, selectedSession);
  const selectedBlock = getBlockFromSession(selectedSessionObject);
  const blockCampValues = BLOCK_CAMP_MAP[selectedBlock] || [];

  const effectiveCampValues = campFilter
    ? [campFilter]
    : blockCampValues.length
    ? blockCampValues
    : [];

  const visibleTeams = teams.filter(([team]) => {
    const info = teamDetails[team] || {};
    if (campFilter) return info.camp_id === campFilter;
    if (blockCampValues.length) return blockCampValues.includes(info.camp_id);
    return true;
  });

  const lineCampValues = campFilter
    ? [campFilter]
    : blockCampValues.length
    ? blockCampValues
    : [];

  const lineGroups = useMemo(() => {
    return lineCampValues
      .map((campValue) => {
        const camp = CAMP_OPTIONS.find((option) => option.value === campValue);
        if (!camp) return null;

        const campersForCamp = attendanceCampers.filter((camper) => {
          return camperCampValue(camper, teamDetails) === campValue;
        });

        return {
          camp,
          ranges: buildLineRanges(campersForCamp, camp.lineCount),
          total: campersForCamp.length,
        };
      })
      .filter(Boolean);
  }, [lineCampValues, attendanceCampers, teamDetails]);

  const selectedLine = useMemo(() => {
    if (!selectedLineKey) return null;
    const [campValue, rangeId] = selectedLineKey.split("::");
    const group = lineGroups.find((item) => item.camp.value === campValue);
    const range = group?.ranges.find((item) => item.id === rangeId);
    return group && range ? { campValue, range } : null;
  }, [selectedLineKey, lineGroups]);

  const searchedCampers = useMemo(() => {
    const q = attendanceSearch.toLowerCase();

    return attendanceCampers.filter((c) => {
      const info = teamDetails[c.main_team] || {};
      const campValue = info.camp_id || "";

      const matchesBlockOrCamp = effectiveCampValues.length
        ? effectiveCampValues.includes(campValue)
        : true;

      const matchesLine = selectedLine
        ? campValue === selectedLine.campValue && camperIsInRange(c, selectedLine.range)
        : true;

      const text = `
        ${c.first_name || ""}
        ${c.last_name || ""}
        ${c.main_team || ""}
        ${c.primary_position || ""}
        ${info.camp_id || ""}
        ${info.court || ""}
        ${info.coach_1 || ""}
        ${info.coach_2 || ""}
        ${info.coach_3 || ""}
      `.toLowerCase();

      return matchesBlockOrCamp && matchesLine && text.includes(q);
    });
  }, [attendanceCampers, attendanceSearch, teamDetails, effectiveCampValues, selectedLine]);

  const total = searchedCampers.length;
  const presentCount = searchedCampers.filter((c) => attendance[c.id]?.status === "Present").length;
  const absentCount = searchedCampers.filter((c) => attendance[c.id]?.status === "Absent").length;
  const lateCount = searchedCampers.filter((c) => attendance[c.id]?.status === "Late").length;
  const checkedOutCount = searchedCampers.filter((c) => attendance[c.id]?.status === "Checked Out").length;
  const notMarkedCount = searchedCampers.filter((c) => !attendance[c.id]).length;

  function handleCampChange(value) {
    setCampFilter(value);
    setTeamFilter("");
    setSelectedLineKey("");
  }

  function selectLine(campValue, rangeId) {
    setCampFilter(campValue);
    setTeamFilter("");
    setSelectedLineKey(`${campValue}::${rangeId}`);
  }

  function clearLineFilter() {
    setSelectedLineKey("");
    if (blockCampValues.length) {
      setCampFilter("");
      setTeamFilter("");
    }
  }

  return (
    <>
      <section className="panel attendance-page-header">
        <h2>Attendance</h2>

        <div className="attendance-session-row">
          <select
            className="session-select-prominent"
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
              setSelectedLineKey("");
              setCampFilter("");
              setTeamFilter("");
            }}
          >
            <option value="">Select Session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {sessionDisplayName(s)}
              </option>
            ))}
          </select>

          <button className="secondary-small-button" onClick={createSession}>
            + Session
          </button>

          <button className="danger-small-button" onClick={() => deleteSession(selectedSession)}>
            Delete
          </button>
        </div>

        <div className="block-session-panel">
          <div>
            <strong>Pre-Made Block Sessions</strong>
            <p>Create all sessions for a block without deleting previous attendance.</p>
          </div>

          <div className="block-session-buttons">
            <button className="line-button" onClick={() => createBlockSessions("Block 1")}>
              Block 1 • 4 Sessions
            </button>
            <button className="line-button" onClick={() => createBlockSessions("Block 2")}>
              Block 2 • 6 Sessions
            </button>
            <button className="line-button" onClick={() => createBlockSessions("Block 3")}>
              Block 3 • 8 Sessions
            </button>
            <button className="line-button" onClick={() => createBlockSessions("Block 4")}>
              Block 4 • 9 Sessions
            </button>
          </div>
        </div>

        <div className="attendance-filters">
          <select value={campFilter} onChange={(e) => handleCampChange(e.target.value)}>
            <option value="">{selectedBlock ? `${selectedBlock} Camps` : "All Camps"}</option>
            {CAMP_OPTIONS.map((camp) => (
              <option key={camp.value} value={camp.value}>
                {camp.label}
              </option>
            ))}
          </select>

          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">All Teams</option>
            {visibleTeams.map(([team]) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Not Marked">Not Marked</option>
          </select>
        </div>

        <div className="checkin-line-panel">
          <div>
            <strong>Check-In Lines</strong>
            {selectedBlock ? (
              <p>{selectedBlock} lines are shown below. Pick the camp line your check-in table is handling.</p>
            ) : campFilter ? (
              <p>{campLabel(campFilter)} lines split by last name.</p>
            ) : (
              <p>Select a block session or choose a camp to show automatic A-Z line buttons.</p>
            )}
          </div>

          {lineGroups.length > 0 ? (
            <div className="block-line-groups">
              <button
                className={!selectedLineKey ? "line-button active" : "line-button"}
                onClick={clearLineFilter}
              >
                {selectedBlock ? `${selectedBlock}: All Lines` : "All Lines"}
              </button>

              {lineGroups.map((group) => (
                <div className="line-camp-group" key={group.camp.value}>
                  <strong>{group.camp.label}</strong>
                  <div className="checkin-line-buttons">
                    {group.ranges.map((range) => {
                      const key = `${group.camp.value}::${range.id}`;
                      return (
                        <button
                          key={key}
                          className={selectedLineKey === key ? "line-button active" : "line-button"}
                          onClick={() => selectLine(group.camp.value, range.id)}
                        >
                          Line {range.lineNumber}: {range.label}
                          <span>{range.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <input
          className="search"
          placeholder="Search camper, team, court, coach..."
          value={attendanceSearch}
          onChange={(e) => setAttendanceSearch(e.target.value)}
        />
      </section>

      <section className="stats attendance-stats">
        <div><span>Total</span><strong>{total}</strong></div>
        <div><span>Present</span><strong>{presentCount}</strong></div>
        <div><span>Absent</span><strong>{absentCount}</strong></div>
        <div><span>Late</span><strong>{lateCount}</strong></div>
        <div><span>Checked Out</span><strong>{checkedOutCount}</strong></div>
        <div><span>Not Marked</span><strong>{notMarkedCount}</strong></div>
      </section>

      <section className="attendance-list compact-attendance-list">
        {searchedCampers.map((c) => {
          const info = teamDetails[c.main_team] || {};
          const status = attendance[c.id]?.status || "Not Marked";

          return (
            <div className="attendance-row compact-attendance-row" key={c.id}>
              <div className="attendance-person">
                <h3>{c.first_name} {c.last_name}</h3>

                <p>
                  {info.camp_id || "—"} | {c.main_team || "—"} | {info.court || "—"} | {c.primary_position || "—"}
                </p>

                <span className={`status-pill status-${status.replaceAll(" ", "-").toLowerCase()}`}>
                  {status}
                </span>
              </div>

              <div className="attendance-buttons compact-buttons">
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

                <button
                  className="undo-attendance"
                  disabled={status === "Not Marked"}
                  onClick={() => clearAttendance(c.id)}
                >
                  Undo
                </button>
              </div>

              <textarea
                className="attendance-notes compact-notes"
                placeholder="Notes:"
                value={attendance[c.id]?.notes || ""}
                onChange={(e) => updateAttendanceNotes(c.id, e.target.value)}
              />
            </div>
          );
        })}
      </section>
    </>
  );
}
