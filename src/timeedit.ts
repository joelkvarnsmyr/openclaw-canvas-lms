import type { TimeEditEvent } from "./types.js";

const DEFAULT_KEYWORD_MAP: Array<[string, string]> = [
  ["dante", "digitala mixerbord"],
  ["signalvagar", "digitala mixerbord"],
  ["signalvägar", "digitala mixerbord"],
  ["akustik", "akustik"],
  ["loudness", "equal loudness"],
  ["immersiv", "immersiv"],
  ["spatialt", "immersiv"],
  ["dolby atmos", "dolby atmos"],
  ["aes", "aes"],
  ["ai inom", "ai"],
  ["seminarium", "seminarium"],
  ["mixning", "mix"],
  ["lab", "lab"],
];

export function parseIcs(text: string): TimeEditEvent[] {
  // Unfold long lines (RFC 5545)
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.includes("\r\n")
    ? unfolded.split("\r\n")
    : unfolded.split("\n");

  const events: TimeEditEvent[] = [];
  let current: Partial<TimeEditEvent> | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "BEGIN:VEVENT") {
      current = {};
    } else if (line === "END:VEVENT" && current) {
      events.push(current as TimeEditEvent);
      current = null;
    } else if (current && line.includes(":")) {
      const colonIdx = line.indexOf(":");
      const keyPart = line.substring(0, colonIdx);
      const val = line.substring(colonIdx + 1);
      const key = keyPart.split(";")[0];

      if (key === "DTSTART") {
        current.start = parseDt(val);
      } else if (key === "DTEND") {
        current.end = parseDt(val);
      } else if (key === "SUMMARY") {
        current.summary = val.replace(/\\,/g, ",").replace(/\\n/g, "\n");
      } else if (key === "LOCATION") {
        current.location = val.replace(/\\,/g, ",");
      } else if (key === "DESCRIPTION") {
        current.description = val.replace(/\\,/g, ",").replace(/\\n/g, "\n");
      }
    }
  }

  return events;
}

function parseDt(s: string): Date | undefined {
  const trimmed = s.trim();
  try {
    if (trimmed.endsWith("Z")) {
      // 20260220T083000Z
      return parseIcsDate(trimmed.slice(0, -1));
    } else if (trimmed.includes("T")) {
      return parseIcsDate(trimmed);
    } else {
      // Date only: 20260220
      const y = parseInt(trimmed.substring(0, 4));
      const m = parseInt(trimmed.substring(4, 6)) - 1;
      const d = parseInt(trimmed.substring(6, 8));
      return new Date(Date.UTC(y, m, d));
    }
  } catch {
    return undefined;
  }
}

function parseIcsDate(s: string): Date {
  const y = parseInt(s.substring(0, 4));
  const m = parseInt(s.substring(4, 6)) - 1;
  const d = parseInt(s.substring(6, 8));
  const h = parseInt(s.substring(9, 11));
  const min = parseInt(s.substring(11, 13));
  const sec = parseInt(s.substring(13, 15));
  return new Date(Date.UTC(y, m, d, h, min, sec));
}

export function matchAssignmentToEvents(
  assignmentName: string,
  events: TimeEditEvent[],
  keywordMap: Array<[string, string]> = DEFAULT_KEYWORD_MAP
): TimeEditEvent[] {
  const nameLower = assignmentName.toLowerCase();
  const matches: TimeEditEvent[] = [];

  for (const [kwCanvas, kwTimeedit] of keywordMap) {
    if (nameLower.includes(kwCanvas)) {
      for (const ev of events) {
        const evText = (
          (ev.summary ?? "") +
          " " +
          (ev.description ?? "")
        ).toLowerCase();
        if (evText.includes(kwTimeedit)) {
          matches.push(ev);
        }
      }
    }
  }

  // Deduplicate by start time
  const seen = new Set<string>();
  const unique: TimeEditEvent[] = [];
  for (const m of matches) {
    const key = String(m.start?.getTime() ?? "none");
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(m);
    }
  }

  return unique.sort((a, b) => {
    const at = a.start?.getTime() ?? 0;
    const bt = b.start?.getTime() ?? 0;
    return at - bt;
  });
}

export async function fetchTimeEditIcs(url: string): Promise<TimeEditEvent[]> {
  const response = await fetch(url, {
    headers: { "User-Agent": "openclaw-canvas-lms/1.0.0" },
  });
  if (!response.ok) {
    throw new Error(`TimeEdit fetch failed: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseIcs(text);
}

export interface CrossRefResult {
  assignment: string;
  assignment_id: number;
  canvas_due_date: string | null;
  has_due_date: boolean;
  points_possible: number | null;
  html_url: string | null;
  matched_events: Array<{
    date: string | null;
    time: string | null;
    end_time: string | null;
    summary: string;
    location: string;
  }>;
  implied_deadline?: string;
  implied_reason?: string;
}

export function crossReference(
  assignments: Array<{
    id: number;
    name: string;
    due_at?: string | null;
    points_possible?: number | null;
    html_url?: string | null;
  }>,
  events: TimeEditEvent[],
  daysAhead: number = 30
): CrossRefResult[] {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const relevant = events.filter(
    (e) => e.start && e.start <= cutoff
  );

  const results: CrossRefResult[] = [];

  for (const a of assignments) {
    const matchedEvents = matchAssignmentToEvents(a.name, relevant);

    const entry: CrossRefResult = {
      assignment: a.name,
      assignment_id: a.id,
      canvas_due_date: a.due_at ?? null,
      has_due_date: a.due_at != null,
      points_possible: a.points_possible ?? null,
      html_url: a.html_url ?? null,
      matched_events: matchedEvents.map((ev) => ({
        date: ev.start ? formatDate(ev.start) : null,
        time: ev.start ? formatTime(ev.start) : null,
        end_time: ev.end ? formatTime(ev.end) : null,
        summary: (ev.description ?? ev.summary ?? "").substring(0, 120),
        location: ev.location ?? "",
      })),
    };

    if (!a.due_at && matchedEvents.length > 0) {
      const lastEvent = matchedEvents[matchedEvents.length - 1];
      if (lastEvent.start) {
        entry.implied_deadline = formatDate(lastEvent.start);
        entry.implied_reason = `Last matching event: ${(
          lastEvent.description ??
          lastEvent.summary ??
          ""
        ).substring(0, 80)}`;
      }
    }

    results.push(entry);
  }

  // Sort: undated with matches first, then by date
  results.sort((a, b) => {
    if (a.has_due_date !== b.has_due_date) return a.has_due_date ? 1 : -1;
    const aDate = a.implied_deadline ?? a.canvas_due_date?.substring(0, 10) ?? "9999";
    const bDate = b.implied_deadline ?? b.canvas_due_date?.substring(0, 10) ?? "9999";
    return aDate.localeCompare(bDate);
  });

  return results;
}

function formatDate(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function formatTime(d: Date): string {
  return d.toISOString().substring(11, 16);
}
